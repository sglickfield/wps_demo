import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  CaseRecord,
  CaseStatus,
  Client,
  FormAssignment,
  FormStatus,
  Report,
  RaterRole,
  DeliveryMethod,
  SessionRecording,
  SessionRecordingMode,
} from "../types";
import { CATALOG, getProduct } from "./catalog";
import { CLINICIAN, DEMO_PASSWORD, createSeed } from "./seed";
import type { SessionAnalysis } from "../lib/sessionAnalytics";

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function delay(ms = 450): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function recomputeCaseStatus(
  c: CaseRecord,
  forms: FormAssignment[]
): CaseStatus {
  if (c.status === "closed" || c.status === "scored") return c.status;
  const mine = forms.filter((f) => f.caseId === c.id);
  if (!mine.length) return "draft";
  if (mine.every((f) => f.status === "completed")) return "ready_to_score";
  if (mine.some((f) => f.status !== "not_sent")) return "in_progress";
  return "draft";
}

interface StoreState {
  clients: Client[];
  cases: CaseRecord[];
  forms: FormAssignment[];
  reports: Report[];
  sessionRecordings: SessionRecording[];
  session: { clinicianId: string } | null;
  lastInviteLink: string | null;
}

interface StoreApi extends StoreState {
  clinician: typeof CLINICIAN;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  resetDemo: () => void;
  createClient: (input: Omit<Client, "id" | "createdAt">) => Promise<Client>;
  createCase: (input: {
    clientId: string;
    title: string;
    reason: string;
    formSpecs: {
      productCode: string;
      formCatalogId: string;
      raterRole: RaterRole;
      raterName: string;
      raterEmail: string;
      delivery: DeliveryMethod;
    }[];
  }) => Promise<CaseRecord>;
  sendInvite: (formId: string) => Promise<string>;
  saveFormProgress: (
    formId: string,
    responses: Record<string, number | string>
  ) => Promise<void>;
  completeForm: (
    formId: string,
    responses: Record<string, number | string>
  ) => Promise<void>;
  scoreCase: (caseId: string) => Promise<Report[]>;
  closeCase: (caseId: string) => Promise<void>;
  saveSessionRecording: (input: {
    clientId: string;
    title: string;
    mode: SessionRecordingMode;
    analysis: SessionAnalysis;
  }) => Promise<SessionRecording>;
  getSessionRecording: (id: string) => SessionRecording | undefined;
  sessionsForClient: (clientId: string) => SessionRecording[];
  getClient: (id: string) => Client | undefined;
  getCase: (id: string) => CaseRecord | undefined;
  getForm: (id: string) => FormAssignment | undefined;
  getFormByToken: (token: string) => FormAssignment | undefined;
  formsForCase: (caseId: string) => FormAssignment[];
  casesForClient: (clientId: string) => CaseRecord[];
  reportsForCase: (caseId: string) => Report[];
  reportsForClient: (clientId: string) => Report[];
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const seed = createSeed();
  const [clients, setClients] = useState(seed.clients);
  const [cases, setCases] = useState(seed.cases);
  const [forms, setForms] = useState(seed.forms);
  const [reports, setReports] = useState(seed.reports);
  const [sessionRecordings, setSessionRecordings] = useState(
    seed.sessionRecordings
  );
  const [session, setSession] = useState<StoreState["session"]>(() => {
    try {
      return localStorage.getItem("wps_demo_session")
        ? { clinicianId: CLINICIAN.id }
        : null;
    } catch {
      return null;
    }
  });
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    await delay(300);
    if (
      email.trim().toLowerCase() === CLINICIAN.email.toLowerCase() &&
      password === DEMO_PASSWORD
    ) {
      setSession({ clinicianId: CLINICIAN.id });
      localStorage.setItem("wps_demo_session", "1");
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    localStorage.removeItem("wps_demo_session");
  }, []);

  const resetDemo = useCallback(() => {
    const s = createSeed();
    setClients(s.clients);
    setCases(s.cases);
    setForms(s.forms);
    setReports(s.reports);
    setSessionRecordings(s.sessionRecordings);
    setLastInviteLink(null);
  }, []);

  const createClient = useCallback(
    async (input: Omit<Client, "id" | "createdAt">) => {
      await delay();
      const client: Client = {
        ...input,
        id: uid("cli"),
        createdAt: new Date().toISOString(),
      };
      setClients((prev) => [client, ...prev]);
      return client;
    },
    []
  );

  const createCase = useCallback(
    async (input: {
      clientId: string;
      title: string;
      reason: string;
      formSpecs: {
        productCode: string;
        formCatalogId: string;
        raterRole: RaterRole;
        raterName: string;
        raterEmail: string;
        delivery: DeliveryMethod;
      }[];
    }) => {
      await delay();
      const caseId = uid("case");
      const productCodes = [
        ...new Set(input.formSpecs.map((f) => f.productCode)),
      ];
      const rec: CaseRecord = {
        id: caseId,
        clientId: input.clientId,
        title: input.title.trim(),
        reason: input.reason.trim(),
        status: "draft",
        clinicianId: CLINICIAN.id,
        openedAt: new Date().toISOString(),
        productCodes,
      };
      const newForms: FormAssignment[] = input.formSpecs.map((spec) => {
        const product = getProduct(spec.productCode);
        const formMeta = product?.forms.find((f) => f.id === spec.formCatalogId);
        return {
          id: uid("form"),
          caseId,
          productCode: spec.productCode,
          formCatalogId: spec.formCatalogId,
          formName: formMeta?.name ?? "Form",
          raterRole: spec.raterRole,
          raterName: spec.raterName,
          raterEmail: spec.raterEmail,
          delivery: spec.delivery,
          status: "not_sent" as FormStatus,
          inviteToken: uid("tok"),
        };
      });
      setCases((prev) => [rec, ...prev]);
      setForms((prev) => [...newForms, ...prev]);
      return rec;
    },
    []
  );

  const sendInvite = useCallback(async (formId: string) => {
    await delay();
    let token = "";
    setForms((prev) =>
      prev.map((f) => {
        if (f.id !== formId) return f;
        token = f.inviteToken;
        return {
          ...f,
          status: f.status === "completed" ? f.status : "sent",
          sentAt: new Date().toISOString(),
        };
      })
    );
    setCases((prev) =>
      prev.map((c) => {
        const related = forms.filter(
          (f) => f.caseId === c.id || f.id === formId
        );
        // recompute with updated form will lag; set in_progress if draft
        if (
          related.some((f) => f.id === formId) ||
          forms.some((f) => f.caseId === c.id && f.id === formId)
        ) {
          if (c.status === "draft") return { ...c, status: "in_progress" };
        }
        return c;
      })
    );
    // Fix case status properly
    setForms((currentForms) => {
      setCases((currentCases) =>
        currentCases.map((c) => ({
          ...c,
          status: recomputeCaseStatus(c, currentForms),
        }))
      );
      return currentForms;
    });
    const link = `${window.location.origin}/r/${token}`;
    setLastInviteLink(link);
    return link;
  }, [forms]);

  const saveFormProgress = useCallback(
    async (formId: string, responses: Record<string, number | string>) => {
      await delay(150);
      setForms((prev) =>
        prev.map((f) =>
          f.id === formId
            ? {
                ...f,
                responses: { ...f.responses, ...responses },
                status:
                  f.status === "completed"
                    ? "completed"
                    : ("in_progress" as FormStatus),
              }
            : f
        )
      );
    },
    []
  );

  const completeForm = useCallback(
    async (formId: string, responses: Record<string, number | string>) => {
      await delay();
      setForms((prev) => {
        const next = prev.map((f) =>
          f.id === formId
            ? {
                ...f,
                responses,
                status: "completed" as FormStatus,
                completedAt: new Date().toISOString(),
              }
            : f
        );
        setCases((cs) =>
          cs.map((c) => ({
            ...c,
            status: recomputeCaseStatus(c, next),
          }))
        );
        return next;
      });
    },
    []
  );

  const scoreCase = useCallback(async (caseId: string) => {
    await delay(700);
    const c = cases.find((x) => x.id === caseId);
    if (!c) return [];
    const caseForms = forms.filter(
      (f) => f.caseId === caseId && f.status === "completed"
    );
    const generated: Report[] = c.productCodes.map((code) => {
      const product = getProduct(code);
      const avg =
        caseForms
          .filter((f) => f.productCode === code)
          .flatMap((f) => Object.values(f.responses || {}))
          .filter((v): v is number => typeof v === "number")
          .reduce((a, b, _, arr) => a + b / arr.length, 0) || 1.5;
      const base = Math.round(55 + avg * 8);
      return {
        id: uid("rep"),
        caseId,
        productCode: code,
        type: "score" as const,
        title: `${product?.shortName ?? code} Score Report`,
        generatedAt: new Date().toISOString(),
        summary: `Mock scored results for ${product?.name ?? code}. Not for clinical use.`,
        domains: [
          { name: "Domain A", score: base, range: "Average–Elevated" },
          { name: "Domain B", score: base + 4, range: "Elevated" },
          { name: "Domain C", score: base - 3, range: "Average" },
          { name: "Composite", score: base + 1, range: "Elevated" },
        ],
        narrative:
          "This demo report simulates automated scoring output from an online evaluation platform. Domain names and scores are illustrative only.",
      };
    });

    // Progress comparison if client has prior scored same product
    const clientCases = cases.filter(
      (x) => x.clientId === c.clientId && x.id !== caseId && x.status === "scored"
    );
    for (const code of c.productCodes) {
      const prior = clientCases.find((x) => x.productCodes.includes(code));
      if (prior) {
        generated.push({
          id: uid("rep"),
          caseId,
          productCode: code,
          type: "progress_comparison",
          title: `${getProduct(code)?.shortName ?? code} Progress Comparison`,
          generatedAt: new Date().toISOString(),
          summary: "Mock progress comparison against a prior administration.",
          domains: [
            { name: "Composite Δ", score: 6, range: "Improved" },
            { name: "Domain A Δ", score: 4, range: "Improved" },
            { name: "Domain B Δ", score: 8, range: "Improved" },
          ],
          narrative:
            "Mirrors progress-monitoring style reports available for selected WPS instruments. Demo values only.",
        });
      }
    }

    setReports((prev) => [...generated, ...prev]);
    setCases((prev) =>
      prev.map((x) =>
        x.id === caseId ? { ...x, status: "scored" as CaseStatus } : x
      )
    );
    return generated;
  }, [cases, forms]);

  const closeCase = useCallback(async (caseId: string) => {
    await delay(200);
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              status: "closed",
              closedAt: new Date().toISOString(),
            }
          : c
      )
    );
  }, []);

  const saveSessionRecording = useCallback(
    async (input: {
      clientId: string;
      title: string;
      mode: SessionRecordingMode;
      analysis: SessionAnalysis;
    }) => {
      await delay(200);
      const { analysis } = input;
      const eng = analysis.engagement;
      const rec: SessionRecording = {
        id: uid("sess"),
        clientId: input.clientId,
        title: input.title,
        mode: input.mode,
        createdAt: new Date().toISOString(),
        durationSec: analysis.durationSec,
        engagementScore: eng.engagementScore,
        clientTalkRatio: eng.clientTalkRatio,
        clientWordCount: analysis.client.tnw,
        clientUniqueWords: analysis.client.ndw,
        typeTokenRatio: analysis.client.typeTokenRatio,
        meanUtteranceLength: analysis.client.meanUtteranceLength,
        contingentResponses: eng.contingentResponses,
        contingentQuestions: eng.contingentQuestions,
        meanResponseLatencySec: eng.meanResponseLatencySec,
        initiativeTurns: eng.initiativeTurns,
        responseTurns: eng.responseTurns,
        initiativeRatio: eng.initiativeRatio,
        perseverationLevel: eng.perseveration.level,
        perseverationTopWord: eng.perseveration.topWord ?? undefined,
        perseverationTopShare: eng.perseveration.topShare,
        sampleType: analysis.sampleType,
        narrative: eng.narrative,
        highlights: eng.highlights,
        recommendations: eng.recommendations,
        turns: analysis.turns.map((t) => ({
          id: t.id,
          speaker: t.speaker,
          text: t.text,
          startSec: t.startSec,
          endSec: t.endSec,
        })),
      };
      setSessionRecordings((prev) => [rec, ...prev]);
      return rec;
    },
    []
  );

  const api: StoreApi = useMemo(
    () => ({
      clients,
      cases,
      forms,
      reports,
      sessionRecordings,
      session,
      lastInviteLink,
      clinician: CLINICIAN,
      login,
      logout,
      resetDemo,
      createClient,
      createCase,
      sendInvite,
      saveFormProgress,
      completeForm,
      scoreCase,
      closeCase,
      saveSessionRecording,
      getSessionRecording: (id) => sessionRecordings.find((s) => s.id === id),
      sessionsForClient: (clientId) =>
        sessionRecordings
          .filter((s) => s.clientId === clientId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      getClient: (id) => clients.find((c) => c.id === id),
      getCase: (id) => cases.find((c) => c.id === id),
      getForm: (id) => forms.find((f) => f.id === id),
      getFormByToken: (token) => forms.find((f) => f.inviteToken === token),
      formsForCase: (caseId) => forms.filter((f) => f.caseId === caseId),
      casesForClient: (clientId) =>
        cases
          .filter((c) => c.clientId === clientId)
          .sort((a, b) => b.openedAt.localeCompare(a.openedAt)),
      reportsForCase: (caseId) =>
        reports.filter((r) => r.caseId === caseId),
      reportsForClient: (clientId) => {
        const ids = new Set(
          cases.filter((c) => c.clientId === clientId).map((c) => c.id)
        );
        return reports.filter((r) => ids.has(r.caseId));
      },
    }),
    [
      clients,
      cases,
      forms,
      reports,
      sessionRecordings,
      session,
      lastInviteLink,
      login,
      logout,
      resetDemo,
      createClient,
      createCase,
      sendInvite,
      saveFormProgress,
      completeForm,
      scoreCase,
      closeCase,
      saveSessionRecording,
    ]
  );

  return (
    <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}

export { CATALOG, CLINICIAN, DEMO_PASSWORD };
