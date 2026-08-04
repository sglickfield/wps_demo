import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Badge, Button, Card, Field, PageHeader, TextLink } from "../components/ui";
import {
  decodeAudioFile,
  labelSpurtsAlternating,
  profileAudio,
  type AudioProfile,
} from "../lib/audioAnalysis";
import { ageFromDob, formatDate } from "../lib/format";
import {
  analyzeSession,
  turnsFromLiveChunks,
  type SessionAnalysis,
} from "../lib/sessionAnalytics";
import {
  LiveSessionRecognizer,
  speechRecognitionSupported,
} from "../lib/webSpeech";
import {
  SAMPLE_SESSION_META,
  SAMPLE_TRANSCRIPT,
  type SpeakerRole,
  type TranscriptTurn,
} from "../mock/sampleSession";
import { useStore } from "../mock/store";
import type { SessionRecording, SessionRecordingMode } from "../types";

type Mode = SessionRecordingMode;
type Phase = "idle" | "loading" | "ready" | "analyzing" | "done" | "error";

function pct(n: number): string {
  return `${Math.round(n)}%`;
}

function scoreTone(score: number): string {
  if (score >= 80) return "success";
  if (score >= 60) return "info";
  if (score >= 40) return "warning";
  return "danger";
}

function Waveform({
  waveform,
  labels,
  durationSec,
  currentTime,
}: {
  waveform: number[];
  labels?: { startSec: number; endSec: number; speaker: SpeakerRole }[];
  durationSec: number;
  currentTime?: number;
}) {
  const w = 640;
  const h = 88;
  const mid = h / 2;
  const pts = waveform
    .map((v, i) => {
      const x = (i / Math.max(1, waveform.length - 1)) * w;
      const amp = v * (mid - 4);
      return `${x},${mid - amp} ${x},${mid + amp}`;
    })
    .join(" ");

  return (
    <svg
      className="waveform"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Session waveform"
    >
      <rect x={0} y={0} width={w} height={h} fill="#f0f4f7" rx={8} />
      {labels?.map((l, i) => {
        const x = (l.startSec / durationSec) * w;
        const width = Math.max(2, ((l.endSec - l.startSec) / durationSec) * w);
        return (
          <rect
            key={i}
            x={x}
            y={4}
            width={width}
            height={h - 8}
            fill={l.speaker === "therapist" ? "rgba(13,110,110,0.18)" : "rgba(30,58,95,0.18)"}
          />
        );
      })}
      <polyline
        fill="none"
        stroke="#1e3a5f"
        strokeWidth={1.25}
        points={waveform
          .map((v, i) => {
            const x = (i / Math.max(1, waveform.length - 1)) * w;
            const y = mid - v * (mid - 6);
            return `${x},${y}`;
          })
          .join(" ")}
      />
      <polyline
        fill="none"
        stroke="#1e3a5f"
        strokeWidth={1.25}
        opacity={0.35}
        points={waveform
          .map((v, i) => {
            const x = (i / Math.max(1, waveform.length - 1)) * w;
            const y = mid + v * (mid - 6);
            return `${x},${y}`;
          })
          .join(" ")}
      />
      {currentTime != null && durationSec > 0 ? (
        <line
          x1={(currentTime / durationSec) * w}
          x2={(currentTime / durationSec) * w}
          y1={0}
          y2={h}
          stroke="#0d6e6e"
          strokeWidth={2}
        />
      ) : null}
      <text x={8} y={h - 8} fontSize={10} fill="#8b97a8">
        {pts ? "" : ""}
      </text>
    </svg>
  );
}

function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="metric-tile">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {hint ? <div className="faint">{hint}</div> : null}
    </div>
  );
}

function analysisFromSaved(rec: SessionRecording): SessionAnalysis {
  return analyzeSession(
    rec.turns.map((t) => ({
      id: t.id,
      speaker: t.speaker,
      text: t.text,
      startSec: t.startSec,
      endSec: t.endSec,
    })),
    rec.durationSec
  );
}

