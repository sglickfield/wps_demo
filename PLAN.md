# WPS-Style Assessment Platform — Website Plan (v1)

**Status:** Awaiting approval — no implementation yet  
**Location:** `Claude/wps_web_ui`  
**Scope:** Mocked web UI for clinicians to open cases, assign/share assessments, complete forms, and review history. All data mocked (no real scoring engine, payments, or PHI backend).

---

## 1. What WPS is (research summary)

**WPS (Western Psychological Services)** is an independent publisher of **clinical and educational assessments** used by psychologists, school psychologists, SLPs, OTs, and related professionals. Flagship areas include:

- Autism & social communication (e.g. ADOS-2, SRS-2 / SRS-3)
- Adaptive behavior & development (e.g. ABAS-3, DP-4)
- Sensory processing (e.g. SPM-2)
- Speech/language (e.g. CASL-2, CAPs)
- Learning (e.g. TOD — Tests of Dyslexia)

Their commercial site ([wpspublish.com](https://www.wpspublish.com)) sells kits, manuals, and online uses. Digital work typically flows through the **WPS Online Evaluation System (OES)** / Evaluation System platform, which is **not a general EHR** — it is an **assessment administration, scoring, and reporting** product.

### Real OES-aligned workflow (from public OES materials)

1. **Register / qualify** as a professional (qualification levels for restricted materials — we mock this lightly).
2. **Create a Client** (examinee record).
3. **Start a new Administration / Case** tied to that client.
4. **Build a battery** — add licensed form(s) for an assessment product.
5. **Designate a rater** (parent/caregiver, teacher, self, clinician) and delivery method.
6. **Share** an email/link so the rater completes online (or complete **on-screen** in session).
7. **Score** when form(s) are complete; generate **reports**.
8. **Review history** — past administrations, forms, and reports for the client.

Our product should feel like a **simplified clinician portal + rater portal** inspired by that loop, not a copy of their catalog storefront.

---

## 2. Product vision (this project)

**Name (working):** WPS Practice Portal (mock)  
**Primary user:** Clinician / school psychologist / related evaluator  
**Secondary user:** Rater (parent, teacher, examinee) via secure invite link  

**Jobs to be done**

| User | Jobs |
|------|------|
| Clinician | Find/create client; open a case; choose assessment forms; assign raters; send invites; monitor status; score (mock); view/download reports; browse past assessments |
| Rater | Open invite link; consent/instructions; complete form; submit; see confirmation |
| (Optional later) Admin | Manage org, licenses, users — **out of v1** |

**Explicit non-goals for v1**

- Real item banks / psychometric scoring  
- Real PHI security / HIPAA compliance claim  
- Purchasing, inventory, or license metering  
- Full digital easel / observational coding (ADOS-style live coding UI)  
- Integration with EHRs  

---

## 3. Core domain model (mock)

```
Organization (single mock org)
  └── Users (clinicians)
        └── Clients (examinees)
              └── Cases (administrations / evaluation episodes)
                    └── Forms (assigned rating scales / protocols)
                          ├── Rater + delivery method + status
                          ├── Responses (mock answers)
                          └── Report (mock PDF/HTML summary when scored)
```

### Entities

| Entity | Key fields (mock) |
|--------|-------------------|
| **Client** | id, name, DOB, sex/gender, ID/MRN (optional), school/grade (optional), notes, createdAt |
| **Case** | id, clientId, title (e.g. “Spring 2026 comprehensive eval”), reason/referral, status (`draft` \| `in_progress` \| `ready_to_score` \| `scored` \| `closed`), clinicianId, openedAt, closedAt |
| **Assessment product** | code, name, area (autism, adaptive, sensory, language, …), forms catalog |
| **Form assignment** | id, caseId, productCode, formName (e.g. “Parent/Caregiver Form”), raterRole, raterName, raterEmail, delivery (`email_link` \| `on_screen` \| `manual_entry`), status (`not_sent` \| `sent` \| `in_progress` \| `completed` \| `expired`), inviteToken, dueDate, completedAt |
| **Report** | id, caseId / formId, type (Score Report, Rater Report, Comparison), generatedAt, summary metrics (mock) |

### Catalog (seed mock products)

Enough to feel real without catalog sprawl:

1. **SRS-2** — Social Responsiveness Scale, 2nd Ed. (Parent, Teacher forms)  
2. **ABAS-3** — Adaptive Behavior Assessment System, 3rd Ed. (Parent, Teacher)  
3. **SPM-2** — Sensory Processing Measure, 2nd Ed. (Home, School)  
4. **DP-4** — Developmental Profile 4 (Parent/Caregiver)  
5. **CASL-2** — Comprehensive Assessment of Spoken Language (clinician-entered mock form)

---

## 4. Personas & entry points

### A. Clinician portal (authenticated, mock login)

- Email/password mock login → lands on **Dashboard**  
- One demo account pre-filled (e.g. Dr. Avery Chen, School Psychologist)

### B. Rater portal (token link, no full account)

- URL like `/r/:inviteToken`  
- Lightweight identity confirm (name + relationship)  
- Form UI → submit → thank-you  

---

## 5. Information architecture (pages)

### Clinician

| Route | Page | Purpose |
|-------|------|---------|
| `/login` | Sign in | Mock auth |
| `/` | **Dashboard** | Work queue: incomplete cases, pending forms, recently scored |
| `/clients` | **Client list** | Search/filter clients; New Client |
| `/clients/new` | **New client** | Create examinee record |
| `/clients/:id` | **Client home** | Demographics + list of cases/administrations + New Case |
| `/cases/new?clientId=` | **New case wizard** | Start administration |
| `/cases/:id` | **Case workspace** | Battery, form statuses, share/resend, score, reports |
| `/cases/:id/forms/:formId` | **Form detail** | Assignment, progress, mock responses, score/report |
| `/assessments` | **Assessment library** | Browse mock products (read-only catalog) |
| `/history` | **Assessment history** | Cross-client filter of completed/scored work |
| `/reports/:id` | **Report viewer** | Mock scored report + print-friendly view |

### Rater

| Route | Page | Purpose |
|-------|------|---------|
| `/r/:token` | **Invite landing** | Who this is for, instructions, start |
| `/r/:token/form` | **Take assessment** | Multi-section Likert (or mock items) |
| `/r/:token/done` | **Confirmation** | Submitted successfully |

---

## 6. Primary workflows (align with real WPS work)

### Workflow A — Start a case (new client)

```
Dashboard → New Client
  → enter demographics (name, DOB, optional school/ID)
  → save → Client Home
  → New Case
  → name case + reason for referral
  → select product(s) / forms (battery)
  → for each form: choose rater role + rater contact + delivery
  → Review & open case
  → Case workspace (status: in_progress)
```

**WPS parallel:** New Client → New administration → Add form(s).

### Workflow B — Share assessment with a rater (remote)

```
Case workspace → select form → Share / Send invite
  → mock email preview (to, subject, personal message)
  → Send (mock) → status: sent; copy invite link for demo
  → optional Resend / Expire link
```

Rater:

```
Opens link → confirms name/relationship → reads instructions
  → completes sections → Submit
  → form status: completed on Case workspace
```

**WPS parallel:** Email delivery to rater with online form link.

### Workflow C — On-screen / in-session completion

```
Case workspace → form → Complete on-screen
  → same form UI as rater portal, but in clinician session
  → Submit → completed
```

**WPS parallel:** On-site / assisted digital administration (simplified).

### Workflow D — Score & report (mock)

```
When all required forms for a product are completed
  (or clinician clicks Score available forms)
  → mock scoring animation/delay
  → generate Score Report + optional Rater Summary
  → Case status → scored
  → open Report viewer (T-scores/percentiles as fake numbers + narrative stub)
```

**WPS parallel:** Platform scores forms and produces report types (we only mock outputs).

### Workflow E — View old assessments

```
Client home → past cases list (filter by year/product/status)
  OR global History page (search client, product, date range)
  → open case (read-only if closed) → forms + reports
  → open report / export mock PDF (browser print)
```

**WPS parallel:** Returning to prior administrations and reports for a client.

### Workflow F — Progress-style revisit (optional but on-brand)

```
Client with prior ABAS-3 (or similar) scored case
  → New Case → “Progress check” template pre-selects same product
  → after scoring, mock Progress Comparison report (time 1 vs time 2)
```

**WPS parallel:** Progress monitoring reports called out in OES materials.

---

## 7. Key screens (UX sketch)

### Dashboard
- **Needs attention:** forms overdue / not started  
- **Ready to score:** forms complete  
- **Recent reports**  
- Quick actions: New Client, New Case  

### Client home
- Header: name, age (from DOB), IDs  
- Tabs: **Cases** | **Reports** | **Notes** (notes = mock free text)  
- Empty state CTA: Start first case  

### New case wizard (3–4 steps)
1. Case details  
2. Select assessments/forms (checkbox battery)  
3. Assign raters & delivery per form  
4. Confirm  

### Case workspace (hub)
- Status chip + timeline  
- **Forms table:** form, rater, status, last activity, actions (Share, Open, Score, View report)  
- Side panel: client snapshot, case notes  
- Primary CTAs change by state (Share remaining / Score / Close case)  

### Take assessment (rater)
- Progress bar by section  
- Likert items (5–6 mock items per section × 2–3 sections — enough to feel real, not full instrument)  
- Save progress (mock local state)  
- Submit disabled until required items answered  

### Report viewer
- Header: client, product, date, rater  
- Mock tables: domain scores, interpretive range  
- Narrative paragraphs (lorem + product-appropriate headings)  
- Print / “Download PDF” (print CSS or fake download toast)  

---

## 8. Mock data strategy

- **Static seed JSON** (or TS modules): clients, cases, forms, reports, catalog  
- **In-memory store** (React context or small store) so create/share/complete updates UI without a backend  
- **Reset data** button in a small “Demo” footer for QA  
- Invite links use tokens that map to form IDs in mock store  
- Fake latency (300–800ms) on send/score for realism  

### Sample seed scenarios
1. **Maya R.** — draft case, forms not yet sent  
2. **Jordan K.** — in progress: parent form completed, teacher form pending  
3. **Sam T.** — scored SRS-2 with report available  
4. **Alex P.** — two historical ABAS-3 administrations for progress narrative  

---

## 9. Visual / brand direction

- **Professional clinical**, not consumer flashy  
- Clean neutrals + one restrained accent (teal or deep blue — “trust/clinical”)  
- Accessible typography, high contrast, large click targets for form taking  
- Avoid copying WPS logos/trademarks; use **“Assessment Practice Portal (Demo)”** naming and generic product labels with familiar **abbreviations** for training realism (clear demo disclaimer in footer)  
- Responsive: clinician desktop-first; rater form mobile-friendly  

---

## 10. Suggested tech stack (for when you approve build)

| Choice | Recommendation |
|--------|----------------|
| Framework | **Vite + React + TypeScript** |
| Routing | React Router |
| Styling | CSS modules or Tailwind — simple design system |
| State | React context + mock repository |
| Charts (reports) | Optional lightweight bars (CSS or recharts) |
| Deploy | Static build; no server |

Folder sketch:

```
wps_web_ui/
  PLAN.md          ← this doc
  package.json
  src/
    app/           routes & layout
    features/      clients, cases, forms, reports, rater
    mock/          seed data + store
    components/    UI primitives
    styles/
```

---

## 11. Phased delivery (after approval)

| Phase | Deliverable |
|-------|-------------|
| **P0** | Shell: login, layout, dashboard with seed data |
| **P1** | Clients CRUD (mock) + client home |
| **P2** | New case wizard + case workspace + form statuses |
| **P3** | Share invite + rater portal complete flow |
| **P4** | On-screen complete + mock score + report viewer |
| **P5** | History filters + progress comparison report |
| **P6** | Polish empty states, demo reset, responsive pass |

---

## 12. Success criteria (v1 demo)

A stakeholder can, in under 10 minutes:

1. Log in as clinician  
2. Create a client and open a case with two forms  
3. “Email” one form and open the invite as a rater, complete it  
4. Complete the second form on-screen  
5. Score the case and open a report  
6. Find that report later under client history and global history  

---

## 13. Open decisions for you

Please confirm or adjust:

1. **Naming:** “Assessment Practice Portal (Demo)” vs something else?  
2. **Case language:** Use **Case** (newer hub language) or **Administration** (classic OES)?  
3. **Depth of forms:** Short mock (3 sections) vs longer multi-page feel?  
4. **Clinician-only first** vs ship rater portal in the same milestone? (Plan assumes both.)  
5. **Product set:** Keep the five listed, or prioritize only autism/adaptive (SRS + ABAS)?  

---

## 14. Approval gate

**No code will be written beyond this plan until you approve.**

Reply with:
- **Approve as written**, or  
- **Approve with changes** (list edits), or  
- **Revise** (bigger direction shift).
