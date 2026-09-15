/**
 * Mock data — mirrors the shape the real Spring Boot endpoints
 * should return. Ported from the approved AAVIE Practitioner
 * Portal mock (all copy, IDs, and figures kept as given).
 */

export const mockPractitioner = {
  id: "prac_dm01",
  name: "Dr. D. Mehra",
  qualification: "BAMS",
  initials: "DM",
  role: "Ayurvedic Practitioner · AAVIE Partner",
};

export const mockDashboard = {
  greetingName: "Dr. Mehra",
  metrics: {
    totalPatients: 12,
    totalPatientsBadge: "3 new this week",
    pendingReviews: 4,
    pendingReviewsBadge: "1 escalation",
    monthEarnings: "₹1,700",
    signedProtocols: 7,
  },
  callBanner: {
    title: "1 severe case",
    subtitle: "awaiting scheduling",
    patientId: "AAVIE-P03-0217",
    meta: "Assigned today",
  },
  pendingReviews: [
    {
      id: "AAVIE-K03-0417",
      initials: "K3",
      subtitle: "K · Severe PCOS · Cycle 1",
      pillLabel: "Primary: Insulin Resistance",
      pillTone: "teal",
      severity: "severe",
      escalation: true,
    },
    {
      id: "AAVIE-K01-0219",
      initials: "RK",
      subtitle: "K · Mild PCOS · Cycle 1",
      severity: "mild",
      escalation: false,
    },
    {
      id: "AAVIE-P02-0311",
      initials: "P2",
      subtitle: "P · Moderate PCOS · Cycle 2",
      severity: "moderate",
      escalation: false,
    },
  ],
  recentlySigned: [
    {
      id: "AAVIE-V04-0108",
      note: "Signed 2 days ago · Pending Admin review",
    },
    {
      id: "AAVIE-VK06-0225",
      note: "Signed 5 days ago · Sent to Manufacturing",
    },
  ],
};

export const mockPatients = [
  {
    id: "AAVIE-K03-0417",
    initials: "K3",
    constitutionType: "K",
    subtitle: "K · Severe PCOS · Cycle 1",
    severity: "severe",
    statusLabel: "Escalation · Review",
    statusTone: "severe",
  },
  {
    id: "AAVIE-P03-0217",
    initials: "P3",
    constitutionType: "P",
    subtitle: "P · Severe PCOS · Cycle 1",
    severity: "severe",
    statusLabel: "Call Pending",
    statusTone: "severe",
    needsScheduling: true,
  },
  {
    id: "AAVIE-K01-0219",
    initials: "K1",
    constitutionType: "K",
    subtitle: "K · Mild PCOS · Cycle 1",
    severity: "mild",
    statusLabel: "Review Pending",
    statusTone: "mild",
  },
  {
    id: "AAVIE-V04-0108",
    initials: "V4",
    constitutionType: "V",
    subtitle: "V · Mild PCOS · Cycle 1",
    severity: "mild",
    statusLabel: "Signed",
    statusTone: "signed",
  },
  {
    id: "AAVIE-P02-0311",
    initials: "P2",
    constitutionType: "P",
    subtitle: "P · Moderate PCOS · Cycle 2",
    severity: "moderate",
    statusLabel: "Review Pending",
    statusTone: "moderate",
  },
  {
    id: "AAVIE-VK06-0225",
    initials: "VK6",
    constitutionType: "VK",
    subtitle: "VK · Moderate PCOS · Cycle 1",
    severity: "moderate",
    statusLabel: "Signed",
    statusTone: "signed",
  },
];

export function mockPatientDetail(patientId) {
  // In the real API this comes from GET /api/practitioner/patients/:id
  const base = mockPatients.find((p) => p.id === patientId) || mockPatients[0];
  return {
    id: base.id,
    initials: base.initials,
    subtitle: "Assessment 2 · Prakriti + Vikriti + PCOS · Cycle 1",
    vitals: { age: 29, height: "159cm", weight: "74kg", bmi: "29.3" },
    prakriti: [
      { dosha: "Kapha", pct: 55, tone: "kapha" },
      { dosha: "Pitta", pct: 25, tone: "pitta" },
      { dosha: "Vata", pct: 20, tone: "vata" },
    ],
    vikriti: {
      agniState: "Manda",
      ama: "Present",
      aggravation: {
        dosha: "Kapha",
        label: "High +2 aggravation",
        pct: 80,
        tone: "green",
      },
    },
    severity: "Severe PCOS",
    primaryDriver: "Insulin Resistance",
    activeFlags: [
      "INSULIN_RESISTANCE",
      "ANDROGENIC",
      "THYROID",
      "CONSTIPATION",
    ],
    cycleData: { cycleLength: "34 days", periodDuration: "4–5 days" },
  };
}