export function RecordingAnalyticsPage() {
  const {
    clients,
    getClient,
    saveSessionRecording,
    getSessionRecording,
    sessionsForClient,
  } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const clientId = searchParams.get("clientId") ?? "";
  const sessionIdParam = searchParams.get("sessionId");
  const client = clientId ? getClient(clientId) : undefined;

  const [pickerId, setPickerId] = useState(clients[0]?.id ?? "");
  const [mode, setMode] = useState<Mode>("demo");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<AudioProfile | null>(null);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [analysis, setAnalysis] = useState<SessionAnalysis | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [liveSpeaker, setLiveSpeaker] = useState<SpeakerRole>("therapist");
  const [liveStatus, setLiveStatus] = useState<string>("Ready");
  const [interim, setInterim] = useState("");
  const [spurtLabels, setSpurtLabels] = useState<
    { startSec: number; endSec: number; speaker: SpeakerRole }[]
  >([]);
  const [savedRec, setSavedRec] = useState<SessionRecording | null>(null);
  const [saving, setSaving] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognizerRef = useRef<LiveSessionRecognizer | null>(null);
  const liveChunksRef = useRef<
    { speaker: SpeakerRole; text: string; startSec: number; endSec: number }[]
  >([]);
  const liveStartedAt = useRef<number>(0);
  const objectUrlRef = useRef<string | null>(null);
  const modeRef = useRef<Mode>("demo");

  const speechOk = useMemo(() => speechRecognitionSupported(), []);
  const clientSessions = clientId ? sessionsForClient(clientId) : [];

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    return () => {
      recognizerRef.current?.stop();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  // Load a previously saved session when sessionId is present
  useEffect(() => {
    if (!sessionIdParam || !client) return;
    const rec = getSessionRecording(sessionIdParam);
    if (!rec || rec.clientId !== client.id) {
      setError("Session recording not found for this client.");
      return;
    }
    setSavedRec(rec);
    setMode(rec.mode);
    const result = analysisFromSaved(rec);
    setAnalysis(result);
    setTurns(result.turns);
    setSpurtLabels(
      result.turns.map((t) => ({
        startSec: t.startSec,
        endSec: t.endSec,
        speaker: t.speaker,
      }))
    );
    const points = 120;
    const wave = Array.from({ length: points }, (_, i) => {
      const t = (i / points) * rec.durationSec;
      const hit = result.turns.some((x) => t >= x.startSec && t <= x.endSec);
      return hit ? 0.55 + (i % 7) * 0.04 : 0.05;
    });
    setProfile({
      durationSec: rec.durationSec,
      sampleRate: 0,
      waveform: wave,
      energy: [],
      spurts: result.turns.map((t) => ({
        startSec: t.startSec,
        endSec: t.endSec,
        meanEnergy: 0.5,
      })),
    });
    if (rec.mode === "demo") {
      setAudioUrl(SAMPLE_SESSION_META.audioUrl);
    }
    setPhase("done");
  }, [sessionIdParam, client, getSessionRecording]);

  const persistAnalysis = useCallback(
    async (result: SessionAnalysis, analysisMode: Mode) => {
      if (!client) return;
      setSaving(true);
      try {
        const title =
          analysisMode === "demo"
            ? SAMPLE_SESSION_META.title
            : analysisMode === "live"
              ? `Live session — ${formatDate(new Date().toISOString())}`
              : `Uploaded session — ${formatDate(new Date().toISOString())}`;
        const rec = await saveSessionRecording({
          clientId: client.id,
          title,
          mode: analysisMode,
          analysis: result,
        });
        setSavedRec(rec);
        setSearchParams(
          { clientId: client.id, sessionId: rec.id },
          { replace: true }
        );
      } finally {
        setSaving(false);
      }
    },
    [client, saveSessionRecording, setSearchParams]
  );

  const runAnalysis = useCallback(
    (sessionTurns: TranscriptTurn[], durationSec: number) => {
      setPhase("analyzing");
      setSavedRec(null);
      window.setTimeout(() => {
        const result = analyzeSession(sessionTurns, durationSec);
        setAnalysis(result);
        setTurns(sessionTurns);
        setPhase("done");
        void persistAnalysis(result, modeRef.current);
      }, 350);
    },
    [persistAnalysis]
  );

  const loadDemo = async () => {
    setError(null);
    setPhase("loading");
    setAnalysis(null);
    setMode("demo");
    try {
      const { buffer, ctx } = await decodeAudioFile(SAMPLE_SESSION_META.audioUrl);
      const prof = profileAudio(buffer);
      const labels = labelSpurtsAlternating(prof.spurts, "therapist");
      setProfile(prof);
      setSpurtLabels(labels);
      setAudioUrl(SAMPLE_SESSION_META.audioUrl);
      setTurns(SAMPLE_TRANSCRIPT);
      setPhase("ready");
      await ctx.close().catch(() => undefined);
      runAnalysis(SAMPLE_TRANSCRIPT, prof.durationSec || SAMPLE_SESSION_META.durationSec);
    } catch (e) {
      setPhase("error");
      setError(e instanceof Error ? e.message : "Could not load demo audio");
    }
  };

  const onUpload = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setPhase("loading");
    setAnalysis(null);
    setMode("upload");
    setTurns([]);
    try {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setAudioUrl(url);
      const data = await file.arrayBuffer();
      const { buffer, ctx } = await decodeAudioFile(data);
      const prof = profileAudio(buffer);
      const labels = labelSpurtsAlternating(prof.spurts, "therapist");
      setProfile(prof);
      setSpurtLabels(labels);
      // Without ASR on arbitrary files, synthesize placeholder turns from spurts
      // so engagement timing still runs; vocabulary needs live/demo transcript.
      const synthetic: TranscriptTurn[] = labels.map((l, i) => ({
        id: `up-${i}`,
        speaker: l.speaker,
        text:
          l.speaker === "therapist"
            ? `(Therapist segment ${i + 1} — upload transcription not available offline)`
            : `(Client segment ${i + 1} — upload transcription not available offline)`,
        startSec: l.startSec,
        endSec: l.endSec,
      }));
      setTurns(synthetic);
      setPhase("ready");
      await ctx.close().catch(() => undefined);
      // Only full vocab analysis when we have real words; still compute timing
      runAnalysis(synthetic, prof.durationSec);
    } catch (e) {
      setPhase("error");
      setError(e instanceof Error ? e.message : "Could not decode audio file");
    }
  };

  const startLive = () => {
    if (!speechOk) {
      setError("Live transcription requires Chrome or Edge with microphone access.");
      return;
    }
    setMode("live");
    setError(null);
    setAnalysis(null);
    setProfile(null);
    setSpurtLabels([]);
    setAudioUrl(null);
    setTurns([]);
    liveChunksRef.current = [];
    liveStartedAt.current = performance.now();
    setInterim("");
    setLiveStatus("Listening…");
    setPhase("ready");

    recognizerRef.current?.stop();
    recognizerRef.current = new LiveSessionRecognizer(
      ({ transcript, isFinal }) => {
        if (!isFinal) {
          setInterim(transcript);
          return;
        }
        setInterim("");
        const now = (performance.now() - liveStartedAt.current) / 1000;
        const text = transcript.trim();
        if (!text) return;
        const prev = liveChunksRef.current[liveChunksRef.current.length - 1];
        const startSec = prev ? prev.endSec + 0.15 : Math.max(0, now - 2);
        const chunk = {
          speaker: liveSpeaker,
          text,
          startSec,
          endSec: Math.max(startSec + 0.5, now),
        };
        liveChunksRef.current = [...liveChunksRef.current, chunk];
        setTurns(turnsFromLiveChunks(liveChunksRef.current));
      },
      (status, detail) => {
        if (status === "listening") setLiveStatus("Listening…");
        else if (status === "stopped") setLiveStatus("Stopped");
        else setLiveStatus(detail ? `Error: ${detail}` : "Error");
      }
    );
    recognizerRef.current.start();
  };

  const stopLiveAndAnalyze = () => {
    recognizerRef.current?.stop();
    setLiveStatus("Stopped");
    const sessionTurns = turnsFromLiveChunks(liveChunksRef.current);
    if (!sessionTurns.length) {
      setError("No final speech captured. Try again and speak clearly.");
      setPhase("error");
      return;
    }
    const durationSec = Math.max(
      ...sessionTurns.map((t) => t.endSec),
      (performance.now() - liveStartedAt.current) / 1000
    );
    setSpurtLabels(
      sessionTurns.map((t) => ({
        startSec: t.startSec,
        endSec: t.endSec,
        speaker: t.speaker,
      }))
    );
    // Minimal waveform from turn activity
    const points = 120;
    const wave = Array.from({ length: points }, (_, i) => {
      const t = (i / points) * durationSec;
      const hit = sessionTurns.some((x) => t >= x.startSec && t <= x.endSec);
      return hit ? 0.55 + (i % 7) * 0.04 : 0.05;
    });
    setProfile({
      durationSec,
      sampleRate: 0,
      waveform: wave,
      energy: [],
      spurts: sessionTurns.map((t) => ({
        startSec: t.startSec,
        endSec: t.endSec,
        meanEnergy: 0.5,
      })),
    });
    runAnalysis(sessionTurns, durationSec);
  };

  // Require a specific client before analysis
  if (!clientId) {
    return (
      <>
        <PageHeader
          title="Session recording analytics"
          subtitle="Choose a client record. Every language-sample analysis is stored on that client."
          actions={
            <Link to="/clients">
              <Button variant="secondary">All clients</Button>
            </Link>
          }
        />
        <Card>
          <h2 style={{ fontSize: "1.1rem" }}>Select client</h2>
          <p className="muted" style={{ fontSize: 14 }}>
            Session analytics must be tied to an examinee. Pick a client to open
            their language-sample workspace.
          </p>
          <Field label="Client">
            <select
              value={pickerId}
              onChange={(e) => setPickerId(e.target.value)}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.mrn ? ` · ${c.mrn}` : ""}
                </option>
              ))}
            </select>
          </Field>
          <div className="row-actions">
            <Button
              disabled={!pickerId}
              onClick={() =>
                navigate(`/session-analytics?clientId=${pickerId}`)
              }
            >
              Open client session analytics
            </Button>
            <Link to="/clients/new">
              <Button variant="secondary">New client</Button>
            </Link>
          </div>
        </Card>
      </>
    );
  }

  if (!client) {
    return (
      <Card>
        <p>Client not found.</p>
        <TextLink to="/session-analytics">Choose another client</TextLink>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title="Session recording analytics"
        subtitle={`${client.name} · ${ageFromDob(client.dob)} yrs · language-sample review (Therapist vs Client)`}
        actions={
          <>
            <Link to={`/clients/${client.id}`}>
              <Button variant="secondary">Client home</Button>
            </Link>
            <Link to="/session-analytics">
              <Button variant="ghost">Switch client</Button>
            </Link>
          </>
        }
      />

      <Card>
        <div className="analytics-intro">
          <div>
            <h2 style={{ fontSize: "1.1rem", marginBottom: 6 }}>
              Client-linked session
            </h2>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>
              Analyses are saved to <strong>{client.name}</strong>
              {client.mrn ? ` (${client.mrn})` : ""}. Browser-only processing
              (Web Audio + optional Web Speech). Speaker roles:{" "}
              <strong>Therapist</strong> and <strong>Client</strong>.
            </p>
          </div>
          <div>
            <p className="faint" style={{ margin: "0 0 6px" }}>
              Prior sessions for this client
            </p>
            {clientSessions.length ? (
              <ul className="analytics-list" style={{ margin: 0 }}>
                {clientSessions.slice(0, 4).map((s) => (
                  <li key={s.id}>
                    <TextLink
                      to={`/session-analytics?clientId=${client.id}&sessionId=${s.id}`}
                    >
                      {s.title}
                    </TextLink>
                    <span className="faint">
                      {" "}
                      · engagement {s.engagementScore}/100 ·{" "}
                      {formatDate(s.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="faint" style={{ margin: 0 }}>
                No saved sessions yet.
              </p>
            )}
          </div>
        </div>

        <div className="mode-tabs" role="tablist">
          <button
            type="button"
            className={mode === "demo" ? "active" : ""}
            onClick={() => setMode("demo")}
          >
            Demo session
          </button>
          <button
            type="button"
            className={mode === "live" ? "active" : ""}
            onClick={() => setMode("live")}
          >
            Live mic
          </button>
          <button
            type="button"
            className={mode === "upload" ? "active" : ""}
            onClick={() => setMode("upload")}
          >
            Upload audio
          </button>
        </div>

        {mode === "demo" ? (
          <div className="stack" style={{ marginTop: 12 }}>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>
              <strong>{SAMPLE_SESSION_META.title}.</strong>{" "}
              {SAMPLE_SESSION_META.description} {SAMPLE_SESSION_META.sourceNote}
            </p>
            <div className="row-actions">
              <Button onClick={loadDemo} disabled={phase === "loading" || phase === "analyzing"}>
                {phase === "loading"
                  ? "Loading audio…"
                  : phase === "analyzing"
                    ? "Analyzing…"
                    : "Load & analyze demo session"}
              </Button>
            </div>
          </div>
        ) : null}

        {mode === "live" ? (
          <div className="stack" style={{ marginTop: 12 }}>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>
              Capture a short two-person session on this device. Toggle the active
              speaker as each person talks; finals are diarized and analyzed for
              the client role. {speechOk ? null : (
                <span className="badge danger" style={{ marginLeft: 6 }}>
                  Web Speech unavailable
                </span>
              )}
            </p>
            <div className="row-actions" style={{ alignItems: "center" }}>
              <span className="faint">Active speaker:</span>
              <Button
                variant={liveSpeaker === "therapist" ? "primary" : "secondary"}
                onClick={() => setLiveSpeaker("therapist")}
              >
                Therapist
              </Button>
              <Button
                variant={liveSpeaker === "client" ? "primary" : "secondary"}
                onClick={() => setLiveSpeaker("client")}
              >
                Client
              </Button>
              <Button onClick={startLive} disabled={!speechOk}>
                Start listening
              </Button>
              <Button variant="secondary" onClick={stopLiveAndAnalyze}>
                Stop & analyze
              </Button>
              <Badge tone="info">{liveStatus}</Badge>
            </div>
            {interim ? (
              <p className="faint" style={{ fontStyle: "italic" }}>
                Interim: {interim}
              </p>
            ) : null}
          </div>
        ) : null}

        {mode === "upload" ? (
          <div className="stack" style={{ marginTop: 12 }}>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>
              Upload a mono recording with two speakers. Browser energy VAD
              segments talk spurts and alternates Therapist → Client labels.
              Full vocabulary scoring needs the demo transcript or live
              recognition (file ASR is not bundled).
            </p>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
            />
          </div>
        ) : null}

        {error ? (
          <p style={{ color: "var(--danger)", marginTop: 12, marginBottom: 0 }}>
            {error}
          </p>
        ) : null}
      </Card>

      {audioUrl || profile ? (
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            <h2 style={{ fontSize: "1.05rem", margin: 0 }}>Recording</h2>
            <div className="row-actions">
              <span className="legend-swatch therapist" /> Therapist
              <span className="legend-swatch client" /> Client
            </div>
          </div>
          {profile ? (
            <Waveform
              waveform={profile.waveform}
              labels={spurtLabels}
              durationSec={profile.durationSec || 1}
              currentTime={currentTime}
            />
          ) : null}
          {audioUrl ? (
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              style={{ width: "100%", marginTop: 12 }}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            />
          ) : null}
          <p className="faint" style={{ marginTop: 8, marginBottom: 0 }}>
            Duration{" "}
            {(profile?.durationSec ?? analysis?.durationSec ?? 0).toFixed(1)}s
            {` · Linked client: ${client.name}`}
            {phase === "analyzing" ? " · Running analytics…" : null}
            {saving ? " · Saving to client record…" : null}
            {savedRec && !saving
              ? ` · Saved as ${savedRec.id}`
              : null}
          </p>
        </Card>
      ) : null}

      {turns.length > 0 ? (
        <Card>
          <h2 style={{ fontSize: "1.05rem" }}>Diarized transcript</h2>
          <p className="muted" style={{ fontSize: 14 }}>
            Speaker roles fixed as Therapist and Client for WPS-style language
            sample review.
          </p>
          <div className="transcript-list">
            {turns.map((t) => (
              <div
                key={t.id}
                className={`transcript-turn ${t.speaker}`}
              >
                <div className="transcript-meta">
                  <Badge tone={t.speaker === "therapist" ? "info" : "success"}>
                    {t.speaker === "therapist" ? "Therapist" : "Client"}
                  </Badge>
                  <span className="faint">
                    {t.startSec.toFixed(1)}s – {t.endSec.toFixed(1)}s
                  </span>
                </div>
                <p style={{ margin: "6px 0 0" }}>{t.text}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {analysis ? (
        <>
          <div className="grid-3" style={{ marginTop: 0 }}>
            <Card className="stat-card">
              <h3>Client engagement</h3>
              <div className="value">
                {analysis.engagement.engagementScore}
                <span className="faint" style={{ fontSize: "1rem" }}>
                  /100
                </span>
              </div>
              <Badge tone={scoreTone(analysis.engagement.engagementScore)}>
                composite score
              </Badge>
            </Card>
            <Card className="stat-card">
              <h3>Client talk share</h3>
              <div className="value">
                {pct(analysis.engagement.clientTalkRatio * 100)}
              </div>
              <p className="faint" style={{ margin: 0 }}>
                of dyad speaking time
              </p>
            </Card>
            <Card className="stat-card">
              <h3>Lexical diversity (TTR)</h3>
              <div className="value">
                {analysis.client.typeTokenRatio.toFixed(2)}
              </div>
              <p className="faint" style={{ margin: 0 }}>
                {analysis.client.uniqueWords} unique / {analysis.client.totalWords}{" "}
                words
              </p>
            </Card>
          </div>

          <div className="grid-2">
            <Card>
              <h2 style={{ fontSize: "1.05rem" }}>Client vocabulary</h2>
              <div className="metric-grid">
                <MetricTile
                  label="Total words"
                  value={String(analysis.client.totalWords)}
                />
                <MetricTile
                  label="Unique words"
                  value={String(analysis.client.uniqueWords)}
                />
                <MetricTile
                  label="MLU (words)"
                  value={analysis.client.meanUtteranceLength.toFixed(1)}
                  hint="Mean length of utterance"
                />
                <MetricTile
                  label="Content density"
                  value={pct(analysis.client.contentRatio * 100)}
                  hint={`${analysis.client.contentWordCount} content words`}
                />
                <MetricTile
                  label="Turns"
                  value={String(analysis.client.turnCount)}
                />
                <MetricTile
                  label="Speaking time"
                  value={`${analysis.client.speakingTimeSec.toFixed(1)}s`}
                  hint={pct(analysis.client.speakingTimePct)}
                />
              </div>
              {analysis.client.topWords.length > 0 &&
              !analysis.client.topWords[0].word.startsWith("(") ? (
                <div style={{ marginTop: 14 }}>
                  <strong style={{ fontSize: 13 }}>Top content words</strong>
                  <div className="word-cloud">
                    {analysis.client.topWords.map((w) => (
                      <span key={w.word} className="word-chip">
                        {w.word} <em>{w.count}</em>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="faint" style={{ marginTop: 12 }}>
                  Vocabulary list populates when a real transcript is available
                  (demo or live mic).
                </p>
              )}
            </Card>

            <Card>
              <h2 style={{ fontSize: "1.05rem" }}>Engagement & contingency</h2>
              <div className="metric-grid">
                <MetricTile
                  label="Response rate"
                  value={pct(analysis.engagement.responseRate * 100)}
                  hint="Client replies after clinician questions"
                />
                <MetricTile
                  label="Therapist questions"
                  value={String(analysis.engagement.therapistQuestions)}
                />
                <MetricTile
                  label="Mean response latency"
                  value={`${analysis.engagement.meanResponseLatencySec.toFixed(2)}s`}
                />
                <MetricTile
                  label="Client initiative turns"
                  value={String(analysis.engagement.initiativeTurns)}
                />
                <MetricTile
                  label="Turn balance"
                  value={pct(analysis.engagement.turnBalance * 100)}
                  hint="Client share of turns"
                />
                <MetricTile
                  label="Therapist talk time"
                  value={`${analysis.therapist.speakingTimeSec.toFixed(1)}s`}
                />
              </div>
              <div className="progress-bar" style={{ marginTop: 16 }}>
                <i
                  style={{
                    width: `${analysis.engagement.engagementScore}%`,
                  }}
                />
              </div>
            </Card>
          </div>

          <Card>
            <h2 style={{ fontSize: "1.05rem" }}>Clinical-style narrative</h2>
            <p>{analysis.engagement.narrative}</p>
            {analysis.engagement.highlights.length ? (
              <>
                <h3 style={{ fontSize: "0.95rem", fontFamily: "var(--font)" }}>
                  Highlights
                </h3>
                <ul className="analytics-list">
                  {analysis.engagement.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </>
            ) : null}
            <h3 style={{ fontSize: "0.95rem", fontFamily: "var(--font)" }}>
              Recommendations
            </h3>
            <ul className="analytics-list">
              {analysis.engagement.recommendations.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="faint" style={{ marginBottom: 0 }}>
              Client: {client.name}
              {savedRec ? ` · Session ${savedRec.id}` : ""} · Generated{" "}
              {new Date(analysis.analyzedAt).toLocaleString()} · Demo analytics
              only — not a standardized WPS score, not for clinical decisions.
            </p>
            <div className="row-actions" style={{ marginTop: 12 }}>
              <Link to={`/clients/${client.id}`}>
                <Button variant="secondary">View on client home</Button>
              </Link>
            </div>
          </Card>
        </>
      ) : null}
    </>
  );
}
