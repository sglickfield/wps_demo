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

- **Demo session** — loads `public/samples/speech-therapy-session.wav` (two-voice speech-language sample), diarizes Therapist vs Client, runs vocabulary + engagement analysis entirely in the browser (Web Audio), saves to the client.
- **Live mic** — Web Speech API (Chrome/Edge) with manual speaker toggle, then same metrics.
- **Upload** — energy-based talk-spurt segmentation + alternating speaker labels (vocab limited without a transcript).

Seed data includes a sample session for **Maya Rivera** (`cli-maya`).

All processing is client-side; no audio is uploaded to a server.

## Stack

Vite · React 19 · TypeScript · React Router · in-memory mock store
