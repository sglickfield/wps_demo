/** Shared speaker/transcript types for language-sample analytics. */

export type SpeakerRole = "therapist" | "client";

export interface TranscriptTurn {
  id: string;
  speaker: SpeakerRole;
  text: string;
  /** Approximate start/end in seconds for timeline display */
  startSec: number;
  endSec: number;
}
