import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, PageHeader, TextLink } from "../components/ui";
import {
  ageFromDob,
  caseStatusClass,
  caseStatusLabel,
  formatDate,
} from "../lib/format";
import { sampleTypeLabel } from "../lib/sessionAnalytics";
import { useStore } from "../mock/store";

export function ClientHomePage() {
  const { id } = useParams();
  const {
    getClient,
    casesForClient,
    reportsForClient,
    sessionsForClient,
  } = useStore();
  const client = id ? getClient(id) : undefined;

  if (!client) {
    return (
      <Card>
        <p>Client not found.</p>
        <TextLink to="/clients">Back to clients</TextLink>
      </Card>
    );
  }

  const cases = casesForClient(client.id);
  const reports = reportsForClient(client.id);
  const sessions = sessionsForClient(client.id);

  return (
    <>
      <PageHeader
        title={client.name}
        subtitle={`${ageFromDob(client.dob)} years · DOB ${formatDate(client.dob)}${
          client.mrn ? ` · ${client.mrn}` : ""
        }`}
        actions={
          <Link to={`/cases/new?clientId=${client.id}`}>
            <Button>New case</Button>
          </Link>
        }
      />

      <div className="grid-2">
        <Card>
          <h2 style={{ fontSize: "1.1rem" }}>Profile</h2>
          <p className="muted" style={{ margin: 0 }}>
            {client.school || "No school listed"}
            {client.grade ? ` · Grade ${client.grade}` : ""}
          </p>
          {client.notes ? (
            <p style={{ marginTop: 12 }}>{client.notes}</p>
          ) : (
            <p className="faint" style={{ marginTop: 12 }}>
              No notes.
            </p>
          )}
        </Card>
        <Card>
          <h2 style={{ fontSize: "1.1rem" }}>At a glance</h2>
          <p style={{ margin: 0 }}>
            <strong>{cases.length}</strong> case(s) ·{" "}
            <strong>{reports.length}</strong> report(s) ·{" "}
            <strong>{sessions.length}</strong> session recording(s)
          </p>
          <p className="faint" style={{ marginTop: 8 }}>
            Record created {formatDate(client.createdAt)}
          </p>
        </Card>
      </div>

      <Card>
        <div className="section-head">
          <h2 className="section-title">Cases</h2>
          <Link to={`/cases/new?clientId=${client.id}`}>
            <Button variant="secondary">New case</Button>
          </Link>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Title</th>
                <th>Products</th>
                <th>Status</th>
                <th>Opened</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id}>
                  <td>
                    <TextLink to={`/cases/${c.id}`}>{c.title}</TextLink>
                    <div className="faint">{c.reason}</div>
                  </td>
                  <td>{c.productCodes.join(", ")}</td>
                  <td>
                    <Badge tone={caseStatusClass(c.status)}>
                      {caseStatusLabel(c.status)}
                    </Badge>
                  </td>
                  <td>{formatDate(c.openedAt)}</td>
                </tr>
              ))}
              {!cases.length ? (
                <tr>
                  <td colSpan={4} className="muted">
                    No cases yet. Start the first administration for this client.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="section-head">
          <div>
            <h2 className="section-title">Language samples</h2>
            <p className="muted section-sub">
              Browser language-sample review for this client (therapist / client
              diarization).
            </p>
          </div>
          <Link to={`/session-analytics?clientId=${client.id}`}>
            <Button variant="secondary">Open samples</Button>
          </Link>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Session</th>
                <th>Type</th>
                <th>Engagement</th>
                <th>Vocabulary</th>
                <th>Contingency</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>
                    <TextLink
                      to={`/session-analytics?clientId=${client.id}&sessionId=${s.id}`}
                    >
                      {s.title}
                    </TextLink>
                    <div className="faint">{s.durationSec.toFixed(0)}s</div>
                  </td>
                  <td>
                    <Badge tone="info">
                      {sampleTypeLabel(s.sampleType)}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      tone={
                        s.engagementScore >= 80
                          ? "success"
                          : s.engagementScore >= 60
                            ? "info"
                            : "warning"
                      }
                    >
                      {s.engagementScore}/100
                    </Badge>
                  </td>
                  <td className="faint" style={{ fontSize: 13 }}>
                    {s.clientWordCount} words · NDW {s.clientUniqueWords} · MLU{" "}
                    {s.meanUtteranceLength.toFixed(1)}
                  </td>
                  <td className="faint" style={{ fontSize: 13 }}>
                    {s.contingentQuestions
                      ? `${s.contingentResponses}/${s.contingentQuestions} responses`
                      : "—"}
                  </td>
                  <td>{formatDate(s.createdAt)}</td>
                </tr>
              ))}
              {!sessions.length ? (
                <tr>
                  <td colSpan={6} className="muted">
                    No language samples yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 style={{ fontSize: "1.1rem" }}>Reports</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Report</th>
                <th>Product</th>
                <th>Generated</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>
                    <TextLink to={`/reports/${r.id}`}>{r.title}</TextLink>
                  </td>
                  <td>{r.productCode}</td>
                  <td>{formatDate(r.generatedAt)}</td>
                </tr>
              ))}
              {!reports.length ? (
                <tr>
                  <td colSpan={3} className="muted">
                    No scored reports yet.
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
