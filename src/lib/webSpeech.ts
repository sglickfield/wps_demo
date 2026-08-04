/**
 * Thin wrapper around the browser Web Speech API for live session capture.
 * Chrome/Edge best support; Safari partial; Firefox often unavailable.
 */

export type LiveSpeechHandler = (evt: {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}) => void;

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [i: number]: {
      isFinal: boolean;
      [j: number]: { transcript: string; confidence: number };
    };
  };
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechRecognitionSupported(): boolean {
  return !!getRecognitionCtor();
}

export class LiveSessionRecognizer {
  private rec: SpeechRecognitionLike | null = null;
  private running = false;
  private wantRunning = false;

  constructor(
    private onSpeech: LiveSpeechHandler,
    private onStatus: (status: "listening" | "stopped" | "error", detail?: string) => void
  ) {}

  start(lang = "en-US") {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      this.onStatus("error", "Web Speech API is not available in this browser.");
      return;
    }
    this.wantRunning = true;
    this.rec = new Ctor();
    this.rec.continuous = true;
    this.rec.interimResults = true;
    this.rec.lang = lang;
    this.rec.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        const alt = res[0];
        this.onSpeech({
          transcript: alt.transcript,
          isFinal: res.isFinal,
          confidence: alt.confidence ?? 0,
        });
      }
    };
    this.rec.onerror = (ev) => {
      if (ev.error === "no-speech" || ev.error === "aborted") return;
      this.onStatus("error", ev.error);
    };
    this.rec.onend = () => {
      this.running = false;
      // Chrome ends recognition periodically; restart while desired
      if (this.wantRunning) {
        try {
          this.rec?.start();
          this.running = true;
          this.onStatus("listening");
        } catch {
          this.onStatus("stopped");
        }
      } else {
        this.onStatus("stopped");
      }
    };
    try {
      this.rec.start();
      this.running = true;
      this.onStatus("listening");
    } catch (e) {
      this.onStatus("error", e instanceof Error ? e.message : "Could not start recognition");
    }
  }

  stop() {
    this.wantRunning = false;
    try {
      this.rec?.stop();
    } catch {
      /* ignore */
    }
    this.running = false;
    this.onStatus("stopped");
  }

  get isRunning() {
    return this.running;
  }
}
