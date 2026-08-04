import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Card } from "../components/ui";
import { getFormSections } from "../mock/catalog";
import { useStore } from "../mock/store";

export function RaterLandingPage() {
  const { token } = useParams();
  const { getFormByToken, getCase, getClient } = useStore();
  const form = token ? getFormByToken(token) : undefined;
  const c = form ? getCase(form.caseId) : undefined;
  const client = c ? getClient(c.clientId) : undefined;
  const navigate = useNavigate();
  const [name, setName] = useState(form?.raterName || "");

  if (!form || !c || !client) {
    return (
      <div className="login-page">
        <Card className="login-card">
          <h1>Invite not found</h1>
          <p className="muted">
            This link may be invalid or expired in the demo data.
          </p>
        </Card>
      </div>
    );
  }

  if (form.status === "completed") {
    return (
      <div className="login-page">
        <Card className="login-card">
          <h1>Already submitted</h1>
          <p className="muted">
            Thank you — this form for <strong>{client.name}</strong> was already
            completed.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="login-page">
      <Card className="login-card">
        <p className="faint">Secure rater invite (demo)</p>
        <h1>
          {form.productCode} · {form.formName}
        </h1>
        <p className="muted">
          You are invited to rate <strong>{client.name}</strong> as{" "}
          <strong>{form.raterName}</strong>. Please complete this form based on
          your observations. Responses are mock-stored only.
        </p>
        <div className="field">
          <label>Confirm your name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button
          style={{ width: "100%" }}
          disabled={!name.trim()}
          onClick={() => navigate(`/r/${token}/form`)}
        >
          Begin assessment
        </Button>
      </Card>
    </div>
  );
}

export function RaterFormPage() {
  const { token } = useParams();
  const { getFormByToken, getCase, getClient, completeForm, saveFormProgress } =
    useStore();
  const form = token ? getFormByToken(token) : undefined;
  const c = form ? getCase(form.caseId) : undefined;
  const client = c ? getClient(c.clientId) : undefined;
  const sections = useMemo(
    () => getFormSections(form?.formName || "Form"),
    [form?.formName]
  );
  const [responses, setResponses] = useState<Record<string, number>>(
    () => (form?.responses as Record<string, number>) || {}
  );
  const [sectionIdx, setSectionIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  if (!form || !c || !client) {
    return (
      <div className="login-page">
        <Card className="login-card">
          <h1>Invite not found</h1>
        </Card>
      </div>
    );
  }

  if (form.status === "completed") {
    navigate(`/r/${token}/done`);
  }

  const section = sections[sectionIdx];
  const allItems = sections.flatMap((s) => s.items);
  const answered = allItems.filter((i) => responses[i.id] !== undefined).length;
  const progress = Math.round((answered / allItems.length) * 100);
  const sectionComplete = section.items.every(
    (i) => responses[i.id] !== undefined
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await completeForm(form.id, responses);
    setSaving(false);
    navigate(`/r/${token}/done`);
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "1.25rem" }}>
      <p className="faint">Rating for {client.name}</p>
      <h1 style={{ fontSize: "1.4rem" }}>
        {form.productCode} · {form.formName}
      </h1>
      <div className="progress-bar">
        <i style={{ width: `${progress}%` }} />
      </div>
      <p className="faint">
        Section {sectionIdx + 1} of {sections.length}
      </p>
      <Card>
        <h2 style={{ fontSize: "1.05rem" }}>{section.title}</h2>
        {section.items.map((item) => (
          <div className="form-item" key={item.id}>
            <div>{item.text}</div>
            <div className="likert">
              {item.scale.map((label, idx) => (
                <label key={label}>
                  <input
                    type="radio"
                    name={item.id}
                    checked={responses[item.id] === idx}
                    onChange={() =>
                      setResponses((prev) => ({ ...prev, [item.id]: idx }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        ))}
        <div className="row-actions" style={{ marginTop: 16 }}>
          <Button
            variant="secondary"
            disabled={sectionIdx === 0}
            onClick={() => setSectionIdx((i) => i - 1)}
          >
            Previous
          </Button>
          {sectionIdx < sections.length - 1 ? (
            <Button
              disabled={!sectionComplete}
              onClick={() => setSectionIdx((i) => i + 1)}
            >
              Next
            </Button>
          ) : (
            <Button
              disabled={answered < allItems.length || saving}
              onClick={onSubmit}
            >
              {saving ? "Submitting…" : "Submit"}
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={async () => {
              setSaving(true);
              await saveFormProgress(form.id, responses);
              setSaving(false);
            }}
          >
            Save
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function RaterDonePage() {
  return (
    <div className="login-page">
      <Card className="login-card">
        <h1>Thank you</h1>
        <p className="muted">
          Your responses were submitted (demo). You can close this window. The
          clinician will see the form marked completed on the case workspace.
        </p>
        <Link to="/login">
          <Button variant="secondary">Clinician login</Button>
        </Link>
      </Card>
    </div>
  );
}
