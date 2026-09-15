import { useNavigate } from "react-router-dom";
import "./TopBar.css";

/**
 * Shared header. `backTo` renders a "‹ Label" back control (used
 * on drill-in screens); omit it for top-level tab screens, which
 * show the avatar instead.
 */
export default function TopBar({
  title,
  subtitle,
  backTo,
  backLabel = "Back",
  avatarInitials,
  center = false,
}) {
  const navigate = useNavigate();

  return (
    <header className={`topbar ${backTo ? "topbar--withBack" : ""}`}>
      {/* Left section - always aligned left */}
      <div className="topbar__left">
        {backTo ? (
          <button
            className="topbar__back"
            onClick={() => navigate(backTo)}
            type="button"
          >
            ‹ {backLabel}
          </button>
        ) : null}
      </div>

      {/* Center section - title */}
      <div className="topbar__center">
        <div className="topbar__title">{title}</div>
        {subtitle && <div className="topbar__subtitle">{subtitle}</div>}
      </div>

      {/* Right section - avatar or spacer */}
      <div className="topbar__right">
        {avatarInitials && !backTo ? (
          <div
            className="topbar__avatar topbar__avatar--clickable"
            onClick={() => navigate("/profile")}
            role="button"
            tabIndex={0}
            title="My Profile"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/profile");
            }}
          >
            {avatarInitials}
          </div>
        ) : null}
      </div>
    </header>
  );
}