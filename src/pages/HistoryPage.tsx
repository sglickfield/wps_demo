import { useMemo, useState } from "react";
import { Badge, Card, PageHeader, TextLink } from "../components/ui";
import {
  caseStatusClass,
  caseStatusLabel,
  formatDate,
} from "../lib/format";
import { useStore } from "../mock/store";

export function HistoryPage() {
  const { cases, reports, getClient } = useStore();
  const [q, setQ] = useState("");
  const [product, setProduct] = useState("");
  const [status, setStatus] = useState("");

  const products = useMemo(
    () => [...new Set(cases.flatMap((c) => c.productCodes))].sort(),
    [cases]
  );

  const filteredCases = useMemo(() => {
    return cases
      .filter((c) => {
        const client = getClient(c.clientId);
        const s = q.trim().toLowerCase();
        if (
          s &&
          !c.title.toLowerCase().includes(s) &&
          !(client?.name || "").toLowerCase().includes(s)
        ) {
          return false;
        }
        if (product && !c.productCodes.includes(product)) return false;
        if (status && c.status !== status) return false;
        return true;
      })
      .sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  }, [cases, q, product, status, getClient]);

  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => {
        if (product && r.productCode !== product) return false;
        const c = cases.find((x) => x.id === r.caseId);
        const client = c ? getClient(c.clientId) : undefined;
        const s = q.trim().toLowerCase();
        if (
          s &&
          !r.title.toLowerCase().includes(s) &&
          !(client?.name || "").toLowerCase().includes(s)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  }, [reports, cases, q, product, getClient]);

  return (
    <>
      <PageHeader
        title="Assessment history"
        subtitle="Search past cases and reports across clients."
      />
      <Card>
        <div className="grid-3">
          <div className="field">
            <label>Search</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Client or case title…"
            />
          </div>
          <div className="field">
            <label>Product</label>
            <select value={product} onChange={(e) => setProduct(e.target.value)}>
              <option value="">All</option>
              {products.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Case status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="in_progress">In progress</option>
              <option value="ready_to_score">Ready to score</option>
              <option value="scored">Scored</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <h2 style={{ fontSize: "1.1rem" }}>Cases</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Client</th>
                <th>Case</th>
                <th>Products</th>
                <th>Status</th>
                <th>Opened</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((c) => {
                const client = getClient(c.clientId);
                return (
                  <tr key={c.id}>
                    <td>
                      <TextLink to={`/clients/${c.clientId}`}>
                        {client?.name}
                      </TextLink>
                    </td>
                    <td>
                      <TextLink to={`/cases/${c.id}`}>{c.title}</TextLink>
                    </td>
                    <td>{c.productCodes.join(", ")}</td>
                    <td>
                      <Badge tone={caseStatusClass(c.status)}>
                        {caseStatusLabel(c.status)}
                      </Badge>
                    </td>
                    <td>{formatDate(c.openedAt)}</td>
                  </tr>
                );
              })}
              {!filteredCases.length ? (
                <tr>
                  <td colSpan={5} className="muted">
                    No cases match filters.
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
                <th>Client</th>
                <th>Product</th>
                <th>Generated</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((r) => {
                const c = cases.find((x) => x.id === r.caseId);
                const client = c ? getClient(c.clientId) : undefined;
                return (
                  <tr key={r.id}>
                    <td>
                      <TextLink to={`/reports/${r.id}`}>{r.title}</TextLink>
                    </td>
                    <td>{client?.name}</td>
                    <td>{r.productCode}</td>
                    <td>{formatDate(r.generatedAt)}</td>
                  </tr>
                );
              })}
              {!filteredReports.length ? (
                <tr>
                  <td colSpan={4} className="muted">
                    No reports match filters.
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
