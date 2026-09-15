/**
 * ============================================================
 * AAVIE Practitioner Portal — API Client
 * ============================================================
 * This is the ONLY file that should ever call `fetch`. Every
 * screen imports from here instead of hitting endpoints
 * directly, so wiring up the real Spring Boot backend later is
 * a change in ONE place.
 *
 * HOW TO CONNECT YOUR BACKEND:
 *   1. Set VITE_API_BASE_URL in a .env file, e.g.:
 *        VITE_API_BASE_URL=https://api.aavie.life
 *   2. Every function below already targets a REST path under
 *      that base URL — implement matching endpoints in Spring
 *      Boot with the same request/response shapes (see the
 *      JSDoc + mock data in `src/data/mockData.js` for the
 *      exact shape each screen expects).
 *   3. Flip `USE_MOCK_DATA` to false once your backend is live.
 *      While true, every function resolves from local mock data
 *      instead of the network, so the UI is fully demoable with
 *      zero backend.
 *   4. Auth: `getAuthToken()` reads from localStorage — swap
 *      this for however your login flow stores the JWT/session
 *      token (this mirrors the Bearer-token pattern already
 *      used in the AAVIE mobile app's `authFetch` helper).
 * ============================================================
 */

import {
  mockDashboard,
  mockPatients,
  mockPatientDetail,
  mockProtocol,
  mockHerbPool,
  mockEarnings,
  mockScheduleSlots,
  mockPractitioner,
} from "../data/mockData";

// Simple in-memory cache for pending reviews
let pendingReviewsCache = null;
let pendingReviewsCacheTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

async function getCachedPendingReviews() {
  const now = Date.now();
  if (pendingReviewsCache && (now - pendingReviewsCacheTime) < CACHE_TTL) {
    return pendingReviewsCache;
  }
  const reviews = await request("/api/vaidya/reviews/pending");
  pendingReviewsCache = Array.isArray(reviews) ? reviews : [];
  pendingReviewsCacheTime = now;
  return pendingReviewsCache;
}

