import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useStore } from "../mock/store";
import { Button, DemoBanner } from "./ui";

export function ClinicianLayout() {
  const { clinician, logout, resetDemo } = useStore();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <aside className="sidebar no-print">
        <div className="sidebar-brand">
          <strong>Assessment Practice Portal</strong>
          <span>Clinician workspace (demo)</span>
        </div>
        <nav>
          <NavLink className="nav-link" to="/" end>
            Dashboard
          </NavLink>
          <NavLink className="nav-link" to="/clients">
            Clients
          </NavLink>
          <NavLink className="nav-link" to="/history">
            History
          </NavLink>
          <NavLink className="nav-link" to="/assessments">
            Library
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div style={{ marginBottom: 8 }}>
            <strong style={{ color: "#fff" }}>{clinician.name}</strong>
            <div>{clinician.title}</div>
            <div className="faint" style={{ color: "#9fb0c5" }}>
              {clinician.organization}
            </div>
          </div>
          <div className="row-actions">
            <Button
              variant="secondary"
              style={{ fontSize: 12, padding: "0.35rem 0.6rem" }}
              onClick={() => {
                resetDemo();
              }}
            >
              Reset demo
            </Button>
            <Button
              variant="ghost"
              style={{ color: "#c9d5e5", fontSize: 12 }}
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </aside>
      <main className="main">
        <DemoBanner />
        <Outlet />
      </main>
    </div>
  );
}
