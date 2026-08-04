import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, Field, PageHeader, TextLink } from "../components/ui";
import { CATALOG, useStore } from "../mock/store";
import type { DeliveryMethod, RaterRole } from "../types";
import { raterRoleLabel } from "../lib/format";

type Spec = {
  productCode: string;
  formCatalogId: string;
  formName: string;
  raterRole: RaterRole;
  raterName: string;
  raterEmail: string;
  delivery: DeliveryMethod;
};

export function NewCasePage() {
  const [params] = useSearchParams();
  const clientId = params.get("clientId") || "";
  const { getClient, createCase } = useStore();
  const client = getClient(clientId);
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedForms = useMemo(() => {
    const out: { productCode: string; formCatalogId: string; formName: string; raterRole: RaterRole }[] = [];
    for (const p of CATALOG) {
      for (const f of p.forms) {
        if (selected[f.id]) {
          out.push({
            productCode: p.code,
            formCatalogId: f.id,
            formName: f.name,
            raterRole: f.raterRoleDefault,
          });
        }
      }
    }
    return out;
  }, [selected]);

  if (!client) {
    return (
      <Card>
        <p>Select a client first.</p>
        <TextLink to="/clients">Go to clients</TextLink>
      </Card>
    );
  }

  const toggleForm = (formId: string) => {
    setSelected((prev) => ({ ...prev, [formId]: !prev[formId] }));
  };

  const goAssign = () => {
    setSpecs(
      selectedForms.map((f) => ({
        ...f,
        raterName: "",
        raterEmail: "",
        delivery: "email_link" as DeliveryMethod,
      }))
    );
    setStep(2);
  };

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const rec = await createCase({
      clientId: client.id,
      title: title || `${client.name} evaluation`,
      reason,
      formSpecs: specs,
    });
    setLoading(false);
    navigate(`/cases/${rec.id}`);
  };

  return (
    <>
      <PageHeader
        title="New case"
        subtitle={`Client: ${client.name}`}
      />
      <div className="wizard-steps">
        <span className={step === 0 ? "active" : step > 0 ? "done" : ""}>
          1. Details
        </span>
        <span className={step === 1 ? "active" : step > 1 ? "done" : ""}>
          2. Forms
        </span>
        <span className={step === 2 ? "active" : step > 2 ? "done" : ""}>
          3. Raters
        </span>
        <span className={step === 3 ? "active" : ""}>4. Confirm</span>
      </div>

      {step === 0 ? (
        <Card style={{ maxWidth: 560 }}>
          <Field label="Case title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Spring 2026 comprehensive eval"
            />
          </Field>
          <Field label="Reason for referral">
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this administration being opened?"
              required
            />
          </Field>
          <Button type="button" onClick={() => setStep(1)} disabled={!reason.trim()}>
            Continue
          </Button>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card>
          <p className="muted">
            Select forms for the battery (aligned with OES “add form” step).
          </p>
          {CATALOG.map((p) => (
            <div key={p.code} style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: "1rem", marginBottom: 4 }}>
                {p.shortName}{" "}
                <span className="faint">· {p.area}</span>
              </h3>
              <p className="faint" style={{ marginBottom: 8 }}>
                {p.description}
              </p>
              {p.forms.map((f) => (
                <label
                  key={f.id}
                  className={`checkbox-row ${selected[f.id] ? "selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={!!selected[f.id]}
                    onChange={() => toggleForm(f.id)}
                  />
                  <div>
                    <strong>{f.name}</strong>
                    <div className="faint">
                      Default rater: {raterRoleLabel(f.raterRoleDefault)} · ~
                      {f.estimatedMinutes} min
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ))}
          <div className="row-actions">
            <Button type="button" variant="secondary" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button
              type="button"
              onClick={goAssign}
              disabled={!selectedForms.length}
            >
              Continue
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <p className="muted">
            Designate rater and delivery method for each form (email link or
            on-screen).
          </p>
          {specs.map((s, i) => (
            <div
              key={s.formCatalogId}
              style={{
                borderTop: i ? "1px solid var(--border)" : undefined,
                paddingTop: i ? 16 : 0,
                marginTop: i ? 16 : 0,
              }}
            >
              <strong>
                {s.productCode} · {s.formName}
              </strong>
              <div className="grid-2" style={{ marginTop: 8 }}>
                <Field label="Rater role">
                  <select
                    value={s.raterRole}
                    onChange={(e) => {
                      const next = [...specs];
                      next[i] = {
                        ...s,
                        raterRole: e.target.value as RaterRole,
                      };
                      setSpecs(next);
                    }}
                  >
                    <option value="parent_caregiver">Parent/Caregiver</option>
                    <option value="teacher">Teacher</option>
                    <option value="self">Self</option>
                    <option value="clinician">Clinician</option>
                  </select>
                </Field>
                <Field label="Delivery">
                  <select
                    value={s.delivery}
                    onChange={(e) => {
                      const next = [...specs];
                      next[i] = {
                        ...s,
                        delivery: e.target.value as DeliveryMethod,
                      };
                      setSpecs(next);
                    }}
                  >
                    <option value="email_link">Email link (remote)</option>
                    <option value="on_screen">On-screen (in session)</option>
                    <option value="manual_entry">Manual entry later</option>
                  </select>
                </Field>
                <Field label="Rater name">
                  <input
                    required
                    value={s.raterName}
                    onChange={(e) => {
                      const next = [...specs];
                      next[i] = { ...s, raterName: e.target.value };
                      setSpecs(next);
                    }}
                  />
                </Field>
                <Field label="Rater email">
                  <input
                    type="email"
                    required
                    value={s.raterEmail}
                    onChange={(e) => {
                      const next = [...specs];
                      next[i] = { ...s, raterEmail: e.target.value };
                      setSpecs(next);
                    }}
                  />
                </Field>
              </div>
            </div>
          ))}
          <div className="row-actions" style={{ marginTop: 16 }}>
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              type="button"
              onClick={() => setStep(3)}
              disabled={specs.some((s) => !s.raterName.trim() || !s.raterEmail.trim())}
            >
              Review
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <h2 style={{ fontSize: "1.15rem" }}>Confirm case</h2>
          <p>
            <strong>Title:</strong> {title || `${client.name} evaluation`}
          </p>
          <p>
            <strong>Reason:</strong> {reason}
          </p>
          <ul>
            {specs.map((s) => (
              <li key={s.formCatalogId}>
                {s.productCode} · {s.formName} → {s.raterName} ({s.delivery})
              </li>
            ))}
          </ul>
          <form onSubmit={onCreate}>
            <div className="row-actions">
              <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Opening case…" : "Open case"}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
    </>
  );
}