export const mockHerbPool = {
  Trikatu: "Agni/Manda support",
  Nagarmotha: "Ama/Vishama Agni",
  "Kachnar Chhal": "ANDROGENIC · glandular",
  Gugulu: "INSULIN_RESISTANCE / THYROID",
  Yashtimadhu: "Tikshna Agni lead",
  Punarnava: "LIVER / WATER_RETENTION",
  Guduchi: "ANDROGENIC-P / INFLAMMATORY (auto-swapped if hepatotoxicity flag)",
  Manjistha: "ANDROGENIC (P/VP)",
  Shatapushpa: "ANOVULATION / ANDROGENIC-V",
  Kutki: "LIVER support",
  Varuna: "WATER_RETENTION",
  Ashoka: "HEAVY_BLEEDING lead",
  Lodhra: "HEAVY_BLEEDING",
  Shatavari: "Base / HEAVY_BLEEDING (K) / ANOVULATION",
  Ashwagandha: "THYROID (auto-swapped if hepatotoxicity flag)",
  Bala: "Base support (V-types)",
  Vidari: "Base support (removed if Ama)",
  Brahmi: "STRESS_CORTISOL / LIVER safety swap",
  Jatamansi: "SLEEP / STRESS_CORTISOL severe",
  Gokshura: "INSULIN_RESISTANCE / WATER_RETENTION",
  Amalaki: "Base / LIVER safety swap",
  Nagkesar: "HEAVY_BLEEDING severe",
};

export function mockProtocol(patientId) {
  return {
    patientId,
    engineNote:
      "AAVIE engine suggests this based on <strong>K-type · Manda Agni · Ama present · Severe</strong>, flags INSULIN_RESISTANCE, ANDROGENIC, THYROID, CONSTIPATION. <strong>Insulin Resistance is the primary driver this cycle.</strong> Herbs are add/remove only — dose follows the fixed lead (50g) / standard (25g) model.",
    escalation: {
      title: "THYROID · Standard Review",
      body: "IR+THYROID+ANDROGENIC collision — Kachnar Chhal/Gugulu/Ashwagandha withheld for the thyroid indication. Insulin Resistance is primary driver this cycle instead. Not on thyroid medication — routine review, not urgent escalation.",
      acknowledgeLabel:
        "Acknowledged — reviewed the thyroid withholding rationale",
    },
    jars: {
      am: {
        max: 4,
        herbs: [
          { name: "Nagarmotha", note: "Lead · Ama-pachana", dose: "50g" },
          { name: "Trikatu", note: "Manda Agni · Deepana", dose: "25g" },
          { name: "Kachnar Chhal", note: "ANDROGENIC · glandular", dose: "25g" },
          { name: "Gugulu", note: "INSULIN_RESISTANCE", dose: "25g" },
        ],
      },
      pm: {
        max: 7,
        herbs: [
          { name: "Guduchi", note: "Lead", dose: "50g" },
          { name: "Amalaki", note: "Base", dose: "25g" },
          { name: "Ashoka", note: "Base", dose: "25g" },
          { name: "Gokshura", note: "Base", dose: "25g" },
          { name: "Punarnava", note: "Base", dose: "25g" },
          { name: "Kachnar Chhal", note: "ANDROGENIC PM", dose: "25g" },
          { name: "Brahmi", note: "LIVER safety swap", dose: "25g" },
        ],
      },
    },
    warningsLog: [
      "Manda Agni: Trikatu leads AM (Deepana priority).",
      "Ama detected: Nagarmotha leads AM. Ama-pachana priority active.",
      "CONSTIPATION: Triphala as standalone bedtime dose (NOT in PM jar). Nagarmotha confirmed AM.",
    ],
    notes: "",
  };
}

export const mockScheduleSlots = [
  { id: "slot1", time: "Today, 4:00 PM", date: "Thu, 3 Apr 2025 · 30 min" },
  {
    id: "slot2",
    time: "Tomorrow, 10:00 AM",
    date: "Fri, 4 Apr 2025 · 30 min",
  },
  { id: "slot3", time: "Sat, 5 Apr · 11:30 AM", date: "Sat, 5 Apr 2025 · 30 min" },
];

export const mockEarnings = {
  month: "April 2025",
  totalThisMonth: "₹1,700",
  nextPayout: "Next payout: 10 Apr · UPI linked",
  rateCardNote:
    "Rate card — <strong>placeholder figures, need real numbers before this ships.</strong> Review only: ₹400. Call + Review (severe, requires a scheduled call): ₹900.",
  breakdown: [
    { label: "Review fees (2)", amount: "₹800" },
    { label: "Call + Review fees (1)", amount: "₹900" },
  ],
  ledger: [
    { id: "AAVIE-V04-0108", note: "Mild · Review only", amount: "+₹400" },
    { id: "AAVIE-VK06-0225", note: "Moderate · Review only", amount: "+₹400" },
    { id: "AAVIE-EC05-0119", note: "Severe · Call + Review", amount: "+₹900" },
  ],
  payoutHistory: [
    { period: "March 2025", status: "Paid · ₹2,100", tone: "signed" },
    { period: "April 2025 (current)", status: "Pending · ₹1,700", tone: "moderate" },
  ],
  upiId: "drmehra@okaxis",
};
