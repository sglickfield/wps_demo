import { Card, PageHeader } from "../components/ui";
import { CATALOG } from "../mock/store";
import { raterRoleLabel } from "../lib/format";

export function LibraryPage() {
  return (
    <>
      <PageHeader
        title="Assessment library"
        subtitle="Mock catalog of instruments available for online administration in this demo."
      />
      {CATALOG.map((p) => (
        <Card key={p.code}>
          <h2 style={{ fontSize: "1.15rem", marginBottom: 4 }}>
            {p.shortName}{" "}
            <span className="faint" style={{ fontFamily: "var(--font)", fontSize: 14 }}>
              {p.area}
            </span>
          </h2>
          <p className="muted">{p.name}</p>
          <p>{p.description}</p>
          <ul>
            {p.forms.map((f) => (
              <li key={f.id}>
                {f.name} — {raterRoleLabel(f.raterRoleDefault)} (~
                {f.estimatedMinutes} min)
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </>
  );
}