export function clearPendingReviewsCache() {
  pendingReviewsCache = null;
  pendingReviewsCacheTime = 0;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Toggle this to false once your Spring Boot backend is wired up.
const USE_MOCK_DATA = false;
const USE_MOCK_FOR_UNIMPLEMENTED = true; // keep mock for unbuilt endpoints

const MOCK_LATENCY_MS = 350;

function delay(value, ms = MOCK_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function getAuthToken() {
  return localStorage.getItem("aavie_practitioner_token");
}

export async function request(path, options = {}) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  // Some endpoints (e.g. sign-off) may return 204 No Content
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  return res.json();
}

/* ------------------------------------------------------------ */
/* Auth + Registration                                            */
/* ------------------------------------------------------------ */

/**
 * A rejected login/status check due to approval state (rather than
 * bad credentials or a network error) throws this, so screens can
 * tell the difference and route to the pending-approval screen
 * instead of showing a generic "wrong password" error.
 */
export class ApprovalStatusError extends Error {
  constructor(status, email) {
    super(`Account is ${status}`);
    this.name = "ApprovalStatusError";
    this.status = status; // 'PENDING' | 'DENIED'
    this.email = email;
  }
}

// In-memory mock registry so the register -> pending -> (mock)
// approve -> login flow is demoable end to end with no backend.
// Real integration replaces every branch below with the matching
// Spring Boot endpoint — see the JSDoc on each function.
const MOCK_REGISTRY_KEY = "aavie_mock_registrations";
function readMockRegistry() {
  try {
    return JSON.parse(localStorage.getItem(MOCK_REGISTRY_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeMockRegistry(registry) {
  localStorage.setItem(MOCK_REGISTRY_KEY, JSON.stringify(registry));
}

/**
 * POST /api/practitioner/auth/register
 * body: { fullName, email, phone, password, qualification,
 *         licenseNumber, yearsOfExperience, clinicCity }
 * -> { status: 'PENDING', email }
 *
 * The backend should create the practitioner record in a
 * PENDING state, notify the admin panel of the new application,
 * and NOT issue a login token yet — approval happens separately
 * in the admin panel.
 */
export async function register(payload) {
  if (USE_MOCK_DATA) {
    const registry = readMockRegistry();
    registry[payload.email] = {
      ...payload,
      status: "PENDING",
      submittedAt: new Date().toISOString(),
    };
    writeMockRegistry(registry);
    return delay({ status: "PENDING", email: payload.email });
  }
 return request("/api/vaidya/register", {
  method: "POST",
  body: JSON.stringify({
    fullName: payload.fullName,
    email: payload.email,
    mobile: payload.phone,
    password: payload.password,
    qualification: payload.qualification,
    licenseNumber: payload.licenseNumber,
    yearsExperience: payload.yearsOfExperience,
    city: payload.clinicCity,
  }),
});
}

/**
 * GET /api/practitioner/auth/status?email=
 * -> { status: 'PENDING' | 'APPROVED' | 'DENIED', email }
 *
 * Used by the Pending Approval screen so a practitioner can check
 * whether the admin has approved/denied them yet without needing
 * to re-attempt a full login.
 */
export async function checkApprovalStatus(email) {
  if (USE_MOCK_DATA) {
    const registry = readMockRegistry();
    const record = registry[email];
    if (!record) return delay({ status: "UNKNOWN", email });
    return delay({ status: record.status, email });
  }
  return request(
  `/api/vaidya/status?email=${encodeURIComponent(email)}`,
);
}

/**
 * DEV-ONLY helper so this flow is demoable without a real admin
 * panel: flips a mock registration to APPROVED. Remove once the
 * real backend + admin approval panel exist — approval will
 * happen there instead.
 */
export function _mockApprove(email) {
  const registry = readMockRegistry();
  if (registry[email]) {
    registry[email].status = "APPROVED";
    writeMockRegistry(registry);
  }
}

/**
 * POST /api/practitioner/auth/login  { email, password }
 * -> { token, practitioner }
 *
 * If the account exists but is not yet approved (or was denied),
 * the backend should respond 403 with a body like
 * { status: 'PENDING' | 'DENIED' } rather than a generic 401 —
 * this lets the login screen route to the Pending Approval screen
 * instead of showing "wrong password".
 */
export async function login(credentials) {
  if (USE_MOCK_DATA) {
    const registry = readMockRegistry();
    const record = registry[credentials.email];

    // Seeded demo account so login still works out of the box
    // even with an empty registry.
    if (credentials.email === "demo@aavie.life") {
      localStorage.setItem("aavie_practitioner_token", "mock-token");
      return delay({ token: "mock-token", practitioner: mockPractitioner });
    }

    if (!record) {
      throw new Error("No account found with that email. Please register first.");
    }
    if (record.status !== "APPROVED") {
      throw new ApprovalStatusError(record.status, credentials.email);
    }
    localStorage.setItem("aavie_practitioner_token", "mock-token");
    return delay({
      token: "mock-token",
      practitioner: { ...mockPractitioner, name: record.fullName },
    });
  }

const res = await fetch(`${API_BASE_URL}/api/vaidya/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(credentials),
});

// Handle empty response (Render cold start)
// Handle empty response (Render cold start) — retry once
let text = await res.text();
if (!text || text.trim() === "") {
  // Wait 3 seconds and retry once
  await new Promise(resolve => setTimeout(resolve, 3000));
  const retryRes = await fetch(`${API_BASE_URL}/api/vaidya/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  text = await retryRes.text();
  if (!text || text.trim() === "") {
    throw new Error("Server is starting up. Please wait 10 seconds and try again.");
  }
}

let data;
try {
  data = JSON.parse(text);
} catch {
  throw new Error("Invalid server response. Please try again.");
}

if (res.status === 403 || res.status === 401) {
  const body = await res.json().catch(() => ({}));
  // Check if pending or rejected
  const msg = body.message || "";
  if (msg.toLowerCase().includes("pending")) {
    throw new ApprovalStatusError("PENDING", credentials.email);
  }
  if (msg.toLowerCase().includes("rejected")) {
    throw new ApprovalStatusError("DENIED", credentials.email);
  }
  throw new Error(msg || "Couldn't sign in.");
}
if (!res.ok) {
  const body = await res.json().catch(() => ({}));
  throw new Error(body.message || "Couldn't sign in.");
}

localStorage.setItem("aavie_practitioner_token", data.token);
// Normalize field names
if (data.vaidya) {
  data.vaidya.name = data.vaidya.fullName ?? data.vaidya.name;
  data.vaidya.initials = data.vaidya.name
    ? data.vaidya.name.split(" ").map(w => w[0]).join("").toUpperCase()
    : "V";
  data.vaidya.qualification = data.vaidya.qualification ?? "BAMS";
}
return data;
}

export function logout() {
  localStorage.removeItem("aavie_practitioner_token");
}

/** GET /api/practitioner/me -> Practitioner */
export async function getCurrentPractitioner() {
  const data = await request("/api/vaidya/me");
  return {
    ...data,
    name: data.fullName ?? data.name,
    initials: (data.fullName ?? data.name ?? "V")
      .split(" ").map(w => w[0]).join("").toUpperCase(),
    qualification: data.qualification ?? "BAMS",
  };
}

/* ------------------------------------------------------------ */
/* Dashboard                                                     */
/* ------------------------------------------------------------ */

export async function getPendingReviews() {
  try {
        const reviews = await getCachedPendingReviews();
    if (!Array.isArray(reviews)) return [];
    // Map planId as id so navigation works correctly
    return reviews.map(p => ({
      ...p,
            id: `AAVIE-${p.planId}`,
      name: p.patientName ?? "Patient",
      constitutionType: p.prakriti ?? "",
      ciType: p.ciType ?? "",
      severity: p.severity ?? "mild",
    }));
  } catch {
    return [];
  }
}

export async function getApprovedReviews() {
  try {
    return await request("/api/vaidya/reviews/approved");
  } catch {
    return [];
  }
}

/** GET /api/practitioner/dashboard -> DashboardSummary */
export async function getDashboard() {
  try {
    const [reviews, signed] = await Promise.all([
      getCachedPendingReviews(),
      getApprovedReviews(),
    ]);

    const pending = Array.isArray(reviews) ? reviews : [];
    const signedList = Array.isArray(signed) ? signed : [];

    const getTimeAgo = (dateStr) => {
      if (!dateStr) return "Recently";
      const diff = Date.now() - new Date(dateStr).getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return "Today";
      if (days === 1) return "1 day ago";
      return `${days} days ago`;
    };

       // Calculate earnings from signed protocols
    const RATE_REVIEW = 400;
    const RATE_CALL_REVIEW = 900;
    const totalEarnings = signedList.reduce((sum, p) => {
      return sum + (p.severity === "severe" ? RATE_CALL_REVIEW : RATE_REVIEW);
    }, 0);

    return {
      metrics: {
        totalPatients: pending.length + signedList.length,
        totalPatientsBadge: pending.length > 0 ? `+${pending.length}` : "0",
        pendingReviews: pending.length,
        pendingReviewsBadge: pending.length > 0 ? `${pending.length} new` : "0",
        monthEarnings: totalEarnings > 0
          ? `₹${totalEarnings.toLocaleString("en-IN")}`
          : "₹0",
        signedProtocols: signedList.length,
        approvedToday: signedList.length,
        approvedTodayBadge: "Signed",
      },
      callBanner: null,
      pendingReviews: pending.map(p => ({
                id: `AAVIE-${p.planId}`,
        planId: p.planId,
        initials: (p.patientName ?? "P").charAt(0).toUpperCase(),
        name: p.patientName ?? "Patient",
        subtitle: `${p.ciType ?? ""} · ${p.severity ?? ""} PCOS · Cycle 1`,
        pillLabel: p.severity ?? "pending",
        pillTone: p.severity === "severe" ? "severe"
          : p.severity === "moderate" ? "mild" : "teal",
        escalation: p.severity === "severe",
      })),
      recentlySigned: signedList.map(p => ({
                id: `AAVIE-${p.planId}`,
        note: p.deliveryStatus === "blending"
          ? "Sent to Manufacturing"
          : "Pending Admin review",
        signedAgo: getTimeAgo(p.reviewedAt),
      })),
    };
  } catch {
    return delay(mockDashboard);
  }
}
/* ------------------------------------------------------------ */
/* Patients                                                       */
/* ------------------------------------------------------------ */

/**
 * GET /api/practitioner/patients?severity=&query=
 * -> Patient[]
 */
export async function getPatients({ severity, query } = {}) {
    try {
    const reviews = await getCachedPendingReviews().catch(() => []);
    if (!reviews || !Array.isArray(reviews)) return [];
    if (!Array.isArray(reviews)) return [];

    return reviews.map(p => ({
            id: `AAVIE-${p.planId}`,
      planId: p.planId,
      initials: (p.patientName ?? "P").charAt(0).toUpperCase(),
      name: p.patientName ?? "Patient",
      subtitle: `${p.ciType ?? ""} · ${p.severity ?? ""} · Cycle 1`,
      constitutionType: p.ciType ?? "",
      severity: (p.severity ?? "mild").toLowerCase(),
      statusLabel: p.reviewStatus === "approved" ? "Signed"
        : p.reviewStatus === "pending" ? "Review Pending"
        : p.reviewStatus,
      statusTone: p.reviewStatus === "approved" ? "success"
        : p.reviewStatus === "pending" ? "pending"
        : "neutral",
      needsScheduling: false,
      prakriti: p.prakriti,
      ciType: p.ciType,
      selectedSignals: p.selectedSignals,
    })).filter(p =>
      !severity || p.severity === severity
    ).filter(p =>
      !query || p.constitutionType.toLowerCase().includes(query.toLowerCase())
    );
  } catch {
    return [];
  }
}

/** GET /api/practitioner/patients/:id -> PatientDetail */
export async function getPatientDetail(planId) {
  try {
        const reviews = await getCachedPendingReviews();
    if (!Array.isArray(reviews)) return mockPatients[0];
    const plan = reviews.find(r => String(r.planId) === String(planId));
           if (!plan) return {
      id: planId,
      planId: Number(planId),
      initials: "P",
      name: "Patient",
      subtitle: "-",
      vitals: { age: "-", height: "-", weight: "-", bmi: "-" },
      prakriti: [],
      vikriti: { agniState: "-", ama: "-", aggravation: null },
      severity: "-",
      primaryDriver: "-",
      activeFlags: [],
      cycleData: { cycleLength: "-", periodDuration: "-" },
    };

    // Parse full herbs JSON for detailed data
    let herbsJson = {};
    try {
      if (plan.herbs) herbsJson = JSON.parse(plan.herbs);
    } catch {}

    // Parse prakriti into dosha array with percentages
    const prakritiStr = plan.prakriti ?? "Tridoshic";
    const doshaMap = {
      "Vata": { dosha: "Vata", tone: "vata" },
      "Pitta": { dosha: "Pitta", tone: "pitta" },
      "Kapha": { dosha: "Kapha", tone: "kapha" },
    };
    const parsePrakriti = (str) => {
      if (!str) return [{ dosha: "Vata", pct: 100, tone: "vata" }];
      const parts = str.split("-");
      if (parts.length === 1) {
        return [{ dosha: parts[0], pct: 100, tone: parts[0].toLowerCase() }];
      }
      if (parts.length === 2) {
        return [
          { dosha: parts[0], pct: 60, tone: parts[0].toLowerCase() },
          { dosha: parts[1], pct: 40, tone: parts[1].toLowerCase() },
        ];
      }
      return [
        { dosha: parts[0], pct: 50, tone: parts[0].toLowerCase() },
        { dosha: parts[1], pct: 30, tone: parts[1].toLowerCase() },
        { dosha: parts[2], pct: 20, tone: parts[2].toLowerCase() },
      ];
    };

    // Parse active flags from herbs JSON
          // Get active flags from selectedSignals (most reliable source)
      let activeFlags = [];
      if (plan.selectedSignals) {
        activeFlags = plan.selectedSignals
          .split(",")
          .map(f => f.trim())
          .filter(Boolean);
      } else {
        // Fallback to herbs JSON flags
              // Use selectedSignals from assessment — most reliable
      let activeFlags = [];
      if (plan.selectedSignals) {
        activeFlags = plan.selectedSignals
          .split(",")
          .map(f => f.trim())
          .filter(Boolean);
      } else {
        const flags = herbsJson.flags ?? {};
        activeFlags = Object.entries(flags)
          .filter(([, v]) => v === true)
          .map(([k]) => k);
      }
      }

    // Get agni and ama from herbs JSON
          // Use direct assessment fields — most reliable
      const agniRaw = plan.agniType ?? herbsJson.agni ?? "Sama";
      const agni = agniRaw.charAt(0).toUpperCase() + agniRaw.slice(1).toLowerCase();
      const amaDetected = plan.amaDetected ?? herbsJson.ama ?? false;
      const ama = amaDetected ? "Present" : "Absent";
    const agniLabels = {
      sama: "Sama", manda: "Manda",
      tikshna: "Tikshna", vishama: "Vishama"
    };

    return {
            id: `AAVIE-${plan.planId}`,
      planId: plan.planId,
      initials: (plan.patientName ?? "P").charAt(0).toUpperCase(),
      name: plan.patientName ?? "Patient",
      subtitle: `${plan.prakriti ?? ""} · ${plan.ciType ?? ""} · Severity: ${plan.severity ?? ""}`,
      age: plan.patientAge ?? "-",
      city: plan.patientCity ?? "-",
      reviewStatus: plan.reviewStatus,

      // Vitals
             vitals: {
        age: plan?.patientAge ? `${plan.patientAge}` : "-",
        height: plan?.patientHeight ? `${plan.patientHeight}cm` : "-",
        weight: plan?.patientWeight ? `${plan.patientWeight}kg` : "-",
        bmi: plan?.patientBmi ? `${plan.patientBmi}` : "-",
      },

      // Prakriti as dosha array
            prakriti: (() => {
        const vata = plan.scoreVata ?? 0;
        const pitta = plan.scorePitta ?? 0;
        const kapha = plan.scoreKapha ?? 0;
        const total = vata + pitta + kapha;

        // If real scores available use them
        if (total > 0) {
          const doshas = [
            { dosha: "Vata", pct: Math.round(vata * 100 / total), tone: "vata" },
            { dosha: "Pitta", pct: Math.round(pitta * 100 / total), tone: "pitta" },
            { dosha: "Kapha", pct: Math.round(kapha * 100 / total), tone: "kapha" },
          ].filter(d => d.pct > 0)
           .sort((a, b) => b.pct - a.pct);
          return doshas;
        }
        // Fallback to parsed prakriti string
        return parsePrakriti(plan.prakriti);
      })(),
      prakritiStr: plan.prakriti ?? "-",

      // Vikriti
      vikriti: {
        agniState: agniLabels[agni?.toLowerCase()] ?? agni ?? "Sama",
        ama: ama,
        aggravation: {
          dosha: plan.ciType?.split("-")[0] ?? "Kapha",
          label: `High +2 aggravation`,
          pct: 70,
        },
      },

      // Flags
      severity: plan.severity ?? "-",
      primaryDriver: herbsJson.primaryDriver ?? plan.ciType ?? "-",
      activeFlags: activeFlags.length > 0 ? activeFlags : [plan.ciType ?? "CI"],

      // Cycle data
           cycleData: {
        cycleLength: plan.cycleLength ? `${plan.cycleLength} days` : "-",
        periodDuration: plan.periodLength ? `${plan.periodLength} days` : "-",
        lastPeriodDate: plan.lastPeriodDate ?? null,
      },

      // Herbs
      amHerbs: plan.amHerbs,
      pmHerbs: plan.pmHerbs,
      herbs: plan.herbs,
    };
  } catch {
    return mockPatients[0];
  }
}

/* ------------------------------------------------------------ */
/* Protocol review                                                */
/* ------------------------------------------------------------ */

/** GET /api/practitioner/patients/:id/protocol -> Protocol */
export async function getProtocol(planId) {
  try {
        const reviews = await getCachedPendingReviews();
    if (!Array.isArray(reviews)) return mockProtocol;
    const plan = reviews.find(r => String(r.planId) === String(planId));
    if (!plan) return mockProtocol;

    // Parse herbs from amHerbs/pmHerbs or from herbs JSON
       // Parse full herbs JSON — available throughout getProtocol
    let herbsJson = {};
    try {
      if (plan.herbs) herbsJson = JSON.parse(plan.herbs);
    } catch {}

    // Parse herbs from amHerbs/pmHerbs or from herbs JSON
    let amJar = [];
    let pmJar = [];

    if (plan.amHerbs) {
      try { amJar = JSON.parse(plan.amHerbs); } catch {}
    }
    if (plan.pmHerbs) {
      try { pmJar = JSON.parse(plan.pmHerbs); } catch {}
    }

    // Fallback — parse from full herbs JSON
    if (amJar.length === 0) {
      amJar = herbsJson.amJar ?? herbsJson.am_jar ?? [];
    }
    if (pmJar.length === 0) {
      pmJar = herbsJson.pmJar ?? herbsJson.pm_jar ?? [];
    }
       return {
      amJar,
      pmJar,
      prakriti: plan.prakriti ?? "-",
      ciType: plan.ciType ?? "-",
      severity: plan.severity ?? "-",
      notes: "",
      planId: plan.planId,
      // Map to jars format expected by ProtocolReview.jsx
             jars: {
        am: {
          herbs: Array.isArray(amJar) ? amJar.map((h, i) => ({
            name: typeof h === "string" ? h : (h.herb ?? h.name ?? String(h)),
            dose: typeof h === "string" ? "25g" : (h.qty ?? h.dose ?? "25g"),
            tag: typeof h === "string"
              ? (i === 0 ? "Lead" : "Base")
              : (h.tag ?? h.reason ?? ""),
            locked: typeof h === "object" ? (h.locked ?? false) : false,
          })) : [],
          max: 4,
        },
        pm: {
          herbs: Array.isArray(pmJar) ? pmJar.map((h, i) => ({
            name: typeof h === "string" ? h : (h.herb ?? h.name ?? String(h)),
            dose: typeof h === "string" ? "25g" : (h.qty ?? h.dose ?? "25g"),
            tag: typeof h === "string"
              ? (i === 0 ? "Lead" : "Base")
              : (h.tag ?? h.reason ?? ""),
            locked: typeof h === "object" ? (h.locked ?? false) : false,
          })) : [],
          max: 7,
        },
      },

                 // Build engine note from assessment data
      engineNote: (() => {
        const parts = [];
        if (plan.ciType) parts.push(`<b>${plan.ciType}</b>`);
        if (plan.agniType) parts.push(`${plan.agniType} Agni`);
        if (plan.amaDetected) parts.push("Ama present");
        if (plan.severity) parts.push(`<b>${plan.severity.charAt(0).toUpperCase() + plan.severity.slice(1)}</b>`);
        if (plan.selectedSignals) {
          const flags = plan.selectedSignals.split(",").map(f => f.trim()).join(", ");
          parts.push(`flags ${flags}`);
        }
        const primaryDriver = herbsJson.primaryDriver;
        const driverNote = primaryDriver
          ? `<b>${primaryDriver}</b> is the primary driver this cycle.`
          : "";
        return `AAVIE engine suggests this based on ${parts.join(" · ")}. ${driverNote} Herbs are add/remove only — dose follows the fixed lead (50g) / standard (25g) model.`;
      })(),

      // Clinical escalation from herbs JSON
      escalation: (() => {
        const escalations = herbsJson.clinicalEscalation ?? [];
        if (!Array.isArray(escalations) || escalations.length === 0) return null;
        const first = escalations[0];
        return {
          title: first.flag
            ? `${first.flag} · ${first.type ?? "Standard Review"}`
            : "Clinical Review",
          body: first.rationale ?? first.note ?? "",
          acknowledgeLabel: first.acknowledgeLabel
            ?? `Acknowledged — reviewed the ${first.flag ?? ""} withholding rationale`,
        };
      })(),
      warningsLog: (() => {
        try {
          const herbsJson = plan.herbs ? JSON.parse(plan.herbs) : {};
          const warnings = herbsJson.warnings ?? herbsJson.warningsLog ?? [];
          return Array.isArray(warnings) ? warnings : [];
        } catch { return []; }
      })(),
      donts: (() => {
        try {
          const herbsJson = plan.herbs ? JSON.parse(plan.herbs) : {};
          return herbsJson.donts ?? [];
        } catch { return []; }
      })(),
      infusedWater: (() => {
        try {
          const herbsJson = plan.herbs ? JSON.parse(plan.herbs) : {};
          return herbsJson.infusedWater ?? null;
        } catch { return null; }
      })(),
      juice: (() => {
        try {
          const herbsJson = plan.herbs ? JSON.parse(plan.herbs) : {};
          return herbsJson.juice ?? null;
        } catch { return null; }
      })(),
    };
  } catch {
    return mockProtocol;
  }
}

/** GET /api/practitioner/herbs -> { [herbName]: reasonTag } — engine's known herb vocabulary */
export async function getHerbPool() {
  // Always use mock — herb pool is not yet in backend
  return mockHerbPool;
}

/**
 * PATCH /api/practitioner/patients/:id/protocol/herbs
 * body: { jar: 'am'|'pm', action: 'add'|'remove', herbName }
 * -> updated Protocol
 */
export async function updateProtocolHerb(patientId, { jar, action, herbName }) {
  if (USE_MOCK_DATA) return delay({ ok: true });
  // Just return ok — actual save happens on sign off
  return { ok: true };
}

/**
 * PATCH /api/practitioner/patients/:id/protocol/notes
 * body: { notes }
 */
export async function updateProtocolNotes(patientId, notes) {
  // Just store notes locally — actual save happens on sign off
  return { ok: true };
}

/**
 * POST /api/practitioner/patients/:id/protocol/sign-off
 * body: { escalationAcknowledged: boolean, notes }
 * -> { protocolId, signedBy, signedAt, status }
 */
export async function signOffProtocol(patientId, payload) {
  if (USE_MOCK_DATA) {
    return delay({
      protocolId: "AAVIE-PRO-2025-0419",
      signedBy: mockPractitioner.name,
      signedAt: new Date().toISOString(),
      status: "PENDING_ADMIN_REVIEW",
    });
  }
  const result = await request(`/api/vaidya/reviews/${patientId}/approve`, {
    method: "PUT",
    body: JSON.stringify({
      doctorNotes: payload?.notes ?? "",
      signature: payload?.signature ?? "",
    }),
  });
  clearPendingReviewsCache();
  // Return formatted result for SignedSuccess page
  return {
    protocolId: `AAVIE-PRO-${patientId}`,
    signedBy: payload?.signedBy ?? "Vaidya",
    signedAt: new Date().toISOString(),
    status: "APPROVED",
    ...result,
  };
}

/* ------------------------------------------------------------ */
/* Schedule call                                                  */
/* ------------------------------------------------------------ */

/** GET /api/practitioner/patients/:id/slots -> Slot[] */
export async function getAvailableSlots(patientId) {
  // Generate next 5 available slots (frontend only for now)
  const slots = [];
  const now = new Date();

  const timeOptions = [
    { time: "10:00 AM", duration: "30 min" },
    { time: "12:00 PM", duration: "30 min" },
    { time: "4:00 PM", duration: "30 min" },
    { time: "6:00 PM", duration: "30 min" },
    { time: "8:00 PM", duration: "30 min" },
  ];

  for (let i = 0; i < 3; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    const dayLabel = i === 0 ? "Today"
      : i === 1 ? "Tomorrow"
      : date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

    const timeOpt = timeOptions[i % timeOptions.length];
    const fullDate = date.toLocaleDateString("en-IN", {
      weekday: "short", day: "numeric", month: "short", year: "numeric"
    });

    slots.push({
      id: `slot-${i}`,
      time: `${dayLabel}, ${timeOpt.time}`,
      date: `${fullDate} · ${timeOpt.duration}`,
    });
  }

  return slots;
}

/**
 * POST /api/practitioner/patients/:id/schedule
 * body: { slotId }
 */
export async function confirmSlot(patientId, slotId) {
  if (USE_MOCK_DATA || USE_MOCK_FOR_UNIMPLEMENTED) return { confirmed: true };
  return { confirmed: true };
}

/* ------------------------------------------------------------ */
/* Earnings                                                        */
/* ------------------------------------------------------------ */

/** GET /api/practitioner/earnings?month=YYYY-MM -> Earnings */
export async function getEarnings() {
  try {
    const signed = await getApprovedReviews();
    const signedList = Array.isArray(signed) ? signed : [];

    // Rate card
    const RATE_REVIEW_ONLY = 400;
    const RATE_CALL_REVIEW = 900;

    // Calculate earnings per patient
    let reviewTotal = 0;
    let callTotal = 0;

    const ledger = signedList.map(p => {
      const isCallReview = p.severity === "severe";
      const amount = isCallReview ? RATE_CALL_REVIEW : RATE_REVIEW_ONLY;
      if (isCallReview) callTotal += amount;
      else reviewTotal += amount;

      return {
               id: `AAVIE-${p.planId}`,
        note: isCallReview
          ? `${p.severity ?? "Severe"} · Call + Review`
          : `${p.severity ?? "Mild"} · Review only`,
        amount: `+₹${amount}`,
      };
    });

    const totalThisMonth = reviewTotal + callTotal;
    const now = new Date();
    const monthName = now.toLocaleString("en-IN", {
      month: "long", year: "numeric"
    });

    return {
      month: monthName,
      totalThisMonth: `₹${totalThisMonth.toLocaleString("en-IN")}`,
      nextPayout: `Next payout: 10 ${now.toLocaleString("en-IN", { month: "short" })} · UPI linked`,
      rateCardNote: `Rate card — Review only: <b>₹${RATE_REVIEW_ONLY}</b>. Call + Review (severe, requires a scheduled call): <b>₹${RATE_CALL_REVIEW}</b>.`,
      breakdown: [
        {
          label: `Review fees (${signedList.filter(p => p.severity !== "severe").length})`,
          amount: `₹${reviewTotal}`,
        },
        {
          label: `Call + Review fees (${signedList.filter(p => p.severity === "severe").length})`,
          amount: `₹${callTotal}`,
        },
      ],
      ledger: ledger.length > 0 ? ledger : [{
        id: "—",
        note: "No signed protocols yet",
        amount: "₹0",
      }],
      payoutHistory: [
        {
          period: `${monthName} (current)`,
          status: `Pending · ₹${totalThisMonth.toLocaleString("en-IN")}`,
          tone: "pending",
        },
      ],
      upiId: "—",
    };
  } catch {
    return mockEarnings ?? {};
  }
}
