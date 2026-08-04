import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Field, PageHeader } from "../components/ui";
import { useStore } from "../mock/store";

export function NewClientPage() {
  const { createClient } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    dob: "",
    sex: "Female",
    mrn: "",
    school: "",
    grade: "",
    notes: "",
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const client = await createClient(form);
    setLoading(false);
    navigate(`/clients/${client.id}`);
  };

  return (
    <>
      <PageHeader
        title="New client"
        subtitle="Create an examinee record before opening a case."
      />
      <Card style={{ maxWidth: 560 }}>
        <form onSubmit={onSubmit}>
          <Field label="Full name">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <div className="grid-2">
            <Field label="Date of birth">
              <input
                type="date"
                required
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
              />
            </Field>
            <Field label="Sex / gender">
              <select
                value={form.sex}
                onChange={(e) => setForm({ ...form, sex: e.target.value })}
              >
                <option>Female</option>
                <option>Male</option>
                <option>Nonbinary</option>
                <option>Prefer not to say</option>
              </select>
            </Field>
          </div>
          <Field label="ID / MRN (optional)">
            <input
              value={form.mrn}
              onChange={(e) => setForm({ ...form, mrn: e.target.value })}
            />
          </Field>
          <div className="grid-2">
            <Field label="School (optional)">
              <input
                value={form.school}
                onChange={(e) => setForm({ ...form, school: e.target.value })}
              />
            </Field>
            <Field label="Grade (optional)">
              <input
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Notes (optional)">
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
          <div className="row-actions">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save client"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/clients")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
