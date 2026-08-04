import type {
  CaseRecord,
  Client,
  Clinician,
  FormAssignment,
  Report,
  SessionRecording,
} from "../types";
import { SAMPLE_SESSION_META, SAMPLE_TRANSCRIPT } from "./sampleSession";
import { analyzeSession } from "../lib/sessionAnalytics";

export const CLINICIAN: Clinician = {
  id: "clin-1",
  name: "Dr. Avery Chen",
  email: "avery.chen@demo-practice.org",
  title: "School Psychologist",
  organization: "Northridge Unified Assessment Team",
};

export const DEMO_PASSWORD = "demo";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export function createSeed(): {
  clients: Client[];
  cases: CaseRecord[];
  forms: FormAssignment[];
  reports: Report[];
  sessionRecordings: SessionRecording[];
} {
  const clients: Client[] = [
    {
      id: "cli-maya",
      name: "Maya Rivera",
      dob: "2016-03-12",
      sex: "Female",
      mrn: "NR-10442",
      school: "Oak Elementary",
      grade: "3",
      notes: "Referral for social communication concerns.",
      createdAt: daysAgo(40),
    },
    {
      id: "cli-jordan",
      name: "Jordan Kim",
      dob: "2014-11-02",
      sex: "Male",
      mrn: "NR-10891",
      school: "Cedar Middle",
      grade: "6",
      notes: "Teacher and parent rating scales in progress.",
      createdAt: daysAgo(25),
    },
    {
      id: "cli-sam",
      name: "Sam Torres",
      dob: "2015-07-22",
      sex: "Nonbinary",
      mrn: "NR-9912",
      school: "Oak Elementary",
      grade: "4",
      notes: "SRS-2 battery scored.",
      createdAt: daysAgo(90),
    },
    {
      id: "cli-alex",
      name: "Alex Patel",
      dob: "2013-01-18",
      sex: "Male",
      mrn: "NR-7721",
      school: "Willow Academy",
      grade: "7",
      notes: "Two ABAS-3 administrations for progress monitoring.",
      createdAt: daysAgo(400),
    },
  ];

  const cases: CaseRecord[] = [
    {
      id: "case-maya-draft",
      clientId: "cli-maya",
      title: "Spring 2026 social communication screening",
      reason: "Teacher concerns about peer interaction",
      status: "draft",
      clinicianId: "clin-1",
      openedAt: daysAgo(2),
      productCodes: ["SRS-2"],
    },
    {
      id: "case-jordan-progress",
      clientId: "cli-jordan",
      title: "Comprehensive adaptive & social eval",
      reason: "IEP team requested multi-informant ratings",
      status: "in_progress",
      clinicianId: "clin-1",
      openedAt: daysAgo(12),
      productCodes: ["SRS-2", "ABAS-3"],
    },
    {
      id: "case-sam-scored",
      clientId: "cli-sam",
      title: "SRS-2 multi-rater battery",
      reason: "Autism spectrum evaluation support",
      status: "scored",
      clinicianId: "clin-1",
      openedAt: daysAgo(45),
      closedAt: daysAgo(30),
      productCodes: ["SRS-2"],
    },
    {
      id: "case-alex-t1",
      clientId: "cli-alex",
      title: "ABAS-3 baseline (Fall 2025)",
      reason: "Initial adaptive behavior baseline",
      status: "scored",
      clinicianId: "clin-1",
      openedAt: daysAgo(320),
      closedAt: daysAgo(300),
      productCodes: ["ABAS-3"],
    },
    {
      id: "case-alex-t2",
      clientId: "cli-alex",
      title: "ABAS-3 progress check (Spring 2026)",
      reason: "Progress monitoring after intervention year",
      status: "scored",
      clinicianId: "clin-1",
      openedAt: daysAgo(40),
      closedAt: daysAgo(28),
      productCodes: ["ABAS-3"],
    },
  ];

  const forms: FormAssignment[] = [
    {
      id: "form-maya-p",
      caseId: "case-maya-draft",
      productCode: "SRS-2",
      formCatalogId: "srs2-parent",
      formName: "Parent/Caregiver Form",
      raterRole: "parent_caregiver",
      raterName: "Elena Rivera",
      raterEmail: "elena.rivera@email.demo",
      delivery: "email_link",
      status: "not_sent",
      inviteToken: "tok-maya-parent",
    },
    {
      id: "form-maya-t",
      caseId: "case-maya-draft",
      productCode: "SRS-2",
      formCatalogId: "srs2-teacher",
      formName: "Teacher Form",
      raterRole: "teacher",
      raterName: "Ms. Brooks",
      raterEmail: "mbrooks@oak.k12.demo",
      delivery: "email_link",
      status: "not_sent",
      inviteToken: "tok-maya-teacher",
    },
    {
      id: "form-jordan-srs-p",
      caseId: "case-jordan-progress",
      productCode: "SRS-2",
      formCatalogId: "srs2-parent",
      formName: "Parent/Caregiver Form",
      raterRole: "parent_caregiver",
      raterName: "Soo-Jin Kim",
      raterEmail: "soojin.kim@email.demo",
      delivery: "email_link",
      status: "completed",
      inviteToken: "tok-jordan-srs-p",
      sentAt: daysAgo(10),
      completedAt: daysAgo(8),
      responses: { q1: 2, q2: 1, q3: 2, q4: 3, q5: 2, q6: 1, q7: 2, q8: 2, q9: 1 },
    },
    {
      id: "form-jordan-srs-t",
      caseId: "case-jordan-progress",
      productCode: "SRS-2",
      formCatalogId: "srs2-teacher",
      formName: "Teacher Form",
      raterRole: "teacher",
      raterName: "Mr. Hale",
      raterEmail: "jhale@cedar.k12.demo",
      delivery: "email_link",
      status: "sent",
      inviteToken: "tok-jordan-srs-t",
      sentAt: daysAgo(10),
      dueDate: daysAgo(-5),
    },
    {
      id: "form-jordan-abas-p",
      caseId: "case-jordan-progress",
      productCode: "ABAS-3",
      formCatalogId: "abas3-parent",
      formName: "Parent Form",
      raterRole: "parent_caregiver",
      raterName: "Soo-Jin Kim",
      raterEmail: "soojin.kim@email.demo",
      delivery: "email_link",
      status: "in_progress",
      inviteToken: "tok-jordan-abas-p",
      sentAt: daysAgo(9),
      responses: { q1: 2, q2: 2, q3: 1 },
    },
    {
      id: "form-sam-p",
      caseId: "case-sam-scored",
      productCode: "SRS-2",
      formCatalogId: "srs2-parent",
      formName: "Parent/Caregiver Form",
      raterRole: "parent_caregiver",
      raterName: "Luis Torres",
      raterEmail: "ltorres@email.demo",
      delivery: "email_link",
      status: "completed",
      inviteToken: "tok-sam-p",
      sentAt: daysAgo(42),
      completedAt: daysAgo(38),
      responses: { q1: 3, q2: 3, q3: 2, q4: 2, q5: 3, q6: 2, q7: 3, q8: 2, q9: 3 },
    },
    {
      id: "form-sam-t",
      caseId: "case-sam-scored",
      productCode: "SRS-2",
      formCatalogId: "srs2-teacher",
      formName: "Teacher Form",
      raterRole: "teacher",
      raterName: "Ms. Nguyen",
      raterEmail: "anguyen@oak.k12.demo",
      delivery: "on_screen",
      status: "completed",
      inviteToken: "tok-sam-t",
      completedAt: daysAgo(36),
      responses: { q1: 2, q2: 3, q3: 3, q4: 2, q5: 2, q6: 3, q7: 2, q8: 3, q9: 2 },
    },
    {
      id: "form-alex-t1-p",
      caseId: "case-alex-t1",
      productCode: "ABAS-3",
      formCatalogId: "abas3-parent",
      formName: "Parent Form",
      raterRole: "parent_caregiver",
      raterName: "Priya Patel",
      raterEmail: "ppatel@email.demo",
      delivery: "email_link",
      status: "completed",
      inviteToken: "tok-alex-t1",
      completedAt: daysAgo(305),
      responses: { q1: 1, q2: 2, q3: 1, q4: 2, q5: 1, q6: 2, q7: 1, q8: 2, q9: 1 },
    },
    {
      id: "form-alex-t2-p",
      caseId: "case-alex-t2",
      productCode: "ABAS-3",
      formCatalogId: "abas3-parent",
      formName: "Parent Form",
      raterRole: "parent_caregiver",
      raterName: "Priya Patel",
      raterEmail: "ppatel@email.demo",
      delivery: "email_link",
      status: "completed",
      inviteToken: "tok-alex-t2",
      completedAt: daysAgo(30),
      responses: { q1: 2, q2: 2, q3: 2, q4: 3, q5: 2, q6: 2, q7: 2, q8: 3, q9: 2 },
    },
  ];

  const reports: Report[] = [
    {
      id: "rep-sam-srs",
      caseId: "case-sam-scored",
      productCode: "SRS-2",
      type: "score",
      title: "SRS-2 Score Report",
      generatedAt: daysAgo(30),
      summary:
        "Multi-rater SRS-2 results suggest elevated social communication differences warranting comprehensive follow-up.",
      domains: [
        { name: "Social Awareness", score: 68, range: "Moderate" },
        { name: "Social Cognition", score: 72, range: "Moderate–High" },
        { name: "Social Communication", score: 70, range: "Moderate" },
        { name: "Social Motivation", score: 64, range: "Mild–Moderate" },
        { name: "RRB", score: 66, range: "Moderate" },
      ],
      narrative:
        "Parent and teacher ratings are broadly consistent. Scores are demo values only and are not clinical interpretations. In a real WPS workflow, standard scores and confidence intervals would be generated by the scoring engine.",
    },
    {
      id: "rep-alex-t1",
      caseId: "case-alex-t1",
      productCode: "ABAS-3",
      type: "score",
      title: "ABAS-3 Score Report (Baseline)",
      generatedAt: daysAgo(300),
      summary: "Baseline adaptive skills in the below-average range across domains.",
      domains: [
        { name: "Conceptual", score: 78, range: "Below Average" },
        { name: "Social", score: 82, range: "Below Average" },
        { name: "Practical", score: 80, range: "Below Average" },
        { name: "GAC", score: 79, range: "Below Average" },
      ],
      narrative:
        "Baseline administration used for later progress comparison. Demo scores only.",
    },
    {
      id: "rep-alex-t2",
      caseId: "case-alex-t2",
      productCode: "ABAS-3",
      type: "score",
      title: "ABAS-3 Score Report (Progress)",
      generatedAt: daysAgo(28),
      summary: "Modest gains in practical and social adaptive skills since baseline.",
      domains: [
        { name: "Conceptual", score: 84, range: "Low Average" },
        { name: "Social", score: 88, range: "Low Average" },
        { name: "Practical", score: 90, range: "Average" },
        { name: "GAC", score: 87, range: "Low Average" },
      ],
      narrative:
        "Compared with Fall 2025 baseline, scores moved upward in most domains. Demo data only.",
    },
    {
      id: "rep-alex-progress",
      caseId: "case-alex-t2",
      productCode: "ABAS-3",
      type: "progress_comparison",
      title: "ABAS-3 Progress Comparison (T1 vs T2)",
      generatedAt: daysAgo(28),
      summary: "Progress comparison between baseline and current administration.",
      domains: [
        { name: "Conceptual Δ", score: 6, range: "Improved" },
        { name: "Social Δ", score: 6, range: "Improved" },
        { name: "Practical Δ", score: 10, range: "Improved" },
        { name: "GAC Δ", score: 8, range: "Improved" },
      ],
      narrative:
        "This mirrors WPS-style progress monitoring reports: same instrument, two time points, domain change summary. Values are simulated.",
    },
  ];

  // Demo language-sample session tied to Maya Rivera
  const demoAnalysis = analyzeSession(
    SAMPLE_TRANSCRIPT,
    SAMPLE_SESSION_META.durationSec
  );
  const sessionRecordings: SessionRecording[] = [
    {
      id: "sess-maya-weekend",
      clientId: "cli-maya",
      title: SAMPLE_SESSION_META.title,
      mode: "demo",
      createdAt: daysAgo(1),
      durationSec: demoAnalysis.durationSec,
      engagementScore: demoAnalysis.engagement.engagementScore,
      clientTalkRatio: demoAnalysis.engagement.clientTalkRatio,
      clientWordCount: demoAnalysis.client.totalWords,
      clientUniqueWords: demoAnalysis.client.uniqueWords,
      typeTokenRatio: demoAnalysis.client.typeTokenRatio,
      meanUtteranceLength: demoAnalysis.client.meanUtteranceLength,
      narrative: demoAnalysis.engagement.narrative,
      highlights: demoAnalysis.engagement.highlights,
      recommendations: demoAnalysis.engagement.recommendations,
      turns: demoAnalysis.turns.map((t) => ({
        id: t.id,
        speaker: t.speaker,
        text: t.text,
        startSec: t.startSec,
        endSec: t.endSec,
      })),
    },
  ];

  return { clients, cases, forms, reports, sessionRecordings };
}
