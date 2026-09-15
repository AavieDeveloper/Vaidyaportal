import "./Primitives.css";

/** Constrains + centers content on wide desktop viewports. */
export function PageContainer({ children, className = "" }) {
  return <div className={`pageContainer ${className}`}>{children}</div>;
}

/** Generic bordered white card, matches `.card` in the source mock. */
export function Card({ children, className = "", style, ...rest }) {
  return (
    <div className={`card ${className}`} style={style} {...rest}>
      {children}
    </div>
  );
}

/** Uppercase small-caps section heading used above every card group. */
export function SectionLabel({ children, tone }) {
  return (
    <div
      className="sectionLabel"
      style={tone ? { color: `var(--${tone})` } : undefined}
    >
      {children}
    </div>
  );
}

/** The 2x2 (mobile) / row (desktop) metric tile grid on Dashboard/Earnings. */
export function MetricRow({ children }) {
  return <div className="metricRow">{children}</div>;
}

export function MetricCard({ value, label, badge, tone, dark = false, wide = false }) {
  return (
    <div
      className={`metricCard ${dark ? "metricCard--dark" : ""} ${wide ? "metricCard--wide" : ""}`}
    >
      <div className="metricCard__val">{value}</div>
      <div className="metricCard__lbl">{label}</div>
      {badge}
    </div>
  );
}

/** Highlighted callout card (gold or teal), used for engine notes / info. */
export function HighlightCard({ icon, children, tone = "gold" }) {
  return (
    <div className={`hlCard hlCard--${tone}`}>
      {icon}
      <div className="hlCard__txt">{children}</div>
    </div>
  );
}
