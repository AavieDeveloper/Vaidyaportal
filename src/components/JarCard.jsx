import { SectionLabel, Card } from "./Primitives";
import "./JarCard.css";

/**
 * One jar (AM or PM) — herb rows with remove buttons, an "Add
 * herb" affordance, and a cap notice once the jar hits its
 * severity-based herb limit.
 */
export default function JarCard({ label, herbs, max, onRemove, onOpenAdd }) {
  const atCap = herbs.length >= max;

  return (
    <>
      <SectionLabel>{label}</SectionLabel>
      <Card style={{ padding: "4px 16px" }}>
        {herbs.map((h, idx) => (
          <div className="herbRow herbRow--static" key={`${h.name}-${idx}`}>
            <div style={{ flex: 1 }}>
              <div className="herbRow__name">{h.name}</div>
              <div className="herbRow__sub">{h.note}</div>
            </div>
            <div className="jarCard__dose">{h.dose}</div>
            <button
              className="jarCard__rmBtn"
              onClick={() => onRemove(h.name)}
              title="Remove"
              type="button"
              aria-label={`Remove ${h.name}`}
            >
              ×
            </button>
          </div>
        ))}
        {herbs.length === 0 && (
          <div className="jarCard__empty">No herbs in this jar yet.</div>
        )}
      </Card>
      <div className="jarCard__belowCard">
        {!atCap ? (
          <div className="jarCard__addBtn" onClick={onOpenAdd} role="button" tabIndex={0}>
            + Add herb to {label}
          </div>
        ) : (
          <div className="jarCard__capNotice">
            {label} is at its {max}-herb cap for this severity — remove one before
            adding another.
          </div>
        )}
      </div>
    </>
  );
}
