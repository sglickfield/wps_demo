/**
 * Demo language-sample session: two speakers (therapist + client).
 * Audio: /samples/speech-therapy-session.wav (synthetic dual-voice demo, ~60s).
 * Transcript is aligned to the spoken lines for browser-side analytics.
 */

export type SpeakerRole = "therapist" | "client";

export interface TranscriptTurn {
  id: string;
  speaker: SpeakerRole;
  text: string;
  /** Approximate start/end in seconds for timeline display */
  startSec: number;
  endSec: number;
}

export const SAMPLE_SESSION_META = {
  id: "sample-slp-weekend",
  title: "Speech-language sample — weekend narrative",
  description:
    "Two-speaker demo session (therapist prompts + client narrative). Suitable for vocabulary diversity and engagement analytics similar to language-sample review in SLP practice.",
  audioUrl: "/samples/speech-therapy-session.wav",
  durationSec: 59.8,
  speakers: {
    therapist: "Therapist",
    client: "Client (Jamie)",
  },
  sourceNote:
    "Demo recording synthesized with two distinct system voices for browser analytics (not a real clinical recording; no PHI).",
} as const;

/** Turn timings approximate the concatenated spoken lines + short pauses. */
export const SAMPLE_TRANSCRIPT: TranscriptTurn[] = [
  {
    id: "t1",
    speaker: "therapist",
    text: "Hi Jamie. Today we are going to talk about your weekend. Can you tell me what you did?",
    startSec: 0.0,
    endSec: 6.2,
  },
  {
    id: "c1",
    speaker: "client",
    text: "I went to the park with my dog. We played fetch and then I ate a sandwich.",
    startSec: 6.7,
    endSec: 12.4,
  },
  {
    id: "t2",
    speaker: "therapist",
    text: "That sounds fun. What kind of dog do you have?",
    startSec: 12.9,
    endSec: 16.5,
  },
  {
    id: "c2",
    speaker: "client",
    text: "He is a golden retriever. His name is Sunny. He runs really fast.",
    startSec: 17.0,
    endSec: 22.0,
  },
  {
    id: "t3",
    speaker: "therapist",
    text: "Great vocabulary. Can you describe the park using three describing words?",
    startSec: 22.5,
    endSec: 27.2,
  },
  {
    id: "c3",
    speaker: "client",
    text: "It was sunny, crowded, and noisy. There were lots of kids on the swings.",
    startSec: 27.7,
    endSec: 33.5,
  },
  {
    id: "t4",
    speaker: "therapist",
    text: "Nice work. What happened after you left the park?",
    startSec: 34.0,
    endSec: 37.6,
  },
  {
    id: "c4",
    speaker: "client",
    text: "We walked home slowly. I was tired but happy. Mom made pasta for dinner.",
    startSec: 38.1,
    endSec: 43.8,
  },
  {
    id: "t5",
    speaker: "therapist",
    text: "How did the pasta taste?",
    startSec: 44.3,
    endSec: 46.2,
  },
  {
    id: "c5",
    speaker: "client",
    text: "It was delicious. I put cheese on top. Then I helped wash the dishes.",
    startSec: 46.7,
    endSec: 52.0,
  },
  {
    id: "t6",
    speaker: "therapist",
    text: "Thank you for sharing so many details. That was excellent engagement today.",
    startSec: 52.5,
    endSec: 57.0,
  },
  {
    id: "c6",
    speaker: "client",
    text: "Thanks. Talking about my weekend is easier now.",
    startSec: 57.5,
    endSec: 59.8,
  },
];
