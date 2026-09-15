import { useNavigate, useParams, useLocation } from "react-router-dom";
import TopBar from "../components/TopBar";
import { PageContainer } from "../components/Primitives";
import Badge from "../components/Badge";
import { BigCheckIcon } from "../components/Icons";
import "./SignedSuccess.css";

export default function SignedSuccess() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Passed via navigate(..., { state }) from ProtocolReview's sign-off
  // call. Falls back to reasonable placeholders if the user lands here
  // directly (e.g. a refresh), so the screen never looks broken.
  const result = location.state || {
    protocolId: "—",
    signedBy: "—",
    status: "PENDING_ADMIN_REVIEW",
  };

  return (
    <>
      <TopBar title="Protocol Signed" backTo="/" backLabel="Dashboard" />
      <PageContainer>
        <div className="signedSuccess">
          <div className="signedSuccess__icon">
            <BigCheckIcon />
          </div>
          <div className="signedSuccess__title">Protocol Submitted</div>
          <div className="signedSuccess__desc">
            #{patientId}'s protocol has been signed off and routed to the AAVIE
            internal team for review.
          </div>

          <div className="signedSuccess__summary">
            <SummaryRow label="Protocol ID" value={result.protocolId} strong />
            <SummaryRow label="Signed by" value={result.signedBy} />
            <div className="signedSuccess__summaryRow signedSuccess__summaryRow--last">
              <span className="signedSuccess__summaryLbl">Status</span>
              <Badge tone="moderate">Pending Admin Review</Badge>
            </div>
          </div>

          <button
            className="primaryBtn"
            style={{ width: "100%", margin: 0 }}
            onClick={() => navigate("/")}
            type="button"
          >
            Back to Dashboard
          </button>
        </div>
      </PageContainer>
    </>
  );
}

function SummaryRow({ label, value, strong }) {
  return (
    <div className="signedSuccess__summaryRow">
      <span className="signedSuccess__summaryLbl">{label}</span>
      <span
        className="signedSuccess__summaryVal"
        style={{ color: strong ? "var(--teal-dark)" : "var(--t1)" }}
      >
        {value}
      </span>
    </div>
  );
}