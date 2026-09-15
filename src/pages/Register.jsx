import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/client";
import "./Login.css";

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  qualification: "",
  licenseNumber: "",
  yearsOfExperience: "",
  clinicCity: "",
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const setField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    if (form.password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (form.password !== form.confirmPassword) {
      return "Passwords don't match.";
    }
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, "").slice(-10))) {
      return "Enter a valid 10-digit phone number.";
    }
    if (!form.yearsOfExperience || Number(form.yearsOfExperience) < 0) {
      return "Enter your years of experience.";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const { email } = await register({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        qualification: form.qualification.trim(),
        licenseNumber: form.licenseNumber.trim(),
        yearsOfExperience: Number(form.yearsOfExperience),
        clinicCity: form.clinicCity.trim(),
      });
      navigate("/pending-approval", { state: { email } });
    } catch (err) {
      setError(
        err?.message ||
          "Couldn't submit your registration. Please check your details and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="loginPage">
      <div className="loginPage__card loginPage__card--wide">
        <div className="loginPage__brand">AAVIE</div>
        <div className="loginPage__sub">Practitioner Registration</div>
        <div className="loginPage__intro">
          Tell us about your practice. Once submitted, the AAVIE team reviews
          your details and approves your account before you can sign in.
        </div>

        <form onSubmit={handleSubmit} className="loginPage__form">
          <div className="loginPage__grid">
            <Field
              label="Full name"
              value={form.fullName}
              onChange={setField("fullName")}
              required
              autoComplete="name"
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={setField("email")}
              required
              autoComplete="email"
            />
            <Field
              label="Phone number"
              type="tel"
              value={form.phone}
              onChange={setField("phone")}
              required
              autoComplete="tel"
              placeholder="10-digit mobile number"
            />
            <Field
              label="Password"
              type="password"
              value={form.password}
              onChange={setField("password")}
              required
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
            <Field
              label="Confirm password"
              type="password"
              value={form.confirmPassword}
              onChange={setField("confirmPassword")}
              required
              autoComplete="new-password"
            />
            <Field
              label="Qualification"
              value={form.qualification}
              onChange={setField("qualification")}
              required
              placeholder="e.g. BAMS, MD (Ayurveda)"
            />
            <Field
              label="Registration / License number"
              value={form.licenseNumber}
              onChange={setField("licenseNumber")}
              required
              placeholder="State medical council reg. no."
            />
            <Field
              label="Years of experience"
              type="number"
              min="0"
              value={form.yearsOfExperience}
              onChange={setField("yearsOfExperience")}
              required
            />
            <Field
              label="Clinic / City"
              value={form.clinicCity}
              onChange={setField("clinicCity")}
              required
              className="loginPage__gridSpan2"
              placeholder="e.g. Ayur Wellness Clinic, Pune"
            />
          </div>

          {error && <div className="loginPage__error">{error}</div>}

          <button className="loginPage__submit" type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit for approval"}
          </button>
        </form>

        <div className="loginPage__footerLink">
          Already registered? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, className = "", ...inputProps }) {
  return (
    <div className={`loginPage__field ${className}`}>
      <label className="loginPage__label">{label}</label>
      <input className="loginPage__input" {...inputProps} />
    </div>
  );
}
