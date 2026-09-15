import { useEffect, useState } from "react";
import { getEarnings } from "../api/client";
import TopBar from "../components/TopBar";
import { PageContainer, Card, SectionLabel, MetricRow, MetricCard, HighlightCard } from "../components/Primitives";
import Badge from "../components/Badge";
import { InfoIcon } from "../components/Icons";
import { statusToTone } from "../utils/severity";
import { LoadingView, ErrorView } from "../components/StateViews";
import "./Earnings.css";

export default function Earnings({ practitioner }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

  const load = () => {
    setStatus("loading");
    getEarnings()
      .then((res) => {
        setData(res);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  };

  useEffect(load, []);

  if (status === "loading") return <LoadingView label="Loading earnings…" />;
  if (status === "error") return <ErrorView onRetry={load} />;

  return (
    <>
      <TopBar title="Earnings" subtitle={data.month} avatarInitials={practitioner?.initials} />

      <PageContainer>
   <div style={{ marginBottom: "10px" }}>
  <MetricCard
    dark
    value={data.totalThisMonth}
    label={
      <>
        <div style={{ marginBottom: 5 }}>Total This Month</div>
        <div style={{ fontSize: 11, opacity: 0.75 }}>{data.nextPayout}</div>
      </>
    }
  />
</div>

        <HighlightCard tone="teal" icon={<InfoIcon />}>
          <span dangerouslySetInnerHTML={{ __html: data.rateCardNote }} />
        </HighlightCard>

        <MetricRow>
          {data.breakdown.map((b) => (
            <MetricCard key={b.label} value={b.amount} label={b.label} />
          ))}
        </MetricRow>

        <SectionLabel>Per-Patient Ledger</SectionLabel>
        <Card style={{ padding: "4px 16px" }}>
          {data.ledger.map((row) => (
            <div className="earnRow" key={row.id}>
              <div>
                <div className="earnRow__id">#{row.id}</div>
                <div className="earnRow__note">{row.note}</div>
              </div>
              <div className="earnRow__amount">{row.amount}</div>
            </div>
          ))}
        </Card>

        <SectionLabel>Payout History</SectionLabel>
        <Card>
          {data.payoutHistory.map((p) => (
            <div className="payoutRow" key={p.period}>
              <div className="payoutRow__period">{p.period}</div>
              <Badge tone={statusToTone(p.tone)}>{p.status}</Badge>
            </div>
          ))}
          <div className="earnings__upi">
            <div className="earnings__upiLbl">UPI ID linked</div>
            <div className="earnings__upiVal">{data.upiId}</div>
          </div>
        </Card>
      </PageContainer>
    </>
  );
}
