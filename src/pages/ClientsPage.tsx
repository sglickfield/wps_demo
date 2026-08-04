import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, PageHeader, TextLink } from "../components/ui";
import { ageFromDob, formatDate } from "../lib/format";
import { useStore } from "../mock/store";

export function ClientsPage() {
  const { clients, casesForClient } = useStore();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        (c.mrn || "").toLowerCase().includes(s) ||
        (c.school || "").toLowerCase().includes(s)
    );
  }, [clients, q]);

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle="Examinee records for assessment administrations."
        actions={
          <Link to="/clients/new">
            <Button>New client</Button>
          </Link>
        }
      />
      <Card>
        <div className="field" style={{ maxWidth: 360 }}>
          <label htmlFor="q">Search</label>
          <input
            id="q"
            placeholder="Name, MRN, school…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>School / grade</th>
                <th>Cases</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <TextLink to={`/clients/${c.id}`}>{c.name}</TextLink>
                    {c.mrn ? <div className="faint">{c.mrn}</div> : null}
                  </td>
                  <td>{ageFromDob(c.dob)}</td>
                  <td>
                    {c.school || "—"}
                    {c.grade ? ` · Gr. ${c.grade}` : ""}
                  </td>
                  <td>{casesForClient(c.id).length}</td>
                  <td>{formatDate(c.createdAt)}</td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={5} className="muted">
                    No clients match.
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
