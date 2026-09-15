import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/AppShell";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PendingApproval from "./pages/PendingApproval";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientDetail from "./pages/PatientDetail";
import ProtocolReview from "./pages/ProtocolReview";
import SignedSuccess from "./pages/SignedSuccess";
import ScheduleCall from "./pages/ScheduleCall";
import Earnings from "./pages/Earnings";
import Profile from "./pages/Profile";
import { getCurrentPractitioner } from "./api/client";
import { LoadingView } from "./components/StateViews";

export default function App() {
const [practitioner, setPractitioner] = useState(null);
const [authChecked, setAuthChecked] = useState(false);

useEffect(() => {
  const token = localStorage.getItem("aavie_practitioner_token");
  if (!token) {
    setAuthChecked(true);
    return;
  }
  getCurrentPractitioner()
    .then((p) => setPractitioner(p))
    .catch(() => {
      localStorage.removeItem("aavie_practitioner_token");
    })
    .finally(() => setAuthChecked(true));
}, []); // ← runs once on mount only, []);

  if (!authChecked) return <LoadingView label="Loading AAVIE Practitioner Portal…" />;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — reachable whether or not the practitioner
            is signed in. Registration and approval status must be
            reachable from a fresh, unauthenticated visit. */}
        <Route
          path="/login"
          element={
            practitioner ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLoggedIn={setPractitioner} />
            )
          }
        />
        <Route path="/register" element={<Register />} />
        <Route path="/pending-approval" element={<PendingApproval />} />

        {/* Authenticated app */}
        {practitioner ? (
          <Route element={<AppShell practitioner={practitioner} />}>
            <Route path="/" element={<Dashboard practitioner={practitioner} />} />
            <Route path="/patients" element={<Patients practitioner={practitioner} />} />
            <Route path="/patients/:patientId" element={<PatientDetail />} />
            <Route path="/patients/:patientId/protocol" element={<ProtocolReview />} />
            <Route path="/patients/:patientId/signed" element={<SignedSuccess />} />
            <Route path="/patients/:patientId/schedule" element={<ScheduleCall />} />
            <Route path="/earnings" element={<Earnings practitioner={practitioner} />} />
          <Route path="/profile" element={<Profile practitioner={practitioner} onLogout={() => setPractitioner(null)} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}
