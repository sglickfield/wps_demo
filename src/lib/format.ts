import type { CaseStatus, FormStatus, RaterRole } from "../types";

export function ageFromDob(dob: string): number {
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function caseStatusLabel(s: CaseStatus): string {
  return (
    {
      draft: "Draft",
      in_progress: "In progress",
      ready_to_score: "Ready to score",
      scored: "Scored",
      closed: "Closed",
    }[s] ?? s
  );
}

export function caseStatusClass(s: CaseStatus): string {
  if (s === "scored" || s === "closed") return "success";
  if (s === "ready_to_score") return "info";
  if (s === "in_progress") return "warning";
  return "";
}

export function formStatusLabel(s: FormStatus): string {
  return (
    {
      not_sent: "Not sent",
      sent: "Sent",
      in_progress: "In progress",
      completed: "Completed",
      expired: "Expired",
    }[s] ?? s
  );
}

export function formStatusClass(s: FormStatus): string {
  if (s === "completed") return "success";
  if (s === "sent" || s === "in_progress") return "warning";
  if (s === "expired") return "danger";
  return "";
}

export function raterRoleLabel(r: RaterRole): string {
  return (
    {
      parent_caregiver: "Parent/Caregiver",
      teacher: "Teacher",
      self: "Self",
      clinician: "Clinician",
    }[r] ?? r
  );
}
