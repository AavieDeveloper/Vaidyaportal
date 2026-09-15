import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getProtocol,
  getHerbPool,
  updateProtocolHerb,
  updateProtocolNotes,
  signOffProtocol,
} from "../api/client";
import TopBar from "../components/TopBar";
import { PageContainer, SectionLabel, HighlightCard, Card } from "../components/Primitives";
import { AlertIcon } from "../components/Icons";
import JarCard from "../components/JarCard";
import HerbModal from "../components/HerbModal";
import { LoadingView, ErrorView } from "../components/StateViews";
import "./ProtocolReview.css";

export default function ProtocolReview() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [protocol, setProtocol] = useState(null);
  const [herbPool, setHerbPool] = useState({});
  const [status, setStatus] = useState("loading");
  const [ack, setAck] = useState(false);
  const [notes, setNotes] = useState("");
  const [modalJar, setModalJar] = useState(null); // 'am' | 'pm' | null
  const [signing, setSigning] = useState(false);

const load = () => {
  setStatus("loading");
  Promise.all([getProtocol(patientId), getHerbPool()])
    .then(([proto, pool]) => {
      setProtocol(proto);
      setHerbPool(pool);
      setNotes(proto.notes || "");
      setStatus("ready");
      // Debug: check what herbPool looks like
      console.log("HerbPool loaded:", pool);
      console.log("HerbPool keys:", Object.keys(pool || {}));
    })
    .catch((err) => {
      console.error("Error loading:", err);
      setStatus("error");
    });
};

  useEffect(load, [patientId]);

  if (status === "loading") return <LoadingView label="Loading protocol…" />;
  if (status === "error") return <ErrorView onRetry={load} />;

  const hasEscalation = !!protocol.escalation;
  const canSignOff = !hasEscalation || ack;

  const handleRemoveHerb = async (jar, herbName) => {
    setProtocol((prev) => ({
      ...prev,
      jars: {
        ...prev.jars,
        [jar]: {
          ...prev.jars[jar],
          herbs: prev.jars[jar].herbs.filter((h) => h.name !== herbName),
        },
      },
    }));
    try {
      await updateProtocolHerb(patientId, { jar, action: "remove", herbName });
    } catch {
      // Non-fatal for the demo — real integration should reconcile/retry
    }
  };

const handleAddHerb = async (herbName) => {
  const jar = modalJar; // capture before setModalJar(null) clears it
  if (!jar) return;
  setProtocol((prev) => {
    // Check if herb already exists in the jar
    const existingHerbs = prev.jars[jar].herbs || [];
    if (existingHerbs.some(h => h.name === herbName)) {
      return prev; // Herb already exists, don't add duplicate
    }
    return {
      ...prev,
      jars: {
        ...prev.jars,
        [jar]: {
          ...prev.jars[jar],
          herbs: [
            ...existingHerbs,
            { name: herbName, note: "Added by Vaidya", dose: "25g" },
          ],
        },
      },
    };
  });
  setModalJar(null);
  try {
    await updateProtocolHerb(patientId, { jar, action: "add", herbName });
  } catch {
    // Non-fatal for the demo
  }
};

  const handleSignOff = async () => {
    if (!canSignOff || signing) return;
    setSigning(true);
    try {
      await updateProtocolNotes(patientId, notes);
      const result = await signOffProtocol(patientId, {
        escalationAcknowledged: ack,
        notes,
      });
      navigate(`/patients/${patientId}/signed`, { state: result });
    } catch (e) {
      setSigning(false);
      alert("Couldn't submit the sign-off. Please try again.");
    }
  };

  return (
    <>
      <TopBar title="Protocol Review" backTo={`/patients/${patientId}`} backLabel="Patient" center />

      <PageContainer>
        <div className="protocol__pageWrap">
        <HighlightCard tone="gold" icon={<AlertIcon />}>
          <span dangerouslySetInnerHTML={{ __html: protocol.engineNote }} />
        </HighlightCard>

        {hasEscalation && (
          <>
            <SectionLabel tone="red">Clinical Escalation</SectionLabel>
            <div className="escalationCard">
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <AlertIcon color="var(--red)" />
                <div style={{ flex: 1 }}>
                  <div className="escalationCard__title">{protocol.escalation.title}</div>
                  <div className="escalationCard__body">{protocol.escalation.body}</div>
                </div>
              </div>
              <label className="escalationCard__ack">
                <input
                  type="checkbox"
                  checked={ack}
                  onChange={(e) => setAck(e.target.checked)}
                />
                {protocol.escalation.acknowledgeLabel}
              </label>
            </div>
          </>
        )}

        <div className="protocol__jarGrid">
          <JarCard
            label="AM Jar"
            herbs={protocol.jars.am.herbs}
            max={protocol.jars.am.max}
            onRemove={(name) => handleRemoveHerb("am", name)}
            onOpenAdd={() => {
              console.log("herbPool at open time:", herbPool, "keys:", Object.keys(herbPool).length);
              setModalJar("am");
            }}
          />
          <JarCard
            label="PM Jar"
            herbs={protocol.jars.pm.herbs}
            max={protocol.jars.pm.max}
            onRemove={(name) => handleRemoveHerb("pm", name)}
            onOpenAdd={() => setModalJar("pm")}
          />
        </div>

        <SectionLabel>Warnings Log</SectionLabel>
        <Card style={{ fontSize: 11, color: "var(--t2)", lineHeight: 1.7 }}>
          {protocol.warningsLog.map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </Card>

        <SectionLabel>Practitioner Notes</SectionLabel>
        <Card>
          <textarea
            className="protocol__notes"
            rows={3}
            placeholder="Dosage timing, dietary advice, manufacturing notes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Card>

        <SectionLabel tone="teal">Sign Off</SectionLabel>
        <div
          className={`signPad ${!canSignOff ? "signPad--disabled" : ""}`}
          onClick={handleSignOff}
          role="button"
          tabIndex={canSignOff ? 0 : -1}
        >
          {signing ? "Submitting…" : "Sign Off ›"}
        </div>
        {!canSignOff && (
          <div className="protocol__blockedNote">
            Acknowledge the clinical escalation above before signing off.
          </div>
        )}
        <div className="protocol__footerNote">
          Once signed this protocol is locked and routed to the AAVIE internal
          team before manufacturing.
        </div>
      </div>
      </PageContainer>

      {/* Add Herb Modal */}
      <HerbModal
        open={modalJar !== null}
        herbPool={herbPool}
        alreadyInJar={modalJar ? (protocol?.jars?.[modalJar]?.herbs?.map(h => h.name) || []) : []}
        onAdd={handleAddHerb}
        onClose={() => setModalJar(null)}
      />
    </>
  );
}
