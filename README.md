# Assessment Practice Portal (Demo)

Mock clinician + rater web UI inspired by [WPS](https://www.wpspublish.com) online evaluation workflows (create client → open case → assign/share forms → complete → score → history).

**Not affiliated with WPS®. Not for clinical use.** All data and scores are simulated.

See [PLAN.md](./PLAN.md) for product design.

## Run

```bash
cd Claude/wps_web_ui
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Demo login

- Email: `avery.chen@demo-practice.org`
- Password: `demo`

### Try the main flows

1. **Dashboard** — pending forms & ready-to-score cases  
2. **Clients → New client → New case** — wizard for battery + raters  
3. **Case workspace → Share** — mock email; copy/open invite link  
4. **Rater portal** — complete Likert sections, submit  
5. **On-screen** — complete a form in-session  
6. **Score case** — generate mock report  
7. **History** — find past cases/reports  
8. **Session analytics** — browser-side two-speaker language sample (Therapist / Client), client vocabulary (TTR, MLU) & engagement  

**Reset demo** in the sidebar restores seed data.

### Session recording analytics

Route: `/session-analytics?clientId=<id>` (sidebar **Session analytics**).

Analyses are **required to be tied to a client record** and are listed on that client’s home page.

Open a client-linked sample session to play the recording, view the diarized Therapist/Client transcript, and review vocabulary + engagement metrics (all in-browser).

Seed data includes **3 language-sample sessions per client** (12 total), each with:

| Client | Client voice | Therapist voice | Profile-aligned pattern |
|--------|--------------|-----------------|-------------------------|
| Maya Rivera | Junior | Samantha | Emerging social language (referral) |
| Jordan Kim | Fred | Samantha | Mild–moderate / fuller narratives |
| Sam Torres | Kathy | Samantha | Elevated social-communication strain |
| Alex Patel | Albert | Samantha | Adaptive progress (baseline → stronger) |

Each client’s session page shows **only that client’s** recordings.

All processing is client-side; no audio is uploaded to a server.

## Stack

Vite · React 19 · TypeScript · React Router · in-memory mock store
