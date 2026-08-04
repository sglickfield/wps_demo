export type CaseStatus =
  | "draft"
  | "in_progress"
  | "ready_to_score"
  | "scored"
  | "closed";

export type FormStatus =
  | "not_sent"
  | "sent"
  | "in_progress"
  | "completed"
  | "expired";

export type DeliveryMethod = "email_link" | "on_screen" | "manual_entry";

export type RaterRole =
  | "parent_caregiver"
  | "teacher"
  | "self"
  | "clinician";

export type ReportType = "score" | "progress_comparison";

export interface Clinician {
  id: string;
  name: string;
  email: string;
  title: string;
  organization: string;
}

export interface Client {
  id: string;
  name: string;
  dob: string;
  sex: string;
  mrn?: string;
  school?: string;
  grade?: string;
  notes?: string;
  createdAt: string;
}

export interface CatalogForm {
  id: string;
  name: string;
  raterRoleDefault: RaterRole;
  estimatedMinutes: number;
}

export interface CatalogProduct {
  code: string;
  name: string;
  shortName: string;
  area: string;
  description: string;
  forms: CatalogForm[];
}

export interface FormAssignment {
  id: string;
  caseId: string;
  productCode: string;
  formCatalogId: string;
  formName: string;
  raterRole: RaterRole;
  raterName: string;
  raterEmail: string;
  delivery: DeliveryMethod;
  status: FormStatus;
  inviteToken: string;
  dueDate?: string;
  sentAt?: string;
  completedAt?: string;
  responses?: Record<string, number | string>;
}

export interface CaseRecord {
  id: string;
  clientId: string;
  title: string;
  reason: string;
  status: CaseStatus;
  clinicianId: string;
  openedAt: string;
  closedAt?: string;
  productCodes: string[];
}

export interface Report {
  id: string;
  caseId: string;
  formId?: string;
  productCode: string;
  type: ReportType;
  title: string;
  generatedAt: string;
  summary: string;
  domains: { name: string; score: number; range: string }[];
  narrative: string;
}

export interface FormSection {
  id: string;
  title: string;
  items: { id: string; text: string; scale: string[] }[];
}

/** Saved browser-side language-sample / session recording analysis for a client. */
export type SessionRecordingMode = "demo";

export interface SessionRecordingTurn {
  id: string;
  speaker: "therapist" | "client";
  text: string;
  startSec: number;
  endSec: number;
}

export type LanguageSampleType =
  | "narrative"
  | "conversation"
  | "routines";

export type PerseverationLevel = "none" | "mild" | "elevated";

export interface SessionRecording {
  id: string;
  clientId: string;
  title: string;
  mode: SessionRecordingMode;
  createdAt: string;
  durationSec: number;
  engagementScore: number;
  clientTalkRatio: number;
  /** TNW — total number of words */
  clientWordCount: number;
  /** NDW — number of different words */
  clientUniqueWords: number;
  typeTokenRatio: number;
  /** MLU in words (not morphemes) */
  meanUtteranceLength: number;
  contingentResponses: number;
  contingentQuestions: number;
  meanResponseLatencySec: number;
  initiativeTurns: number;
  responseTurns: number;
  initiativeRatio: number;
  perseverationLevel: PerseverationLevel;
  perseverationTopWord?: string;
  perseverationTopShare: number;
  sampleType?: LanguageSampleType;
  narrative: string;
  highlights: string[];
  recommendations: string[];
  turns: SessionRecordingTurn[];
  /** Browser-playable sample under /public/samples when available */
  audioUrl?: string;
  /** TTS voice labels for demo transparency */
  therapistVoice?: string;
  clientVoice?: string;
  profileNote?: string;
}
