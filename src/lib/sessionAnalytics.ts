import type { SpeakerRole, TranscriptTurn } from "../mock/sampleSession";

const FUNCTION_WORDS = new Set(
  [
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "if",
    "then",
    "so",
    "because",
    "as",
    "of",
    "to",
    "in",
    "on",
    "at",
    "for",
    "with",
    "by",
    "from",
    "about",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "between",
    "out",
    "off",
    "over",
    "under",
    "again",
    "further",
    "once",
    "here",
    "there",
    "when",
    "where",
    "why",
    "how",
    "all",
    "any",
    "both",
    "each",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "than",
    "too",
    "very",
    "can",
    "will",
    "just",
    "don",
    "should",
    "now",
    "i",
    "me",
    "my",
    "myself",
    "we",
    "our",
    "ours",
    "you",
    "your",
    "yours",
    "he",
    "him",
    "his",
    "she",
    "her",
    "hers",
    "it",
    "its",
    "they",
    "them",
    "their",
    "what",
    "which",
    "who",
    "whom",
    "this",
    "that",
    "these",
    "those",
    "am",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "having",
    "do",
    "does",
    "did",
    "doing",
    "would",
    "could",
    "ought",
    "i'm",
    "you're",
    "he's",
    "she's",
    "it's",
    "we're",
    "they're",
    "i've",
    "you've",
    "we've",
    "they've",
    "i'd",
    "you'd",
    "he'd",
    "she'd",
    "we'd",
    "they'd",
    "i'll",
    "you'll",
    "he'll",
    "she'll",
    "we'll",
    "they'll",
    "isn't",
    "aren't",
    "wasn't",
    "weren't",
    "hasn't",
    "haven't",
    "hadn't",
    "doesn't",
    "don't",
    "didn't",
    "won't",
    "wouldn't",
    "shan't",
    "shouldn't",
    "can't",
    "cannot",
    "couldn't",
    "mustn't",
    "let's",
    "that's",
    "who's",
    "what's",
    "here's",
    "there's",
    "when's",
    "where's",
    "why's",
    "how's",
  ].map((w) => w.toLowerCase())
);

export interface WordToken {
  raw: string;
  lemma: string;
}

/** TNW = total number of words; NDW = number of different words (unique). */
export interface SpeakerMetrics {
  speaker: SpeakerRole;
  turnCount: number;
  /** Total number of words (TNW) */
  totalWords: number;
  /** Number of different words (NDW) */
  uniqueWords: number;
  /** TNW alias for clinical labeling */
  tnw: number;
  /** NDW alias for clinical labeling */
  ndw: number;
  /** Type–token ratio = NDW/TNW; sample-size sensitive on short samples */
  typeTokenRatio: number;
  /** Mean length of utterance in words (not morphemes) */
  meanUtteranceLength: number;
  contentWordCount: number;
  functionWordCount: number;
  contentRatio: number;
  speakingTimeSec: number;
  speakingTimePct: number;
  questionCount: number;
  meanTurnDurationSec: number;
  topWords: { word: string; count: number }[];
}

export type PerseverationLevel = "none" | "mild" | "elevated";

export interface PerseverationMetrics {
  flagged: boolean;
  level: PerseverationLevel;
  /** Dominant content word share of all content words (0–1) */
  topShare: number;
  topWord: string | null;
  topCount: number;
}

export interface EngagementMetrics {
  /** 0–100 demo heuristic — not a standardized clinical score */
  engagementScore: number;
  clientTalkRatio: number;
  turnBalance: number;
  /** Contingent responses / therapist questions */
  responseRate: number;
  /** e.g. 4 of 5 questions got an immediate client reply */
  contingentResponses: number;
  contingentQuestions: number;
  /** Mean pause (sec) from end of clinician question to client reply */
  meanResponseLatencySec: number;
  therapistQuestions: number;
  clientResponsesAfterQuestion: number;
  /** Client turns not immediately after a clinician question */
  initiativeTurns: number;
  /** Client turns that follow a clinician question */
  responseTurns: number;
  /** initiativeTurns / client turns */
  initiativeRatio: number;
  /** responseTurns / client turns */
  responseTurnRatio: number;
  perseveration: PerseverationMetrics;
  narrative: string;
  highlights: string[];
  recommendations: string[];
}

