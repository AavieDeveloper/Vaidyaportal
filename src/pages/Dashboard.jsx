import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard, getPendingReviews } from "../api/client";
import TopBar from "../components/TopBar";
import { PageContainer, Card, SectionLabel, MetricRow, MetricCard } from "../components/Primitives";
import PatientRow from "../components/PatientRow";
import Badge from "../components/Badge";
import { CalendarIcon } from "../components/Icons";
import { severityToTone } from "../utils/severity";
import { LoadingView, ErrorView } from "../components/StateViews";
import "./Dashboard.css";

export default function Dashboard({ practitioner }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | error | ready

const load = () => {
  setStatus("loading");
  Promise.all([
    getPendingReviews(),
    import("../api/client").then(m => m.request
      ? m.request("/api/vaidya/reviews/approved").catch(() => [])
      : []
    ),
  ])
    .then(([reviews, signed]) => {
      const pending = Array.isArray(reviews) ? reviews : [];
      const signedList = Array.isArray(signed) ? signed : [];

      const getTimeAgo = (dateStr) => {
        if (!dateStr) return "Recently";
        const diff = Date.now() - new Date(dateStr).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return "Today";
        if (days === 1) return "1 day ago";
        return `${days} days ago`;
      };

      setData({
        greetingName: "Doctor",
        callBanner: null,
        metrics: {
          totalPatients: pending.length + signedList.length,
          totalPatientsBadge: `+${pending.length}`,
          pendingReviews: pending.length,
          pendingReviewsBadge: pending.length > 0
            ? `${pending.length} new` : "0",
          monthEarnings: "—",
          signedProtocols: signedList.length,
        },
        pendingReviews: pending.map(p => ({
          id: p.planId,
          planId: p.planId,
          initials: (p.patientName ?? "P").charAt(0).toUpperCase(),
          name: p.patientName ?? "Patient",
          subtitle: `${p.ciType ?? ""} · ${p.severity ?? ""} PCOS · Cycle 1`,
          pillLabel: p.severity ?? "pending",
          pillTone: p.severity === "severe" ? "severe"
            : p.severity === "moderate" ? "mild" : "teal",
          escalation: p.severity === "severe",
        })),
        recentlySigned: signedList.map(p => ({
          id: String(p.planId),
          note: p.deliveryStatus === "blending"
            ? "Sent to Manufacturing"
            : "Pending Admin review",
          signedAgo: getTimeAgo(p.reviewedAt),
        })),
      });
      setStatus("ready");
    })
    .catch(() => setStatus("error"));
};

  useEffect(load, []);

  if (status === "loading") return <LoadingView label="Loading your dashboard…" />;
  if (status === "error") return <ErrorView onRetry={load} />;

  return (
    <>
      <TopBar
        title={`Good morning, ${data.greetingName}`}
        subtitle="Ayurvedic Practitioner · AAVIE Partner"
        avatarInitials={practitioner?.initials}
      />

      <PageContainer>
        {/* Call banner */}
      {/* Call banner — only show if exists */}
{data.callBanner && (
  <div className="callBanner">
    <div className="callBanner__icon">
      <CalendarIcon />
    </div>
    <div className="callBanner__txt">
      <strong>{data.callBanner.title}</strong> {data.callBanner.subtitle}
      <br />
      <span className="callBanner__meta">
        User #{data.callBanner.patientId} · {data.callBanner.meta}
      </span>
    </div>
    <button
      className="callBanner__btn"
      onClick={() =>
        navigate(`/patients/${data.callBanner.patientId}/schedule`)
      }
      type="button"
    >
      Schedule →
    </button>
  </div>
)}
        <MetricRow>
          <MetricCard
            value={data.metrics.totalPatients}
            label="Total Patients"
            badge={<Badge tone="teal">{data.metrics.totalPatientsBadge}</Badge>}
          />
          <MetricCard
            value={data.metrics.pendingReviews}
            label="Pending Reviews"
            badge={<Badge tone="severe">{data.metrics.pendingReviewsBadge}</Badge>}
          />
          <MetricCard
            value={data.metrics.monthEarnings}
            label="This Month"
            badge={<Badge tone="mild">Earnings</Badge>}
          />
          <MetricCard
            value={data.metrics.signedProtocols}
            label="Signed Protocols"
            badge={<Badge tone="pending">Sent to Admin</Badge>}
          />
        </MetricRow>

       <SectionLabel>Pending Protocol Reviews</SectionLabel>
<Card style={{ padding: "4px 16px" }} className="dash__cardNoPad">
  {data.pendingReviews.length === 0 ? (
    <div style={{
      padding: "24px 16px",
      textAlign: "center",
      color: "var(--text-muted, #888)",
      fontSize: 14
    }}>
      No pending reviews — all caught up ✓
    </div>
  ) : (
    data.pendingReviews.map((p) => (
      <PatientRow
        key={p.id}
        initials={p.initials}
        name={p.name}
        subtitle={p.subtitle}
        badge={p.pillLabel}
        badgeTone={p.pillTone}
        escalation={p.escalation}
        onClick={() => navigate(`/patients/${p.planId}`)}
      />
    ))
  )}
</Card>
        <SectionLabel>Recently Signed</SectionLabel>
<Card style={{ padding: "6px 16px" }}>
  {(!data.recentlySigned || data.recentlySigned.length === 0) ? (
    <div style={{
      padding: "20px 16px",
      textAlign: "center",
      color: "var(--text-muted, #888)",
      fontSize: 14
    }}>
      No signed protocols yet
    </div>
   ) : (
    data.recentlySigned.map((p) => (
  <div key={p.id} className="dash__signedRow">
    <span className="dash__dotGreen" />
    <div style={{ flex: 1 }}>
      <div className="patRow__name">#{p.id}</div>
      <div className="patRow__sub">{p.note}</div>
    </div>
    <div style={{ fontSize: 11, color: "var(--text-muted, #888)" }}>
      {p.signedAgo}
    </div>
  </div>
))
  )}
        </Card>
      </PageContainer>
    </>
  );
}
