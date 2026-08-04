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
  sampleTypeLabel,
  type SessionAnalysis,
} from "../lib/sessionAnalytics";
import type { SpeakerRole, TranscriptTurn } from "../mock/sampleSession";
import {
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

/** Mini sparkline for multi-session progress (oldest → newest). */
function SessionTrend({
  sessions,
  metric,
  label,
  format = (n) => String(Math.round(n)),
  maxHint,
}: {
  sessions: SessionRecording[];
  metric: (s: SessionRecording) => number;
  label: string;
  format?: (n: number) => string;
  maxHint?: number;
}) {
  const ordered = [...sessions].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );
  if (ordered.length < 2) return null;
  const values = ordered.map(metric);
  const max = Math.max(...values, maxHint ?? 0, 1);
  const w = 200;
  const h = 48;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * (w - 8) + 4;
      const y = h - 6 - (v / max) * (h - 14);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="trend-card">
      <div className="metric-label">{label}</div>
      <svg
        className="trend-spark"
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={label}
      >
        <polyline
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          points={pts}
        />
        {values.map((v, i) => {
          const x = (i / (values.length - 1)) * (w - 8) + 4;
          const y = h - 6 - (v / max) * (h - 14);
          return (
            <circle key={i} cx={x} cy={y} r={3.5} fill="var(--navy)" />
          );
        })}
      </svg>
      <div className="trend-values">
        {ordered.map((s, i) => (
          <span key={s.id} className="faint">
            {format(values[i])}
            {i < ordered.length - 1 ? " → " : ""}
          </span>
        ))}
      </div>
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
    rec.durationSec,
    rec.sampleType
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
      // Analyze with sample type for labeling (seed sessions already saved)
      const result = analyzeSession(
        sessionTurns,
        prof.durationSec,
        def.sampleType
      );
      setAnalysis(result);
      setTurns(sessionTurns);
      setPhase("done");
      void persistAnalysis(result, def.title);
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
          title="Language samples"
          subtitle="Select a client to review their language-sample sessions."
          actions={
            <Link to="/clients">
              <Button variant="secondary">All clients</Button>
            </Link>
          }
        />
        <Card>
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
              Continue
            </Button>
          </div>
        </Card>
      </>
    );
  }

  if (!client) {
    return (
      <Card>
        <p>Client not found.</p>
        <TextLink to="/clients">Back to clients</TextLink>
      </Card>
    );
  }

  const sampleDefs = sessionsForClientDef(client.id);
  const clientSessionHistory = sessionsForClient(client.id);
  const activeSampleType =
    analysis?.sampleType ?? savedRec?.sampleType;
  const durationLabel = (
    profile?.durationSec ??
    analysis?.durationSec ??
    0
  ).toFixed(0);

  return (
    <>
      <PageHeader
        title="Language samples"
        subtitle={`${client.name} · ${ageFromDob(client.dob)} yrs${
          client.mrn ? ` · ${client.mrn}` : ""
        }`}
        actions={
          <Link to={`/clients/${client.id}`}>
            <Button variant="secondary">Client home</Button>
          </Link>
        }
      />

      <Card>
        <div className="section-head">
          <div>
            <h2 className="section-title">Sessions</h2>
            <p className="muted section-sub">
              Therapist / client language samples for this examinee. Open a
              session to play audio and review metrics.
            </p>
          </div>
        </div>
        {client.notes ? (
          <p className="chart-note">{client.notes}</p>
        ) : null}
        <ul className="session-list">
          {sampleDefs.map((def) => {
            const saved = clientSessionHistory.find((s) => s.id === def.id);
            const isActive = sessionIdParam === def.id;
            return (
              <li
                key={def.id}
                className={`session-list-item${isActive ? " active" : ""}`}
              >
                <div className="session-list-main">
                  <div className="session-list-title-row">
                    <strong>{def.title}</strong>
                    <Badge tone="info">
                      {sampleTypeLabel(def.sampleType)}
                    </Badge>
                    {saved ? (
                      <Badge
                        tone={
                          saved.engagementScore >= 80
                            ? "success"
                            : saved.engagementScore >= 60
                              ? "info"
                              : "warning"
                        }
                      >
                        {saved.engagementScore}/100
                      </Badge>
                    ) : null}
                  </div>
                  {saved ? (
                    <p className="faint session-list-meta">
                      {saved.clientWordCount} words · NDW{" "}
                      {saved.clientUniqueWords} · MLU{" "}
                      {saved.meanUtteranceLength.toFixed(1)} · contingency{" "}
                      {saved.contingentQuestions
                        ? `${saved.contingentResponses}/${saved.contingentQuestions}`
                        : "—"}
                    </p>
                  ) : (
                    <p className="faint session-list-meta">{def.profileNote}</p>
                  )}
                </div>
                <Button
                  variant={isActive ? "primary" : "secondary"}
                  onClick={() => loadClientSample(def.id)}
                  disabled={phase === "loading" || phase === "analyzing"}
                >
                  {phase === "loading" && !isActive
                    ? "Loading…"
                    : isActive
                      ? "Viewing"
                      : "Open"}
                </Button>
              </li>
            );
          })}
        </ul>
        {error ? <p className="form-error">{error}</p> : null}
      </Card>

      {audioUrl || profile ? (
        <Card>
          <div className="section-head">
            <h2 className="section-title">Recording</h2>
            <div className="legend">
              <span>
                <i className="legend-swatch therapist" /> Therapist
              </span>
              <span>
                <i className="legend-swatch client" /> Client
              </span>
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
              className="session-audio"
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            />
          ) : null}
          <p className="faint session-meta-line">
            {durationLabel}s
            {activeSampleType
              ? ` · ${sampleTypeLabel(activeSampleType)}`
              : ""}
            {phase === "analyzing" || saving ? " · Updating…" : ""}
          </p>
        </Card>
      ) : null}

      {turns.length > 0 ? (
        <Card>
          <h2 className="section-title">Transcript</h2>
          <div className="transcript-list">
            {turns.map((t) => (
              <div key={t.id} className={`transcript-turn ${t.speaker}`}>
                <div className="transcript-meta">
                  <Badge tone={t.speaker === "therapist" ? "info" : "success"}>
                    {t.speaker === "therapist" ? "Therapist" : "Client"}
                  </Badge>
                  <span className="faint">
                    {t.startSec.toFixed(1)}–{t.endSec.toFixed(1)}s
                  </span>
                </div>
                <p className="transcript-text">{t.text}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {analysis ? (
        <>
          <div className="grid-3">
            <Card className="stat-card">
              <h3>Engagement</h3>
              <div className="value">
                {analysis.engagement.engagementScore}
                <span className="value-suffix">/100</span>
              </div>
              <Badge tone={scoreTone(analysis.engagement.engagementScore)}>
                index
              </Badge>
            </Card>
            <Card className="stat-card">
              <h3>Contingency</h3>
              <div className="value">
                {analysis.engagement.contingentResponses}/
                {analysis.engagement.contingentQuestions || 0}
              </div>
              <p className="faint stat-hint">
                {pct(analysis.engagement.responseRate * 100)} of questions
              </p>
            </Card>
            <Card className="stat-card">
              <h3>NDW / TNW</h3>
              <div className="value">
                {analysis.client.ndw}
                <span className="value-suffix">/{analysis.client.tnw}</span>
              </div>
              <p className="faint stat-hint">
                TTR {analysis.client.typeTokenRatio.toFixed(2)}
              </p>
            </Card>
          </div>

          {clientSessionHistory.length >= 2 ? (
            <Card>
              <h2 className="section-title">Trends</h2>
              <p className="muted section-sub">
                Across samples for this client (oldest → newest)
              </p>
              <div className="trend-grid">
                <SessionTrend
                  sessions={clientSessionHistory}
                  metric={(s) => s.engagementScore}
                  label="Engagement"
                  maxHint={100}
                />
                <SessionTrend
                  sessions={clientSessionHistory}
                  metric={(s) => s.meanUtteranceLength}
                  label="MLU (words)"
                  format={(n) => n.toFixed(1)}
                />
                <SessionTrend
                  sessions={clientSessionHistory}
                  metric={(s) => s.clientUniqueWords}
                  label="NDW"
                />
                <SessionTrend
                  sessions={clientSessionHistory}
                  metric={(s) =>
                    s.contingentQuestions
                      ? (s.contingentResponses / s.contingentQuestions) * 100
                      : 0
                  }
                  label="Contingency %"
                  format={(n) => `${Math.round(n)}%`}
                  maxHint={100}
                />
              </div>
            </Card>
          ) : null}

          <div className="grid-2">
            <Card>
              <h2 className="section-title">Vocabulary</h2>
              <div className="metric-grid">
                <MetricTile
                  label="TNW"
                  value={String(analysis.client.tnw)}
                  hint="Total words"
                />
                <MetricTile
                  label="NDW"
                  value={String(analysis.client.ndw)}
                  hint="Different words"
                />
                <MetricTile
                  label="TTR"
                  value={analysis.client.typeTokenRatio.toFixed(2)}
                  hint="NDW ÷ TNW"
                />
                <MetricTile
                  label="MLU (words)"
                  value={analysis.client.meanUtteranceLength.toFixed(1)}
                  hint="Mean words per turn"
                />
                <MetricTile
                  label="Content density"
                  value={pct(analysis.client.contentRatio * 100)}
                />
                <MetricTile
                  label="Client turns"
                  value={String(analysis.client.turnCount)}
                />
              </div>
              {analysis.client.topWords.length > 0 &&
              !analysis.client.topWords[0].word.startsWith("(") ? (
                <div className="word-block">
                  <div className="metric-label">Top content words</div>
                  <div className="word-cloud">
                    {analysis.client.topWords.map((w) => (
                      <span key={w.word} className="word-chip">
                        {w.word} <em>{w.count}</em>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </Card>

            <Card>
              <h2 className="section-title">Discourse</h2>
              <div className="metric-grid">
                <MetricTile
                  label="Contingent responses"
                  value={`${analysis.engagement.contingentResponses}/${analysis.engagement.contingentQuestions}`}
                  hint={pct(analysis.engagement.responseRate * 100)}
                />
                <MetricTile
                  label="Response latency"
                  value={`${analysis.engagement.meanResponseLatencySec.toFixed(2)}s`}
                />
                <MetricTile
                  label="Response turns"
                  value={String(analysis.engagement.responseTurns)}
                  hint={pct(analysis.engagement.responseTurnRatio * 100)}
                />
                <MetricTile
                  label="Initiative turns"
                  value={String(analysis.engagement.initiativeTurns)}
                  hint={pct(analysis.engagement.initiativeRatio * 100)}
                />
                <MetricTile
                  label="Talk share"
                  value={pct(analysis.engagement.clientTalkRatio * 100)}
                  hint="Client speaking time"
                />
                <MetricTile
                  label="Perseveration"
                  value={
                    analysis.engagement.perseveration.flagged
                      ? analysis.engagement.perseveration.level
                      : "none"
                  }
                  hint={
                    analysis.engagement.perseveration.topWord
                      ? `“${analysis.engagement.perseveration.topWord}” ${pct(analysis.engagement.perseveration.topShare * 100)}`
                      : undefined
                  }
                />
              </div>
              <div className="progress-bar">
                <i
                  style={{
                    width: `${analysis.engagement.engagementScore}%`,
                  }}
                />
              </div>
            </Card>
          </div>

          <Card>
            <h2 className="section-title">Summary</h2>
            <p className="summary-narrative">{analysis.engagement.narrative}</p>
            {analysis.engagement.highlights.length ? (
              <>
                <h3 className="subsection-title">Highlights</h3>
                <ul className="analytics-list">
                  {analysis.engagement.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </>
            ) : null}
            <h3 className="subsection-title">Recommendations</h3>
            <ul className="analytics-list">
              {analysis.engagement.recommendations.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </Card>
        </>
      ) : null}
    </>
  );
}
