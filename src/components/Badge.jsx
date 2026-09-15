import "./Badge.css";

const TONE_CLASS = {
  mild: "badge--mild",
  moderate: "badge--mod",
  severe: "badge--sev",
  teal: "badge--teal",
  signed: "badge--signed",
  pending: "badge--pending",
};

/**
 * Small pill label used throughout the portal for severity,
 * status, and driver tags.
 */
export default function Badge({ tone = "pending", children, style }) {
  return (
    <span className={`badge ${TONE_CLASS[tone] || "badge--pending"}`} style={style}>
      {children}
    </span>
  );
}
