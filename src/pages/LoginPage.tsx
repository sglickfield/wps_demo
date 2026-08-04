import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button, Card, Field } from "../components/ui";
import { CLINICIAN, DEMO_PASSWORD, useStore } from "../mock/store";

export function LoginPage() {
  const { session, login } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState(CLINICIAN.email);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (session) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const ok = await login(email, password);
    setLoading(false);
    if (ok) navigate("/");
    else setError("Invalid credentials. Use the demo account shown below.");
  };

  return (
    <div className="login-page">
      <Card className="login-card">
        <div className="brand">
          <h1>Assessment Practice Portal</h1>
          <p className="muted">
            Mock clinician workspace inspired by online evaluation workflows.
          </p>
        </div>
        <form onSubmit={onSubmit}>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>
          {error ? (
            <p style={{ color: "var(--danger)", fontSize: 14 }}>{error}</p>
          ) : null}
          <Button type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="faint" style={{ marginTop: 16 }}>
          Demo: <code>{CLINICIAN.email}</code> / <code>{DEMO_PASSWORD}</code>
        </p>
      </Card>
    </div>
  );
}
