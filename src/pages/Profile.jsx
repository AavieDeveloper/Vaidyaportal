import { useNavigate } from "react-router-dom";
import { logout } from "../api/client";
import TopBar from "../components/TopBar";
import { PageContainer, Card, SectionLabel } from "../components/Primitives";
import "./Profile.css";

export default function Profile({ practitioner, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const fields = [
    { label: "Full name", value: practitioner?.name || "—" },
    { label: "Qualification", value: practitioner?.qualification || "—" },
    { label: "Role", value: practitioner?.role || "Ayurvedic Practitioner · AAVIE Partner" },
    { label: "Practitioner ID", value: practitioner?.id || "—" },
  ];

  return (
    <>
      <TopBar title="My Profile" backTo="/" backLabel="Dashboard" center />

      <PageContainer>
        <div className="profile__hero">
          <div className="profile__avatar">
            {practitioner?.initials || "—"}
          </div>
          <div className="profile__heroName">{practitioner?.name}</div>
          <div className="profile__heroSub">{practitioner?.qualification}</div>
        </div>

        <SectionLabel>Account Details</SectionLabel>
        <Card>
          {fields.map((f, i) => (
            <div
              key={f.label}
              className={`profile__row ${i < fields.length - 1 ? "profile__row--border" : ""}`}
            >
              <div className="profile__rowLabel">{f.label}</div>
              <div className="profile__rowValue">{f.value}</div>
            </div>
          ))}
        </Card>

        <SectionLabel>Account</SectionLabel>
        <Card>
          <div className="profile__row">
            <div className="profile__rowLabel">Status</div>
            <div className="profile__rowValue profile__rowValue--green">
              Active · Approved
            </div>
          </div>
        </Card>

        <button
          className="profile__logoutBtn"
          type="button"
          onClick={handleLogout}
        >
          Sign out
        </button>
      </PageContainer>
    </>
  );
}