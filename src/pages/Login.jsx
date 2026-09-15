import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, ApprovalStatusError } from "../api/client";
import "./Login.css";

export default function Login({ onLoggedIn }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const data = await login({ email, password });
onLoggedIn(data.practitioner ?? data);
navigate("/");
    } catch (err) {
      if (err instanceof ApprovalStatusError) {
        // Account exists but isn't approved (or was denied) — send
        // them to the status screen instead of a generic error.
        navigate("/pending-approval", {
          state: { email: err.email, status: err.status },
        });
        return;
      }
      setError(
        err?.message ||
          "Couldn't sign in. Check your email and password and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="loginPage">
      <div className="loginPage__card">
        <div className="loginPage__brand">AAVIE</div>
        <div className="loginPage__sub">Practitioner Portal</div>

        <form onSubmit={handleSubmit} className="loginPage__form">
          <label className="loginPage__label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="loginPage__input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />

          <label className="loginPage__label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="loginPage__input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && <div className="loginPage__error">{error}</div>}

          <button className="loginPage__submit" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="loginPage__footerLink">
          New practitioner? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
}
