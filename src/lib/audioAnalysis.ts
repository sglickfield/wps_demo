/**
 * Browser-only audio helpers: decode, energy envelope, simple talk-spurt VAD.
 */

export interface EnergyFrame {
  timeSec: number;
  energy: number;
}

export interface TalkSpurt {
  startSec: number;
  endSec: number;
  meanEnergy: number;
}

export interface AudioProfile {
  durationSec: number;
  sampleRate: number;
  /** Normalized 0–1 energy samples for waveform UI */
  waveform: number[];
  energy: EnergyFrame[];
  spurts: TalkSpurt[];
}

function rms(buf: Float32Array, start: number, end: number): number {
  let s = 0;
  const n = end - start;
  if (n <= 0) return 0;
  for (let i = start; i < end; i++) {
    const v = buf[i];
    s += v * v;
  }
  return Math.sqrt(s / n);
}

export async function decodeAudioFile(
  source: ArrayBuffer | string
): Promise<{ buffer: AudioBuffer; ctx: AudioContext }> {
  const ctx = new AudioContext();
  let data: ArrayBuffer;
  if (typeof source === "string") {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Failed to load audio (${res.status})`);
    data = await res.arrayBuffer();
  } else {
    data = source;
  }
  const buffer = await ctx.decodeAudioData(data.slice(0));
  return { buffer, ctx };
}

export function profileAudio(
  buffer: AudioBuffer,
  opts?: { hopSec?: number; frameSec?: number; waveformPoints?: number }
): AudioProfile {
  const hopSec = opts?.hopSec ?? 0.05;
  const frameSec = opts?.frameSec ?? 0.05;
  const waveformPoints = opts?.waveformPoints ?? 240;

  const ch = buffer.getChannelData(0);
  const sr = buffer.sampleRate;
  const durationSec = buffer.duration;
  const frame = Math.max(1, Math.floor(frameSec * sr));
  const hop = Math.max(1, Math.floor(hopSec * sr));

  const energy: EnergyFrame[] = [];
  let maxE = 1e-9;
  for (let i = 0; i + frame < ch.length; i += hop) {
    const e = rms(ch, i, i + frame);
    maxE = Math.max(maxE, e);
    energy.push({ timeSec: i / sr, energy: e });
  }
  // normalize
  for (const f of energy) f.energy = f.energy / maxE;

  // waveform downsampling (peak)
  const waveform: number[] = [];
  const block = Math.max(1, Math.floor(ch.length / waveformPoints));
  for (let p = 0; p < waveformPoints; p++) {
    const start = p * block;
    const end = Math.min(ch.length, start + block);
    let peak = 0;
    for (let i = start; i < end; i++) peak = Math.max(peak, Math.abs(ch[i]));
    waveform.push(peak);
  }
  const wmax = Math.max(...waveform, 1e-9);
  for (let i = 0; i < waveform.length; i++) waveform[i] /= wmax;

  // simple energy VAD → talk spurts
  const thresh = 0.12;
  const minSpurtSec = 0.25;
  const spurts: TalkSpurt[] = [];
  let active: { start: number; sum: number; n: number } | null = null;

  const flush = (endSec: number) => {
    if (!active) return;
    const dur = endSec - active.start;
    if (dur >= minSpurtSec) {
      spurts.push({
        startSec: active.start,
        endSec,
        meanEnergy: active.sum / Math.max(1, active.n),
      });
    }
    active = null;
  };

  for (const f of energy) {
    if (f.energy >= thresh) {
      if (!active) active = { start: f.timeSec, sum: 0, n: 0 };
      active.sum += f.energy;
      active.n += 1;
    } else if (active) {
      flush(f.timeSec);
    }
  }
  if (active) flush(durationSec);

  // merge spurts separated by < 0.35s
  const merged: TalkSpurt[] = [];
  for (const s of spurts) {
    const last = merged[merged.length - 1];
    if (last && s.startSec - last.endSec < 0.35) {
      last.endSec = s.endSec;
      last.meanEnergy = (last.meanEnergy + s.meanEnergy) / 2;
    } else {
      merged.push({ ...s });
    }
  }

  return {
    durationSec,
    sampleRate: sr,
    waveform,
    energy,
    spurts: merged,
  };
}

/**
 * Assign alternating speaker labels to talk spurts for 2-person sessions.
 * First spurt defaults to therapist (clinician typically opens).
 */
export function labelSpurtsAlternating(
  spurts: TalkSpurt[],
  firstSpeaker: "therapist" | "client" = "therapist"
): { startSec: number; endSec: number; speaker: "therapist" | "client"; meanEnergy: number }[] {
  let speaker = firstSpeaker;
  return spurts.map((s) => {
    const row = {
      startSec: s.startSec,
      endSec: s.endSec,
      speaker,
      meanEnergy: s.meanEnergy,
    };
    speaker = speaker === "therapist" ? "client" : "therapist";
    return row;
  });
}

export function speakingTimeFromLabels(
  labels: { startSec: number; endSec: number; speaker: "therapist" | "client" }[]
): { therapist: number; client: number } {
  let therapist = 0;
  let client = 0;
  for (const l of labels) {
    const d = Math.max(0, l.endSec - l.startSec);
    if (l.speaker === "therapist") therapist += d;
    else client += d;
  }
  return { therapist, client };
}
