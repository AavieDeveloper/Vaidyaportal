# AAVIE Practitioner Portal

A responsive React web app for AAVIE's Ayurvedic practitioners to review
patients, manage AM/PM herb protocols, handle clinical escalations, sign off
protocols, schedule calls for severe cases, and track earnings.

Ported from the approved AAVIE Practitioner Portal design mock -- all screens,
copy, herb vocabulary, and figures match the source exactly.

## Stack

- **React 19** + **Vite** (fast dev server, small production bundle)
- **React Router v6** for client-side routing
- Plain CSS (co-located per component) -- no CSS framework dependency, so the
  visual system stays exactly the one AAVIE approved, with nothing to
  override
- Zero UI/icon library dependencies -- icons are inline SVG

## Getting started

```bash
npm install
npm run dev       # starts a local dev server, usually http://localhost:5173
```

```bash
npm run build      # production build -> dist/
npm run preview    # serve the production build locally
```

## Project structure

```
src/
  api/
    client.js        <- THE ONLY FILE THAT CALLS fetch(). See below.
  data/
    mockData.js       <- Demo data used while USE_MOCK_DATA = true
  components/          <- Shared, reusable UI (Badge, Card, AppShell, etc.)
  pages/                <- One file per screen (Dashboard, Patients, ...)
  styles/
    tokens.css          <- All design tokens (colors, type, spacing)
  utils/
    severity.js         <- Small formatting helpers
```

## Connecting your Spring Boot backend

Every network call in this app goes through **`src/api/client.js`** -- no
other file ever calls `fetch` directly. This means wiring up your real
backend is a change in exactly one place.

### Steps

1. **Set your API base URL.** Copy `.env.example` to `.env` and fill in your
   backend's URL:
   ```
   VITE_API_BASE_URL=https://api.aavie.life
   ```

2. **Flip the mock-data flag off.** In `src/api/client.js`:
   ```js
   const USE_MOCK_DATA = true;   // change to false
   ```
   While `true`, every function in that file resolves from local mock data
   (`src/data/mockData.js`) instead of the network -- this is what lets the
   whole app run and demo fully without any backend at all.

3. **Implement matching Spring Boot endpoints.** Every function in
   `client.js` has a JSDoc comment stating the exact REST path, HTTP method,
   and expected request/response shape, e.g.:

   ```js
   /** GET /api/practitioner/dashboard -> DashboardSummary */
   export async function getDashboard() { ... }
   ```

   The shape each screen expects is also visible directly in
   `src/data/mockData.js` -- treat that file as your response-contract
   reference while building the backend.

4. **Auth.** `getAuthToken()` in `client.js` reads a Bearer token from
   `localStorage` (`aavie_practitioner_token`) and attaches it to every
   request automatically -- this mirrors the pattern already used in the
   AAVIE mobile app's `authFetch` helper. Update `login()` /
   `getCurrentPractitioner()` once your `/api/practitioner/auth/login` and
   `/api/practitioner/me` endpoints exist.

### Full endpoint list expected by this app

| Function | Method | Path |
|---|---|---|
| `register` | POST | `/api/practitioner/auth/register` |
| `checkApprovalStatus` | GET | `/api/practitioner/auth/status?email=` |
| `login` | POST | `/api/practitioner/auth/login` |
| `getCurrentPractitioner` | GET | `/api/practitioner/me` |
| `getDashboard` | GET | `/api/practitioner/dashboard` |
| `getPatients` | GET | `/api/practitioner/patients?severity=&query=` |
| `getPatientDetail` | GET | `/api/practitioner/patients/:id` |
| `getProtocol` | GET | `/api/practitioner/patients/:id/protocol` |
| `getHerbPool` | GET | `/api/practitioner/herbs` |
| `updateProtocolHerb` | PATCH | `/api/practitioner/patients/:id/protocol/herbs` |
| `updateProtocolNotes` | PATCH | `/api/practitioner/patients/:id/protocol/notes` |
| `signOffProtocol` | POST | `/api/practitioner/patients/:id/protocol/sign-off` |
| `getAvailableSlots` | GET | `/api/practitioner/patients/:id/slots` |
| `confirmSlot` | POST | `/api/practitioner/patients/:id/schedule` |
| `getEarnings` | GET | `/api/practitioner/earnings?month=YYYY-MM` |

## Registration & approval flow

New practitioners register at `/register` (Full name, Email, Phone,
Password, Qualification, Registration/License number, Years of experience,
Clinic/City). Submitting **does not** log them in — it creates a pending
application and sends them to `/pending-approval`.

- **`register(...)`** should create the practitioner in a `PENDING` state on
  your backend and surface it in your admin panel for approval/denial. It
  intentionally does not return a login token.
- **`login(...)`** should respond `403` with `{ status: 'PENDING' | 'DENIED' }`
  for an account that exists but isn't approved yet — the login screen
  catches this (`ApprovalStatusError`) and routes to `/pending-approval`
  instead of showing "wrong password".
- **`checkApprovalStatus(email)`** lets the practitioner re-check their
  status from the pending screen without re-entering credentials.
- Approval/denial itself happens in **your admin panel**, not in this app —
  this portal only reads the resulting status.

**Demo-only mock approval:** since there's no admin panel here yet, the
mock `client.js` stores registrations in `localStorage` and the Pending
Approval screen has a "*(Demo only) Simulate admin approval*" button so you
can walk through the full register → pending → approved → login flow
end-to-end without a backend. Remove `_mockApprove` and that button once
your real backend + admin approval panel exist — search for `DEV-ONLY` in
`src/api/client.js` and `src/pages/PendingApproval.jsx` to find both spots.

There's also a seeded demo account (`demo@aavie.life`, any password) so you
can jump straight into the authenticated app while mock data is on.

## Responsive behavior

- **< 960px (mobile/tablet):** bottom tab bar navigation, single-column
  stacked cards, bottom-sheet modals -- matches the source mobile mock
  exactly.
- **>= 960px (desktop):** persistent left sidebar navigation, wider
  multi-column layouts for metric grids and patient detail (Prakriti/Vikriti
  side-by-side with Flags), centered dialog for the add-herb modal instead
  of a bottom sheet.

All breakpoint logic lives in each component's co-located `.css` file under
a single `@media (min-width: 960px)` block, so the mobile-first styles are
always the default and desktop only *adds* layout changes on top.

## Screens included

1. **Dashboard** -- greeting, call banner for pending severe cases, key
   metrics, pending protocol reviews, recently signed list
2. **Patients** -- searchable, filterable by severity (Subclinical / Mild /
   Moderate / Severe)
3. **Patient Detail** -- vitals, Prakriti constitution, Vikriti (Agni + Ama),
   active flags, cycle data
4. **Protocol Review** -- engine's suggested protocol, clinical escalation
   (must be acknowledged before sign-off is enabled), AM/PM jar herb
   management with add/remove (capped per severity), warnings log,
   practitioner notes, sign-off
5. **Signed Success** -- confirmation with protocol ID and status
6. **Schedule Call** -- for severe cases requiring a call before review;
   patient summary, clinical flags, available time slots
7. **Earnings** -- monthly total, rate card, per-patient ledger, payout
   history

## Notes on the herb model

Doses are **not** freely editable -- herbs are add/remove only, and any herb
added enters at the standard 25g dose (promoting a herb to "lead" status at
50g is a separate action not modeled here, matching the source design's
stated scope). The herb pool (`getHerbPool()`) is the fixed vocabulary the
AAVIE engine recognizes -- the add-herb modal only offers herbs from this
list that aren't already in the jar being edited.
