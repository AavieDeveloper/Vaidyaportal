import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPatients } from "../api/client";
import TopBar from "../components/TopBar";
import { PageContainer, Card } from "../components/Primitives";
import PatientRow from "../components/PatientRow";
import { statusToTone } from "../utils/severity";
import { LoadingView, ErrorView } from "../components/StateViews";
import "./Patients.css";

const TABS = [
  { key: "subclinical", label: "Subclinical" },
  { key: "mild", label: "Mild" },
  { key: "moderate", label: "Moderate" },
  { key: "severe", label: "Severe" },
];

export default function Patients({ practitioner }) {
  const navigate = useNavigate();
  const [all, setAll] = useState([]);
  const [status, setStatus] = useState("loading");
  const [activeTab, setActiveTab] = useState("moderate");
  const [query, setQuery] = useState("");

  const load = () => {
    setStatus("loading");
    getPatients()
      .then((res) => {
        setAll(res);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  };

  useEffect(load, []);

  const counts = useMemo(() => {
    const c = { subclinical: 0, mild: 0, moderate: 0, severe: 0 };
    all.forEach((p) => {
      if (c[p.severity] !== undefined) c[p.severity] += 1;
    });
    return c;
  }, [all]);

  const filtered = useMemo(() => {
    let list = all.filter((p) => p.severity === activeTab);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) => p.id.toLowerCase().includes(q) || p.constitutionType.toLowerCase().includes(q),
      );
    }
    return list;
  }, [all, activeTab, query]);

  if (status === "loading") return <LoadingView label="Loading patients…" />;
  if (status === "error") return <ErrorView onRetry={load} />;

  return (
    <>
      <TopBar
        title="My Patients"
        subtitle={`${all.length} assigned by AAVIE`}
        avatarInitials={practitioner?.initials}
      />

      <PageContainer>
        <div className="patients__searchWrap">
          <input
            className="searchBar"
            placeholder="Search by User ID or CI type…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search patients"
          />
        </div>

        <div className="tabRow" role="tablist" aria-label="Filter by severity">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              type="button"
              className={`tab ${activeTab === tab.key ? "tab--active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label} ({counts[tab.key]})
            </button>
          ))}
        </div>

        <div className="patients__list">
          {filtered.length === 0 ? (
            <div className="patients__empty">
              No {activeTab} patients match{query ? " your search" : ""}.
            </div>
          ) : (
            filtered.map((p) => (
              <Card key={p.id} style={{ padding: "4px 16px", margin: "0 0 10px" }}>
                <PatientRow
                  initials={p.initials}
                  name={`#${p.id}`}
                  subtitle={p.subtitle}
                  badge={p.statusLabel}
                  badgeTone={statusToTone(p.statusTone)}
                  onClick={() =>
                    navigate(
                      p.needsScheduling
                        ? `/patients/${p.id}/schedule`
                        : `/patients/${p.id}`,
                    )
                  }
                />
              </Card>
            ))
          )}
        </div>
      </PageContainer>
    </>
  );
}
