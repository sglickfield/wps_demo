import { Navigate, Route, Routes } from "react-router-dom";
import { ClinicianLayout } from "./components/Layout";
import { useStore } from "./mock/store";
import { CaseWorkspacePage } from "./pages/CaseWorkspacePage";
import { ClientHomePage } from "./pages/ClientHomePage";
import { ClientsPage } from "./pages/ClientsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { FormTakePage } from "./pages/FormTakePage";
import { HistoryPage } from "./pages/HistoryPage";
import { LibraryPage } from "./pages/LibraryPage";
import { LoginPage } from "./pages/LoginPage";
import { NewCasePage } from "./pages/NewCasePage";
import { NewClientPage } from "./pages/NewClientPage";
import {
  RaterDonePage,
  RaterFormPage,
  RaterLandingPage,
} from "./pages/RaterPages";
import { ReportPage } from "./pages/ReportPage";
import { RecordingAnalyticsPage } from "./pages/RecordingAnalyticsPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session } = useStore();
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/r/:token" element={<RaterLandingPage />} />
      <Route path="/r/:token/form" element={<RaterFormPage />} />
      <Route path="/r/:token/done" element={<RaterDonePage />} />

      <Route
        element={
          <RequireAuth>
            <ClinicianLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/new" element={<NewClientPage />} />
        <Route path="clients/:id" element={<ClientHomePage />} />
        <Route path="cases/new" element={<NewCasePage />} />
        <Route path="cases/:id" element={<CaseWorkspacePage />} />
        <Route path="cases/:id/forms/:formId" element={<FormTakePage />} />
        <Route path="reports/:id" element={<ReportPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="assessments" element={<LibraryPage />} />
        <Route path="session-analytics" element={<RecordingAnalyticsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
