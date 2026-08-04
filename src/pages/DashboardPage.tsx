import { Link } from "react-router-dom";
import { Badge, Button, Card, PageHeader, TextLink } from "../components/ui";
import {
  caseStatusClass,
  caseStatusLabel,
  formStatusClass,
  formStatusLabel,
  formatDate,
} from "../lib/format";
import { useStore } from "../mock/store";

export function DashboardPage() {
  const { cases, forms, reports, clients, getClient } = useStore();

  const pendingForms = forms.filter(
    (f) => f.status === "sent" || f.status === "in_progress" || f.status === "not_sent"
  );
  const ready = cases.filter((c) => c.status === "ready_to_score");
  const recentReports = [...reports]
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Work queue for open cases, pending rater forms, and recent reports."
        actions={
          <>
            <Link to="/session-analytics">
              <Button variant="secondary">Session analytics</Button>
            </Link>
            <Link to="/clients/new">
              <Button variant="secondary">New client</Button>
            </Link>
            <Link to="/clients">
              <Button>Start a case</Button>
            </Link>
          </>
        }
      />

      <div className="grid-3" style={{ marginBottom: 16 }}>
        <Card className="stat-card">
          <h3>Active clients</h3>
          <div className="value">{clients.length}</div>
        </Card>
        <Card className="stat-card">
          <h3>Forms needing action</h3>
          <div className="value">{pendingForms.length}</div>
        </Card>
        <Card className="stat-card">
          <h3>Ready to score</h3>
          <div className="value">{ready.length}</div>
        </Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.05rem", margin: 0 }}>
              Recording analytics (browser)
            </h2>
            <p className="muted" style={{ margin: "6px 0 0", fontSize: 14 }}>
              Language-sample analytics are tied to a specific client record.
              Demo seed includes a weekend narrative for Maya Rivera.
            </p>
          </div>
          <div className="row-actions">
            <Link to="/session-analytics?clientId=cli-maya">
              <Button>Maya — session analytics</Button>
            </Link>
            <Link to="/session-analytics">
              <Button variant="secondary">Choose client</Button>
            </Link>
          </div>
        </div>
      </Card>

      <Card>
        <h2 style={{ fontSize: "1.15rem" }}>Needs attention</h2>
        <p className="muted" style={{ marginBottom: 12 }}>
          Forms not completed and cases waiting for scoring.
        </p>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Client</th>
                <th>Case / form</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {ready.map((c) => {
                const client = getClient(c.clientId);
                return (
                  <tr key={c.id}>
                    <td>
                      <TextLink to={`/clients/${c.clientId}`}>
                        {client?.name ?? "—"}
                      </TextLink>
                    </td>
                    <td>
                      <TextLink to={`/cases/${c.id}`}>{c.title}</TextLink>
                    </td>
                    <td>
                      <Badge tone={caseStatusClass(c.status)}>
                        {caseStatusLabel(c.status)}
                      </Badge>
                    </td>
                    <td>{formatDate(c.openedAt)}</td>
                  </tr>
                );
              })}
              {pendingForms.slice(0, 8).map((f) => {
                const c = cases.find((x) => x.id === f.caseId);
                const client = c ? getClient(c.clientId) : undefined;
                return (
                  <tr key={f.id}>
                    <td>{client?.name ?? "—"}</td>
                    <td>
                      <TextLink to={`/cases/${f.caseId}`}>
                        {f.productCode} · {f.formName}
                      </TextLink>
                      <div className="faint">
                        {f.raterName} ({f.raterEmail})
                      </div>
                    </td>
                    <td>
                      <Badge tone={formStatusClass(f.status)}>
                        {formStatusLabel(f.status)}
                      </Badge>
                    </td>
                    <td>{formatDate(f.sentAt || c?.openedAt)}</td>
                  </tr>
                );
              })}
              {!ready.length && !pendingForms.length ? (
                <tr>
                  <td colSpan={4} className="muted">
                    Nothing pending. Create a client or open a new case.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 style={{ fontSize: "1.15rem" }}>Recent reports</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Report</th>
                <th>Client</th>
                <th>Generated</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((r) => {
                const c = cases.find((x) => x.id === r.caseId);
                const client = c ? getClient(c.clientId) : undefined;
                return (
                  <tr key={r.id}>
                    <td>
                      <TextLink to={`/reports/${r.id}`}>{r.title}</TextLink>
                    </td>
                    <td>{client?.name ?? "—"}</td>
                    <td>{formatDate(r.generatedAt)}</td>
                  </tr>
                );
              })}
              {!recentReports.length ? (
                <tr>
                  <td colSpan={3} className="muted">
                    No reports yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
