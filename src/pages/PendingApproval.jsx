import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { checkApprovalStatus, _mockApprove } from "../api/client";
import "./Login.css";

/**
 * Shown right after registration, and whenever a login attempt
 * hits an account that isn't approved yet. Lets the practitioner
 * re-check their status without re-entering credentials.
 */
export default function PendingApproval() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";
  const initialStatus = location.state?.status || "PENDING";

  const [status, setStatus] = useState(initialStatus);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");

  const refreshStatus = async () => {
    if (!email || checking) return;
    setChecking(true);
    setMessage("");
    try {
      const res = await checkApprovalStatus(email);
      setStatus(res.status);
      if (res.status === "APPROVED") {
        setMessage("You're approved! You can sign in now.");
      } else if (res.status === "DENIED") {
        setMessage("Your application was not approved. Contact AAVIE support for details.");
      } else {
        setMessage("Still under review — check back soon.");
      }
    } catch {
      setMessage("Couldn't check your status right now. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (email) refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  return (
    <div className="loginPage">
      <div className="loginPage__card">
        <div className="loginPage__brand">AAVIE</div>
        <div className="loginPage__sub">Practitioner Portal</div>

        <div className={`pendingStatus pendingStatus--${status.toLowerCase()}`}>
          <div className="pendingStatus__icon">
            {status === "APPROVED" ? "✓" : status === "DENIED" ? "!" : "⏳"}
          </div>
          <div className="pendingStatus__title">
            {status === "APPROVED"
              ? "Application Approved"
              : status === "DENIED"
                ? "Application Not Approved"
                : "Application Under Review"}
          </div>
          <div className="pendingStatus__body">
            {status === "APPROVED" && (
              <>Your registration has been approved by the AAVIE team. You can now sign in.</>
            )}
            {status === "DENIED" && (
              <>
                Your application couldn't be approved at this time. Please reach
                out to AAVIE support for more information.
              </>
            )}
            {status === "PENDING" && (
              <>
                Thanks for registering{email ? `, ${email}` : ""}. The AAVIE team
                is reviewing your details — this usually takes 1–2 business
                days. You'll be able to sign in as soon as you're approved.
              </>
            )}
          </div>
        </div>

        {message && <div className="pendingStatus__message">{message}</div>}

        <div className="loginPage__form" style={{ marginTop: 20 }}>
          {status === "APPROVED" ? (
            <button
              className="loginPage__submit"
              type="button"
              onClick={() => navigate("/login")}
            >
              Go to sign in
            </button>
          ) : (
            <button
              className="loginPage__submit"
              type="button"
              onClick={refreshStatus}
              disabled={checking || !email}
            >
              {checking ? "Checking…" : "Check status again"}
            </button>
          )}

          
        
        </div>

        <div className="loginPage__footerLink">
          <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
