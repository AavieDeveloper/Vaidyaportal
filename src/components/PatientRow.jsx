import Badge from "./Badge";
import "./PatientRow.css";

/**
 * One row representing a patient — used in the Dashboard's
 * "Pending Reviews" list and the full Patients list.
 */
export default function PatientRow({
  initials,
  avatarTone,
  name,
  subtitle,
  badge,
  badgeTone,
  escalation,
  onClick,
  interactive = true,
}) {
  return (
    <div
      className={`patRow ${interactive ? "patRow--interactive" : ""}`}
      onClick={interactive ? onClick : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick?.();
            }
          : undefined
      }
    >
      <div className="patRow__avatar" style={avatarTone ? { background: avatarTone.bg, color: avatarTone.fg } : undefined}>
        {initials}
      </div>
      <div className="patRow__body">
        <div className="patRow__name">{name}</div>
        {subtitle && <div className="patRow__sub">{subtitle}</div>}
        {badge && (
          <div style={{ marginTop: 4 }}>
            <Badge tone={badgeTone}>{badge}</Badge>
          </div>
        )}
      </div>
      {escalation && (
        <span
          className="patRow__escalationDot"
          title="Clinical escalation — needs acknowledgment"
        />
      )}
      {interactive && <div className="patRow__chev">›</div>}
    </div>
  );
}
