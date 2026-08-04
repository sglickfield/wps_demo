import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Badge, Button, Card, Field, PageHeader, TextLink } from "../components/ui";
import {
  decodeAudioFile,
  labelSpurtsAlternating,
  profileAudio,
  type AudioProfile,
} from "../lib/audioAnalysis";
import { ageFromDob } from "../lib/format";
import {
  analyzeSession,
  type SessionAnalysis,
} from "../lib/sessionAnalytics";
import type { SpeakerRole, TranscriptTurn } from "../mock/sampleSession";
import {
  CLIENT_VOICES,
  THERAPIST_VOICE,
  audioUrlFor,
  getSessionDef,
  sessionsForClientDef,
  turnsWithEstimatedTiming,
  SESSION_DURATIONS,
} from "../mock/sessionLibrary";
import { useStore } from "../mock/store";
import type { SessionRecording } from "../types";

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
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<AudioProfile | null>(null);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [analysis, setAnalysis] = useState<SessionAnalysis | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [spurtLabels, setSpurtLabels] = useState<
    { startSec: number; endSec: number; speaker: SpeakerRole }[]
  >([]);
  const [savedRec, setSavedRec] = useState<SessionRecording | null>(null);
  const [saving, setSaving] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load a previously saved session when sessionId is present
  useEffect(() => {
    if (!sessionIdParam || !client) return;
    const rec = getSessionRecording(sessionIdParam);
    if (!rec || rec.clientId !== client.id) {
      setError("Session recording not found for this client.");
      return;
    }
    setSavedRec(rec);
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
    if (rec.audioUrl) {
      setAudioUrl(rec.audioUrl);
    }
    setPhase("done");
  }, [sessionIdParam, client, getSessionRecording]);

  const persistAnalysis = useCallback(
    async (result: SessionAnalysis, title: string) => {
      if (!client) return;
      setSaving(true);
      try {
        const rec = await saveSessionRecording({
          clientId: client.id,
          title,
          mode: "demo",
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
    (
      sessionTurns: TranscriptTurn[],
      durationSec: number,
      opts?: { save?: boolean; title?: string }
    ) => {
      setPhase("analyzing");
      const shouldSave = opts?.save !== false;
      if (shouldSave) setSavedRec(null);
      window.setTimeout(() => {
        const result = analyzeSession(sessionTurns, durationSec);
        setAnalysis(result);
        setTurns(sessionTurns);
        setPhase("done");
        if (shouldSave && opts?.title) {
          void persistAnalysis(result, opts.title);
        }
      }, 350);
    },
    [persistAnalysis]
  );

  const loadClientSample = async (sessionDefId: string) => {
    if (!client) return;
    const def = getSessionDef(sessionDefId);
    if (!def || def.clientId !== client.id) {
      setError("Sample session not found for this client.");
      return;
    }
    // Prefer opening the seed recording already on the client record
    const existing = sessionsForClient(client.id).find((s) => s.id === def.id);
    if (existing) {
      setSearchParams(
        { clientId: client.id, sessionId: existing.id },
        { replace: true }
      );
      return;
    }
    setError(null);
    setPhase("loading");
    setAnalysis(null);
    try {
      const url = audioUrlFor(def);
      const { buffer, ctx } = await decodeAudioFile(url);
      const prof = profileAudio(buffer);
      const labels = labelSpurtsAlternating(prof.spurts, "therapist");
      const timed = turnsWithEstimatedTiming(def.turns);
      const estEnd = timed.reduce((m, t) => Math.max(m, t.endSec), 1);
      const scale = (SESSION_DURATIONS[def.id] ?? prof.durationSec) / estEnd;
      const sessionTurns = timed.map((t) => ({
        ...t,
        startSec: Math.round(t.startSec * scale * 10) / 10,
        endSec: Math.round(t.endSec * scale * 10) / 10,
      }));
      setProfile(prof);
      setSpurtLabels(labels);
      setAudioUrl(url);
      setTurns(sessionTurns);
      setPhase("ready");
      await ctx.close().catch(() => undefined);
      runAnalysis(sessionTurns, prof.durationSec, {
        save: true,
        title: def.title,
      });
    } catch (e) {
      setPhase("error");
      setError(e instanceof Error ? e.message : "Could not load sample audio");
    }
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

  const clientVoice = CLIENT_VOICES[client.id] ?? "Client voice";
  const sampleDefs = sessionsForClientDef(client.id);

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
        <div>
          <h2 style={{ fontSize: "1.1rem", marginBottom: 6 }}>
            {client.name} — voice sessions only
          </h2>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            This page lists <strong>only</strong> recordings for{" "}
            <strong>{client.name}</strong>
            {client.mrn ? ` (${client.mrn})` : ""}. Voices: therapist{" "}
            <strong>{THERAPIST_VOICE}</strong>, client{" "}
            <strong>{clientVoice}</strong> (unique to this examinee).
          </p>
          {client.notes ? (
            <p className="faint" style={{ margin: "8px 0 0" }}>
              Chart note: {client.notes}
            </p>
          ) : null}
        </div>

        <div className="stack" style={{ marginTop: 12 }}>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Sample language recordings for <strong>{client.name}</strong> only
            (voice <strong>{clientVoice}</strong>). Content and metrics align
            with this client&apos;s rating profile.
          </p>
          <div
            className="row-actions"
            style={{ flexDirection: "column", alignItems: "stretch" }}
          >
            {sampleDefs.map((def) => (
              <div
                key={def.id}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div>
                  <strong style={{ fontSize: 14 }}>{def.title}</strong>
                  <div className="faint">{def.profileNote}</div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => loadClientSample(def.id)}
                  disabled={phase === "loading" || phase === "analyzing"}
                >
                  Open
                </Button>
              </div>
            ))}
          </div>
        </div>

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
            {` · Client: ${client.name} · Voices: ${THERAPIST_VOICE} / ${
              savedRec?.clientVoice ?? clientVoice
            }`}
            {phase === "analyzing" ? " · Running analytics…" : null}
            {saving ? " · Saving to client record…" : null}
            {savedRec && !saving ? ` · Session ${savedRec.id}` : null}
          </p>
          {savedRec?.profileNote ? (
            <p className="muted" style={{ margin: "8px 0 0", fontSize: 13 }}>
              Profile alignment: {savedRec.profileNote}
            </p>
          ) : null}
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
                  Vocabulary list populates when a transcript is available.
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