export type LanguageSampleType =
  | "narrative"
  | "conversation"
  | "routines";

export interface SessionAnalysis {
  durationSec: number;
  turns: TranscriptTurn[];
  therapist: SpeakerMetrics;
  client: SpeakerMetrics;
  engagement: EngagementMetrics;
  analyzedAt: string;
  sampleType?: LanguageSampleType;
}

function tokenize(text: string): WordToken[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((raw) => ({ raw, lemma: raw.replace(/'s$/, "") }));
}

function isQuestion(text: string): boolean {
  return /\?/.test(text) || /^(who|what|when|where|why|how|can|could|would|do|does|did|is|are|was|were)\b/i.test(text.trim());
}

function metricsFor(
  speaker: SpeakerRole,
  turns: TranscriptTurn[],
  durationSec: number
): SpeakerMetrics {
  const mine = turns.filter((t) => t.speaker === speaker);
  const allTokens = mine.flatMap((t) => tokenize(t.text));
  const words = allTokens.map((t) => t.lemma);
  const unique = new Set(words);
  const content = words.filter((w) => !FUNCTION_WORDS.has(w) && w.length > 1);
  const functionCount = words.length - content.length;
  const speakingTimeSec = mine.reduce(
    (s, t) => s + Math.max(0, t.endSec - t.startSec),
    0
  );
  const freq = new Map<string, number>();
  for (const w of content) {
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  const topWords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));

  const totalWords = words.length;
  const uniqueWords = unique.size;
  const typeTokenRatio = totalWords ? uniqueWords / totalWords : 0;
  const meanUtteranceLength = mine.length ? totalWords / mine.length : 0;
  const questionCount = mine.filter((t) => isQuestion(t.text)).length;
  const meanTurnDurationSec = mine.length
    ? speakingTimeSec / mine.length
    : 0;

  return {
    speaker,
    turnCount: mine.length,
    totalWords,
    uniqueWords,
    tnw: totalWords,
    ndw: uniqueWords,
    typeTokenRatio,
    meanUtteranceLength,
    contentWordCount: content.length,
    functionWordCount: functionCount,
    contentRatio: totalWords ? content.length / totalWords : 0,
    speakingTimeSec,
    speakingTimePct: durationSec ? (speakingTimeSec / durationSec) * 100 : 0,
    questionCount,
    meanTurnDurationSec,
    topWords,
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function buildEngagement(
  turns: TranscriptTurn[],
  client: SpeakerMetrics,
  therapist: SpeakerMetrics,
  durationSec: number
): EngagementMetrics {
  const therapistQs = turns.filter(
    (t) => t.speaker === "therapist" && isQuestion(t.text)
  );
  let responsesAfterQ = 0;
  const latencies: number[] = [];
  for (let i = 0; i < turns.length - 1; i++) {
    const cur = turns[i];
    const next = turns[i + 1];
    if (cur.speaker === "therapist" && isQuestion(cur.text) && next.speaker === "client") {
      responsesAfterQ += 1;
      latencies.push(Math.max(0, next.startSec - cur.endSec));
    }
  }
  const responseRate = therapistQs.length
    ? responsesAfterQ / therapistQs.length
    : client.turnCount > 0
      ? 1
      : 0;
  const meanResponseLatencySec = latencies.length
    ? latencies.reduce((a, b) => a + b, 0) / latencies.length
    : 0;

  const clientTalkRatio =
    client.speakingTimeSec + therapist.speakingTimeSec > 0
      ? client.speakingTimeSec /
        (client.speakingTimeSec + therapist.speakingTimeSec)
      : 0;

  // Ideal client talk share for language sample elicitation ~40–60%
  const talkScore = 100 - Math.abs(clientTalkRatio - 0.5) * 160;
  // Short samples inflate TTR — prefer unique-word productivity for brief speech
  const ttrScore =
    client.totalWords < 55
      ? clamp(client.uniqueWords * 3.2, 0, 100)
      : clamp(client.typeTokenRatio * 130, 0, 100);
  // MLU (words): target ~8–14 for solid narrative engagement
  const mluScore = clamp((client.meanUtteranceLength / 12) * 100, 0, 100);
  // Responsiveness to clinician questions
  const respScore = responseRate * 100;
  // Turn participation
  const turnScore = clamp(
    (client.turnCount / Math.max(1, therapist.turnCount)) * 90,
    0,
    100
  );
  // Elaboration after questions (thin answers → lower engagement)
  const afterQLens: number[] = [];
  for (let i = 0; i < turns.length - 1; i++) {
    const cur = turns[i];
    const next = turns[i + 1];
    if (
      cur.speaker === "therapist" &&
      isQuestion(cur.text) &&
      next.speaker === "client"
    ) {
      afterQLens.push(tokenize(next.text).length);
    }
  }
  const meanAfterQ = afterQLens.length
    ? afterQLens.reduce((a, b) => a + b, 0) / afterQLens.length
    : client.meanUtteranceLength;
  const elabScore = clamp((meanAfterQ / 14) * 100, 0, 100);
  // Perseveration: single content word dominates → social-communication strain
  const topShare =
    client.contentWordCount && client.topWords[0]
      ? client.topWords[0].count / client.contentWordCount
      : 0;
  const persLevel: PerseverationLevel =
    topShare >= 0.18 ? "elevated" : topShare >= 0.12 ? "mild" : "none";
  const perseveration: PerseverationMetrics = {
    flagged: persLevel !== "none",
    level: persLevel,
    topShare,
    topWord: client.topWords[0]?.word ?? null,
    topCount: client.topWords[0]?.count ?? 0,
  };
  const persPenalty =
    persLevel === "elevated" ? 22 : persLevel === "mild" ? 12 : 0;

  const engagementScore = Math.round(
    clamp(
      talkScore * 0.15 +
        ttrScore * 0.15 +
        mluScore * 0.2 +
        respScore * 0.2 +
        turnScore * 0.1 +
        elabScore * 0.2 -
        persPenalty,
      0,
      100
    )
  );

  const turnBalance =
    therapist.turnCount + client.turnCount > 0
      ? client.turnCount / (therapist.turnCount + client.turnCount)
      : 0;

  // Classify client turns: response (after clinician Q) vs initiative
  let initiativeTurns = 0;
  let responseTurns = 0;
  for (let i = 0; i < turns.length; i++) {
    if (turns[i].speaker !== "client") continue;
    const prev = turns[i - 1];
    if (prev && prev.speaker === "therapist" && isQuestion(prev.text)) {
      responseTurns += 1;
    } else {
      initiativeTurns += 1;
    }
  }
  const initiativeRatio = client.turnCount
    ? initiativeTurns / client.turnCount
    : 0;
  const responseTurnRatio = client.turnCount
    ? responseTurns / client.turnCount
    : 0;

  const highlights: string[] = [];
  const recommendations: string[] = [];

  highlights.push(
    `Productivity: TNW ${client.tnw}, NDW ${client.ndw} (TTR ${client.typeTokenRatio.toFixed(2)}; short samples can inflate TTR).`
  );

  if (client.ndw >= 25) {
    highlights.push(
      `Solid number of different words (NDW ${client.ndw}) for this sample length.`
    );
  } else if (client.tnw > 0 && client.ndw < 18) {
    recommendations.push(
      "Probe for varied content vocabulary (descriptors, category labels) to increase NDW."
    );
  }

  if (client.meanUtteranceLength >= 7) {
    highlights.push(
      `MLU (words) ${client.meanUtteranceLength.toFixed(1)} suggests multi-word elaborated turns.`
    );
  } else {
    recommendations.push(
      "Prompt for expansion (e.g., “Tell me more about…”) to increase mean words per turn."
    );
  }

  if (therapistQs.length) {
    highlights.push(
      `Contingent responding: ${responsesAfterQ}/${therapistQs.length} clinician questions (${Math.round(responseRate * 100)}%).`
    );
  }
  if (responseRate < 0.75 && therapistQs.length) {
    recommendations.push(
      "Support contingent responding with wait time and scaffolds after questions."
    );
  }

  if (meanResponseLatencySec > 0) {
    highlights.push(
      `Mean response latency ${meanResponseLatencySec.toFixed(2)}s after clinician questions.`
    );
  }

  highlights.push(
    `Discourse role: ${responseTurns} response turn(s), ${initiativeTurns} initiative turn(s) (${Math.round(initiativeRatio * 100)}% initiations).`
  );

  if (perseveration.flagged && perseveration.topWord) {
    const msg = `Perseveration flag (${perseveration.level}): “${perseveration.topWord}” ≈ ${Math.round(perseveration.topShare * 100)}% of content words.`;
    if (perseveration.level === "elevated") recommendations.push(msg);
    else highlights.push(msg);
  }

  if (clientTalkRatio >= 0.35 && clientTalkRatio <= 0.65) {
    highlights.push(
      `Balanced floor time (client ${Math.round(clientTalkRatio * 100)}% of speaking time).`
    );
  } else if (clientTalkRatio < 0.35) {
    recommendations.push(
      "Increase client talking time with open-ended prompts; reduce therapist modeling length."
    );
  }

  if (client.topWords.length) {
    highlights.push(
      `Frequent content words: ${client.topWords
        .slice(0, 4)
        .map((w) => w.word)
        .join(", ")}.`
    );
  }

  const band =
    engagementScore >= 80
      ? "high"
      : engagementScore >= 60
        ? "moderate-to-high"
        : engagementScore >= 40
          ? "moderate"
          : "emerging";

  const narrative = [
    `Client language-sample analysis over ${durationSec.toFixed(0)}s indicates ${band} engagement (demo index ${engagementScore}/100 — heuristic, not normed).`,
    `Productivity: TNW ${client.tnw}, NDW ${client.ndw}; MLU (words) ${client.meanUtteranceLength.toFixed(1)}; TTR ${client.typeTokenRatio.toFixed(2)} (interpret TTR cautiously on short samples).`,
    therapistQs.length
      ? `Contingency: ${responsesAfterQ}/${therapistQs.length} questions answered immediately (${Math.round(responseRate * 100)}%); mean response latency ${meanResponseLatencySec.toFixed(2)}s.`
      : `No clinician questions detected in this transcript.`,
    `Discourse: ${Math.round(responseTurnRatio * 100)}% of client turns were responses; ${Math.round(initiativeRatio * 100)}% were initiations.`,
    perseveration.flagged && perseveration.topWord
      ? `Perseveration ${perseveration.level}: “${perseveration.topWord}” dominated content vocabulary.`
      : `No elevated content-word perseveration flag.`,
    `Speaking-time share was ${Math.round(clientTalkRatio * 100)}% client / ${Math.round((1 - clientTalkRatio) * 100)}% therapist.`,
  ].join(" ");

  if (!recommendations.length) {
    recommendations.push(
      "Continue comparable sample types across sessions; track NDW, MLU (words), and contingency for progress monitoring."
    );
  }

  return {
    engagementScore,
    clientTalkRatio,
    turnBalance,
    responseRate,
    contingentResponses: responsesAfterQ,
    contingentQuestions: therapistQs.length,
    meanResponseLatencySec,
    therapistQuestions: therapistQs.length,
    clientResponsesAfterQuestion: responsesAfterQ,
    initiativeTurns,
    responseTurns,
    initiativeRatio,
    responseTurnRatio,
    perseveration,
    narrative,
    highlights,
    recommendations,
  };
}

export function analyzeSession(
  turns: TranscriptTurn[],
  durationSec?: number,
  sampleType?: LanguageSampleType
): SessionAnalysis {
  const lastEnd = turns.reduce((m, t) => Math.max(m, t.endSec), 0);
  const dur = durationSec && durationSec > 0 ? durationSec : lastEnd || 1;
  const therapist = metricsFor("therapist", turns, dur);
  const client = metricsFor("client", turns, dur);
  const engagement = buildEngagement(turns, client, therapist, dur);
  return {
    durationSec: dur,
    turns,
    therapist,
    client,
    engagement,
    analyzedAt: new Date().toISOString(),
    sampleType,
  };
}

export function sampleTypeLabel(t?: LanguageSampleType): string {
  if (t === "narrative") return "Narrative";
  if (t === "conversation") return "Conversation";
  if (t === "routines") return "Routines";
  return "Language sample";
}

/** Build turns from live recognition chunks with speaker labels. */
export function turnsFromLiveChunks(
  chunks: { speaker: SpeakerRole; text: string; startSec: number; endSec: number }[]
): TranscriptTurn[] {
  return chunks
    .filter((c) => c.text.trim())
    .map((c, i) => ({
      id: `live-${i}`,
      speaker: c.speaker,
      text: c.text.trim(),
      startSec: c.startSec,
      endSec: Math.max(c.endSec, c.startSec + 0.3),
    }));
}
