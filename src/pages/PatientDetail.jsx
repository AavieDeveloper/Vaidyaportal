import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPatientDetail } from "../api/client";
import TopBar from "../components/TopBar";
import { PageContainer, Card, SectionLabel } from "../components/Primitives";
import Badge from "../components/Badge";
import { CheckCircleIcon } from "../components/Icons";
import { LoadingView, ErrorView } from "../components/StateViews";
import "./PatientDetail.css";

const DOSHA_TONE = {
  vata: { bg: "#EEF0FE", fg: "#4A4FB0" },
  pitta: { bg: "var(--red-light)", fg: "var(--red)" },
  kapha: { bg: "var(--green-light)", fg: "var(--green)" },
};

export default function PatientDetail() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

  const load = () => {
    setStatus("loading");
    getPatientDetail(patientId)
      .then((res) => {
        setData(res);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  };

  useEffect(load, [patientId]);

  if (status === "loading") return <LoadingView label="Loading patient…" />;
  if (status === "error") return <ErrorView onRetry={load} />;
  if (!data || !data.vitals) return <LoadingView label="Loading patient…" />;
  

  return (
    <>
      <TopBar title="Patient Detail" backTo="/patients" backLabel="Patients" center />

      <PageContainer>
        {/* Hero */}
        <div className="patDetail__hero">
          <div className="patDetail__heroTop">
            <div className="patDetail__heroAvatar">{data.initials}</div>
            <div>
              <div className="patDetail__heroName">#{data.id}</div>
              <div className="patDetail__heroSub">{data.subtitle}</div>
            </div>
          </div>
          <div className="patDetail__vitals">
            <VitalTile value={data.vitals.age} label="Age" />
            <VitalTile value={data.vitals.height} label="Height" />
            <VitalTile value={data.vitals.weight} label="Weight" />
            <VitalTile value={data.vitals.bmi} label="BMI" />
          </div>
        </div>
<div className="patDetail__grid">
  <div>
    <SectionLabel>Prakriti Constitution</SectionLabel>
    <Card>
      <div className="patDetail__muted">Primary · Secondary · Tertiary</div>
      <div className="patDetail__pillRow">
        {data.prakriti.map((d) => (
          <span
            key={d.dosha}
            className="pkPill"
            style={{
              background: DOSHA_TONE[d.tone]?.bg,
              color: DOSHA_TONE[d.tone]?.fg,
            }}
          >
            {d.dosha} {d.pct}%
          </span>
        ))}
      </div>
    </Card>

    <SectionLabel>Vikriti (Agni + Ama)</SectionLabel>
    <Card>
      <div className="patDetail__muted" style={{ marginBottom: 10 }}>
        Current state vs Prakriti baseline
      </div>
      <div className="infoGrid">
        <div className="infoCell">
          <div className="infoCell__val">{data.vikriti.agniState}</div>
          <div className="infoCell__key">Agni state</div>
        </div>
        <div className="infoCell">
          <div className="infoCell__val">{data.vikriti.ama}</div>
          <div className="infoCell__key">Ama</div>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <div className="patDetail__barRow">
          <span style={{ color: "var(--green)", fontWeight: 500, fontSize: 12 }}>
            {data.vikriti.aggravation.dosha}
          </span>
          <span style={{ fontSize: 11, color: "var(--t2)" }}>
            {data.vikriti.aggravation.label}
          </span>
        </div>
        <div className="pkBarBg" style={{ background: "var(--green-light)" }}>
          <div
            className="pkBar"
            style={{ width: `${data.vikriti.aggravation.pct}%`, background: "var(--green)" }}
          />
        </div>
      </div>
    </Card>
  </div>

  <div>
    <SectionLabel>All Flags</SectionLabel>
    <Card>
      <div className="patDetail__severityRow">
        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--t1)" }}>
          Severity
        </span>
        <Badge tone="severe">{data.severity}</Badge>
      </div>
      <div style={{ marginBottom: 10 }}>
        <Badge tone="teal" style={{ fontSize: 11 }}>
          Primary driver this cycle: {data.primaryDriver}
        </Badge>
      </div>
      <div className="patDetail__muted" style={{ marginBottom: 6 }}>
        Active flags
      </div>
      <div>
        {data.activeFlags.map((f) => (
          <span key={f} className="symptomTag">
            {f}
          </span>
        ))}
      </div>
      <div className="patDetail__cycleData">
        <div className="patDetail__muted" style={{ marginBottom: 8 }}>
          Cycle Data
        </div>
        <div className="infoGrid">
          <div className="infoCell">
            <div className="infoCell__val">{data.cycleData.cycleLength}</div>
            <div className="infoCell__key">Cycle Length</div>
          </div>
          <div className="infoCell">
            <div className="infoCell__val">{data.cycleData.periodDuration}</div>
            <div className="infoCell__key">Period Duration</div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</div>

{/* Button - Full width at bottom */}
<div className="patDetail__buttonWrapper">
  <button
    className="primaryBtn patDetail__protocolBtn"
    onClick={() => navigate(`/patients/${patientId}/protocol`)}
    type="button"
  >
    <CheckCircleIcon size={16} />
    Review AAVIE Protocol
  </button>
</div>
      </PageContainer>
    </>
  );
}

function VitalTile({ value, label }) {
  return (
    <div className="vitalTile">
      <div className="vitalTile__val">{value}</div>
      <div className="vitalTile__lbl">{label}</div>
    </div>
  );
}
