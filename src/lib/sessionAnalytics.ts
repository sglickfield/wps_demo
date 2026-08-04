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

export interface SpeakerMetrics {
  speaker: SpeakerRole;
  turnCount: number;
  totalWords: number;
  uniqueWords: number;
  typeTokenRatio: number;
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

export interface EngagementMetrics {
  /** 0–100 composite engagement score for the client */
  engagementScore: number;
  clientTalkRatio: number;
  turnBalance: number;
  responseRate: number;
  meanResponseLatencySec: number;
  therapistQuestions: number;
  clientResponsesAfterQuestion: number;
  initiativeTurns: number;
  narrative: string;
  highlights: string[];
  recommendations: string[];
}

export interface SessionAnalysis {
  durationSec: number;
  turns: TranscriptTurn[];
  therapist: SpeakerMetrics;
  client: SpeakerMetrics;
  engagement: EngagementMetrics;
  analyzedAt: string;
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
  const persPenalty = topShare >= 0.18 ? 22 : topShare >= 0.12 ? 12 : 0;

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

  // Initiative: client turns not immediately after a therapist question
  let initiativeTurns = 0;
  for (let i = 0; i < turns.length; i++) {
    if (turns[i].speaker !== "client") continue;
    const prev = turns[i - 1];
    if (!prev || prev.speaker !== "therapist" || !isQuestion(prev.text)) {
      initiativeTurns += 1;
    }
  }

  const highlights: string[] = [];
  const recommendations: string[] = [];

  if (client.typeTokenRatio >= 0.5) {
    highlights.push(
      `Strong lexical diversity (TTR ${client.typeTokenRatio.toFixed(2)}) for a short sample.`
    );
  } else {
    recommendations.push(
      "Elicit denser content vocabulary (describing words, category labels) in future probes."
    );
  }

  if (client.meanUtteranceLength >= 7) {
    highlights.push(
      `Mean utterance length of ${client.meanUtteranceLength.toFixed(1)} words suggests multi-clause narrative attempts.`
    );
  } else {
    recommendations.push(
      "Prompt for expansion (e.g., “Tell me more about…”) to increase utterance length."
    );
  }

  if (responseRate >= 0.8) {
    highlights.push(
      `High contingency: responded to ${Math.round(responseRate * 100)}% of therapist questions.`
    );
  } else {
    recommendations.push(
      "Support contingent responding with wait time and visual scaffolds after questions."
    );
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
    `Client language-sample analysis over ${durationSec.toFixed(0)}s indicates ${band} engagement (composite ${engagementScore}/100).`,
    `The client produced ${client.totalWords} words across ${client.turnCount} turns (MLU ${client.meanUtteranceLength.toFixed(1)}; TTR ${client.typeTokenRatio.toFixed(2)}).`,
    `Speaking-time share was ${Math.round(clientTalkRatio * 100)}% client / ${Math.round((1 - clientTalkRatio) * 100)}% therapist, with a ${Math.round(responseRate * 100)}% response rate to clinician questions.`,
    client.contentWordCount
      ? `Content-word density was ${Math.round(client.contentRatio * 100)}%, consistent with narrative topic vocabulary (e.g., activities, people, places).`
      : `Limited content vocabulary was observed in this sample.`,
  ].join(" ");

  if (!recommendations.length) {
    recommendations.push(
      "Continue narrative probes across settings; compare TTR/MLU at next administration for progress monitoring."
    );
  }

  return {
    engagementScore,
    clientTalkRatio,
    turnBalance,
    responseRate,
    meanResponseLatencySec,
    therapistQuestions: therapistQs.length,
    clientResponsesAfterQuestion: responsesAfterQ,
    initiativeTurns,
    narrative,
    highlights,
    recommendations,
  };
}

export function analyzeSession(
  turns: TranscriptTurn[],
  durationSec?: number
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
  };
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
