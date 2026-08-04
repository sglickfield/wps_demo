import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card, PageHeader, TextLink } from "../components/ui";
import {
  caseStatusClass,
  caseStatusLabel,
  formStatusClass,
  formStatusLabel,
  formatDate,
  raterRoleLabel,
} from "../lib/format";
import { useStore } from "../mock/store";

export function CaseWorkspacePage() {
  const { id } = useParams();
  const {
    getCase,
    getClient,
    formsForCase,
    reportsForCase,
    sendInvite,
    scoreCase,
    closeCase,
    lastInviteLink,
  } = useStore();
  const navigate = useNavigate();
  const c = id ? getCase(id) : undefined;
  const client = c ? getClient(c.clientId) : undefined;
  const forms = c ? formsForCase(c.id) : [];
  const reports = c ? reportsForCase(c.id) : [];
  const [busy, setBusy] = useState<string | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  if (!c || !client) {
    return (
      <Card>
        <p>Case not found.</p>
        <TextLink to="/">Dashboard</TextLink>
      </Card>
    );
  }

  const allComplete = forms.length > 0 && forms.every((f) => f.status === "completed");
  const canScore =
    (c.status === "ready_to_score" || allComplete) && c.status !== "scored" && c.status !== "closed";

  const onShare = async (formId: string) => {
    setBusy(formId);
    setShareMsg(null);
    const link = await sendInvite(formId);
    setBusy(null);
    setShareMsg(link);
  };

  const onScore = async () => {
    setBusy("score");
    const reps = await scoreCase(c.id);
    setBusy(null);
    if (reps[0]) navigate(`/reports/${reps[0].id}`);
  };

  return (
    <>
      <PageHeader
        title={c.title}
        subtitle={`${client.name} · ${c.productCodes.join(", ")}`}
        actions={
          <>
            {canScore ? (
              <Button onClick={onScore} disabled={busy === "score"}>
                {busy === "score" ? "Scoring…" : "Score case"}
              </Button>
            ) : null}
            {c.status === "scored" ? (
              <Button
                variant="secondary"
                onClick={async () => {
                  setBusy("close");
                  await closeCase(c.id);
                  setBusy(null);
                }}
                disabled={!!busy}
              >
                Close case
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid-2">
        <Card>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Badge tone={caseStatusClass(c.status)}>
              {caseStatusLabel(c.status)}
            </Badge>
            <span className="faint">Opened {formatDate(c.openedAt)}</span>
          </div>
          <p style={{ marginTop: 12 }}>
            <strong>Reason:</strong> {c.reason}
          </p>
          <p className="faint">
            Client:{" "}
            <TextLink to={`/clients/${client.id}`}>{client.name}</TextLink>
          </p>
        </Card>
        <Card>
          <h3 style={{ fontSize: "0.95rem", fontFamily: "var(--font)" }}>
            Workflow tip
          </h3>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Share each form to a rater (or complete on-screen). When all required
            forms are completed, score the case to generate mock reports — same
            loop as online evaluation platforms.
          </p>
          <p style={{ margin: "10px 0 0" }}>
            <TextLink to={`/session-analytics?clientId=${client.id}`}>
              Session recording analytics
            </TextLink>
            <span className="faint">
              {" "}
              — language samples for {client.name} (Therapist / Client)
            </span>
          </p>
        </Card>
      </div>

      {shareMsg ? (
        <Card>
          <strong>Invite sent (mock).</strong>
          <p className="muted" style={{ margin: "8px 0" }}>
            No email is actually delivered. Open this link as the rater:
          </p>
          <code style={{ wordBreak: "break-all" }}>{shareMsg}</code>
          <div className="row-actions" style={{ marginTop: 12 }}>
            <Button
              variant="secondary"
              onClick={() => {
                const path = shareMsg.replace(window.location.origin, "");
                navigate(path);
              }}
            >
              Open invite
            </Button>
            <Button variant="ghost" onClick={() => setShareMsg(null)}>
              Dismiss
            </Button>
          </div>
        </Card>
      ) : null}

      {lastInviteLink && !shareMsg ? (
        <p className="faint">Last invite: {lastInviteLink}</p>
      ) : null}

      <Card>
        <h2 style={{ fontSize: "1.1rem" }}>Forms in battery</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Form</th>
                <th>Rater</th>
                <th>Delivery</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((f) => (
                <tr key={f.id}>
                  <td>
                    <strong>
                      {f.productCode} · {f.formName}
                    </strong>
                  </td>
                  <td>
                    {f.raterName}
                    <div className="faint">
                      {raterRoleLabel(f.raterRole)} · {f.raterEmail}
                    </div>
                  </td>
                  <td>{f.delivery.replace("_", " ")}</td>
                  <td>
                    <Badge tone={formStatusClass(f.status)}>
                      {formStatusLabel(f.status)}
                    </Badge>
                    {f.completedAt ? (
                      <div className="faint">{formatDate(f.completedAt)}</div>
                    ) : null}
                  </td>
                  <td>
                    <div className="row-actions">
                      {f.status !== "completed" ? (
                        <>
                          <Button
                            variant="secondary"
                            style={{ fontSize: 12, padding: "0.3rem 0.55rem" }}
                            disabled={busy === f.id}
                            onClick={() => onShare(f.id)}
                          >
                            {f.status === "not_sent" ? "Share" : "Resend"}
                          </Button>
                          <Link to={`/cases/${c.id}/forms/${f.id}`}>
                            <Button
                              variant="ghost"
                              style={{ fontSize: 12, padding: "0.3rem 0.55rem" }}
                            >
                              On-screen
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <Link to={`/cases/${c.id}/forms/${f.id}`}>
                          <Button
                            variant="ghost"
                            style={{ fontSize: 12, padding: "0.3rem 0.55rem" }}
                          >
                            View responses
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 style={{ fontSize: "1.1rem" }}>Reports</h2>
        {reports.length ? (
          <ul>
            {reports.map((r) => (
              <li key={r.id}>
                <TextLink to={`/reports/${r.id}`}>{r.title}</TextLink>
                <span className="faint"> · {formatDate(r.generatedAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No reports yet. Complete forms, then score.</p>
        )}
      </Card>
    </>
  );
}
