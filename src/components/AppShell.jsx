import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { DashboardIcon, PatientsIcon, EarningsIcon, CalendarIcon } from "./Icons";
import "./AppShell.css";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: DashboardIcon, match: ["/"] },
  {
    to: "/patients",
    label: "Patients",
    icon: PatientsIcon,
    match: ["/patients", "/patients/"],
  },
  { to: "/earnings", label: "Earnings", icon: EarningsIcon, match: ["/earnings"] },
];

/**
 * Full-page shell: a persistent left sidebar on desktop (>=960px),
 * and a bottom tab bar on mobile — the whole app renders inside
 * <Outlet /> so every screen automatically gets the same chrome.
 */
export default function AppShell({ practitioner }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);

  useEffect(() => {
    setSidebarOpenMobile(false);
  }, [location.pathname]);

  const isActive = (item) =>
    item.match.includes(location.pathname) ||
    (item.to !== "/" && location.pathname.startsWith(item.to));

  return (
    <div className="shell">
      {/* Desktop sidebar */}
      <aside className="shell__sidebar" aria-label="Primary">
  <div className="shell__brand">
  <img 
    src="/src/assets/Aavie-wordmark-White.png" 
    alt="AAVIE" 
    className="shell__brandLogo"
  />
  <span className="shell__brandSub">PRACTITIONER PORTAL</span>
</div>

        <nav className="shell__nav">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={`shell__navItem ${active ? "shell__navItem--active" : ""}`}
              >
                <Icon color={active ? "var(--teal)" : "var(--t3)"} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
                 {/* Schedule Call — shown only when viewing a patient */}
          {location.pathname.includes("/patients/") && (
            <button
              className={`shell__navItem ${
                location.pathname.includes("/schedule")
                  ? "shell__navItem--active" : ""
              }`}
              onClick={() => {
                const parts = location.pathname.split("/");
                const patientId = parts[2];
                if (patientId) navigate(`/patients/${patientId}/schedule`);
              }}
              style={{
                background: "none", border: "none",
                cursor: "pointer", width: "100%", textAlign: "left"
              }}
            >
              <CalendarIcon color={
                location.pathname.includes("/schedule")
                  ? "var(--teal)" : "var(--t3)"
              } />
              <span>Schedule Call</span>
            </button>
          )}
        </nav>

       <div
          className="shell__sidebarFooter shell__sidebarFooter--clickable"
          onClick={() => navigate("/profile")}
          role="button"
          tabIndex={0}
          title="My Profile"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/profile");
          }}
        >
          <div className="shell__avatar">{practitioner?.initials || "—"}</div>
          <div>
            <div className="shell__practitionerName">{practitioner?.name}</div>
            <div className="shell__practitionerRole">
              {practitioner?.qualification}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="shell__main">
        <Outlet />
      </div>

      {/* Mobile bottom nav */}
      <nav className="shell__bottomNav" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={`shell__bottomNavItem ${active ? "shell__bottomNavItem--active" : ""}`}
            >
              <Icon size={20} color={active ? "var(--teal)" : "var(--t3)"} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
