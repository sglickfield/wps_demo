import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Card, PageHeader, TextLink } from "../components/ui";
import { getFormSections } from "../mock/catalog";
import { useStore } from "../mock/store";

/** Clinician on-screen completion / response viewer */
export function FormTakePage() {
  const { id: caseId, formId } = useParams();
  const { getForm, getCase, getClient, completeForm, saveFormProgress } =
    useStore();
  const form = formId ? getForm(formId) : undefined;
  const c = caseId ? getCase(caseId) : undefined;
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
      <Card>
        <p>Form not found.</p>
        <TextLink to="/">Dashboard</TextLink>
      </Card>
    );
  }

  const readOnly = form.status === "completed";
  const section = sections[sectionIdx];
  const allItems = sections.flatMap((s) => s.items);
  const answered = allItems.filter((i) => responses[i.id] !== undefined).length;
  const progress = Math.round((answered / allItems.length) * 100);

  const setAnswer = (itemId: string, value: number) => {
    if (readOnly) return;
    setResponses((prev) => ({ ...prev, [itemId]: value }));
  };

  const onSave = async () => {
    setSaving(true);
    await saveFormProgress(form.id, responses);
    setSaving(false);
  };

  const onSubmit = async () => {
    setSaving(true);
    await completeForm(form.id, responses);
    setSaving(false);
    navigate(`/cases/${c.id}`);
  };

  const sectionComplete = section.items.every(
    (i) => responses[i.id] !== undefined
  );

  return (
    <>
      <PageHeader
        title={`${form.productCode} · ${form.formName}`}
        subtitle={`On-screen for ${client.name} · Rater: ${form.raterName}`}
      />
      <div className="progress-bar">
        <i style={{ width: `${progress}%` }} />
      </div>
      <p className="faint">
        Section {sectionIdx + 1} of {sections.length} · {progress}% complete
        {readOnly ? " · Submitted (read-only)" : ""}
      </p>

      <Card>
        <h2 style={{ fontSize: "1.1rem" }}>{section.title}</h2>
        {section.items.map((item) => (
          <div className="form-item" key={item.id}>
            <div>{item.text}</div>
            <div className="likert">
              {item.scale.map((label, idx) => (
                <label key={label}>
                  <input
                    type="radio"
                    name={item.id}
                    disabled={readOnly}
                    checked={responses[item.id] === idx}
                    onChange={() => setAnswer(item.id, idx)}
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
              Next section
            </Button>
          ) : null}
          {!readOnly ? (
            <>
              <Button variant="ghost" onClick={onSave} disabled={saving}>
                Save progress
              </Button>
              {answered === allItems.length ? (
                <Button onClick={onSubmit} disabled={saving}>
                  Submit form
                </Button>
              ) : null}
            </>
          ) : (
            <Link to={`/cases/${c.id}`}>
              <Button variant="secondary">Back to case</Button>
            </Link>
          )}
        </div>
      </Card>
    </>
  );
}
