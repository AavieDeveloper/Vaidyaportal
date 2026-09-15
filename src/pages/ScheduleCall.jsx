import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPatientDetail, getAvailableSlots, confirmSlot } from "../api/client";
import TopBar from "../components/TopBar";
import { PageContainer, SectionLabel, Card } from "../components/Primitives";
import { CalendarIcon } from "../components/Icons";
import { LoadingView, ErrorView } from "../components/StateViews";
import "./ScheduleCall.css";

export default function ScheduleCall() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [status, setStatus] = useState("loading");
  const [confirming, setConfirming] = useState(false);

  const load = () => {
    setStatus("loading");
    Promise.all([getPatientDetail(patientId), getAvailableSlots(patientId)])
      .then(([p, s]) => {
        setPatient(p);
        setSlots(s);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  };

  useEffect(load, [patientId]);

  if (status === "loading") return <LoadingView label="Loading available slots…" />;
  if (status === "error") return <ErrorView onRetry={load} />;

  const handleConfirm = async () => {
    if (!selectedSlot || confirming) return;
    setConfirming(true);
    try {
      await confirmSlot(patientId, selectedSlot);
      navigate("/");
    } catch {
      setConfirming(false);
      alert("Couldn't confirm the slot. Please try again.");
    }
  };

  return (
    <>
      <TopBar title="Schedule Call" backTo="/" backLabel="Dashboard" center />

      <PageContainer>
        <div className="scheduleCall__hero">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="scheduleCall__avatar">{patient.initials}</div>
            <div>
              <div className="scheduleCall__name">#{patient.id}</div>
              <div className="scheduleCall__sub">
                {patient.prakriti[0]?.dosha[0]} · Tikshna Agni ·{" "}
                <span style={{ color: "#FF9985" }}>{patient.severity}</span>
              </div>
            </div>
          </div>
          <div className="scheduleCall__vitals">
            <div className="scheduleCall__vitalTile">
              <div className="scheduleCall__vitalVal">{patient.vitals.age}</div>
              <div className="scheduleCall__vitalLbl">Age</div>
            </div>
            <div className="scheduleCall__vitalTile">
              <div className="scheduleCall__vitalVal">{patient.vitals.weight}</div>
              <div className="scheduleCall__vitalLbl">Weight</div>
            </div>
            <div className="scheduleCall__vitalTile">
              <div className="scheduleCall__vitalVal">{patient.vitals.bmi}</div>
              <div className="scheduleCall__vitalLbl">BMI</div>
            </div>
          </div>
        </div>

        <SectionLabel>Clinical Flags (Severe)</SectionLabel>
        <Card>
          {patient.activeFlags.map((f) => (
            <span key={f} className="scheduleCall__flag">
              {f}
            </span>
          ))}
        </Card>
        <div className="scheduleCall__privacyNote">
          No contact details are shown here — confirming a slot notifies the
          patient in-app; the call connects through the platform, not a shared
          number.
        </div>

        <SectionLabel>Choose Time Slot</SectionLabel>
        <div className="scheduleCall__slots">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className={`slotRow ${selectedSlot === slot.id ? "slotRow--sel" : ""}`}
              onClick={() => setSelectedSlot(slot.id)}
              role="radio"
              aria-checked={selectedSlot === slot.id}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setSelectedSlot(slot.id);
              }}
            >
              <div className="slotRow__iconWrap">
                <CalendarIcon size={16} color="var(--teal)" />
              </div>
              <div style={{ flex: 1 }}>
                <div className="slotRow__time">{slot.time}</div>
                <div className="slotRow__date">{slot.date}</div>
              </div>
              <div className={`slotRadio ${selectedSlot === slot.id ? "slotRadio--sel" : ""}`}>
                {selectedSlot === slot.id && (
                  <svg width="10" height="10" viewBox="0 0 10 10">
                    <circle cx="5" cy="5" r="4" fill="#fff" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          className="primaryBtn"
          style={{ marginTop: 16 }}
          onClick={handleConfirm}
          disabled={!selectedSlot || confirming}
          type="button"
        >
          {confirming ? "Confirming…" : "Confirm Slot & Notify Patient"}
        </button>
      </PageContainer>
    </>
  );
}
