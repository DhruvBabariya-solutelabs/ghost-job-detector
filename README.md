# Ghost Job Detector

AI-powered Chrome extension + Next.js web app that scores LinkedIn and Indeed job postings 0–100 for legitimacy. BYOK OpenAI. No accounts. No tracking.

## What it does

Ghost Job Detector reads the job posting visible in your browser, sends it to a scoring engine that combines regex heuristics and OpenAI analysis, and surfaces a trust score (0–100) with a color-coded verdict and 3–5 plain-English reasons — directly on the page in under three seconds. Four risk bands: **Legitimate** (80–100), **Caution** (50–79), **Suspicious** (20–49), and **Likely Ghost Job** (0–19). Bring your own OpenAI key — the server never stores or logs it.

## Prerequisites

- Node.js 22 LTS (use `nvm use` — `.nvmrc` is present)
- npm 10+
- A Chrome-based browser

## Quick start (development)

```bash
git clone https://github.com/[owner]/ghost-job-detector
cd ghost-job-detector
nvm use
npm install
npm run dev        # boots apps/web on :3000 and apps/extension WXT dev build
```

The extension's WXT dev build outputs to `apps/extension/.output/chrome-mv3/` — load that as an unpacked extension during development.

## Building the extension

```bash
npm run build --workspace=apps/extension
# Output: apps/extension/.output/chrome-mv3/
```

## Installing the extension (sideload)

**Step 1 — Build the extension:** Run `npm run build --workspace=apps/extension` from the repo root. The build output lands in `apps/extension/.output/chrome-mv3/`.

**Step 2 — Open chrome://extensions and turn on Developer mode:** Paste `chrome://extensions` into your address bar. Toggle the "Developer mode" switch in the top-right corner.

**Step 3 — Click "Load unpacked" and select the build folder:** A new button row appears with "Load unpacked". Click it, then select the `apps/extension/.output/chrome-mv3/` folder you just built.

**Step 4 — Pin the icon:** Click the puzzle-piece icon in your Chrome toolbar and pin Ghost Job Detector.

## Adding your OpenAI key

After installing the extension, click the puzzle-piece icon → Ghost Job Detector → Open Options. Paste your OpenAI API key (starts with `sk-`) and click Save. The key is stored only in `chrome.storage.local` on your device.

Optional: also enter the key in the web app at `/settings` (gear icon in the top-right) for the `/analyze` page.

## Vercel deployment

The web app (including the `/api/analyze-job` route) deploys as a single Vercel project:

1. Import the repo at [vercel.com/new](https://vercel.com/new). Select the `apps/web` directory as the root.
2. No environment variables are required. There is no `OPENAI_API_KEY` server-side fallback by design (see `.env.example`).
3. Deploy. The API route runs on the Node.js runtime with `maxDuration = 30`.

## Running the full stack locally

```bash
npm run dev           # Next.js on :3000, WXT dev build (reloads on file changes)
npm run typecheck     # tsc --noEmit across all 4 workspaces
npm run lint          # Biome lint + format check
```

## Project structure

```
ghost-job-detector/
├─ apps/web/          # Next.js 15 App Router: landing + /analyze + /dashboard + /install + /api
├─ apps/extension/    # WXT MV3: content script + service worker + popup + options
├─ packages/shared/   # Zod contracts + risk bands + design tokens + demo fixtures
└─ packages/scoring/  # Pure-TS scoring engine (5 signals + aggregator + labeler)
```

## Privacy

The extension sends job title, company, location, and description to the API route. Your OpenAI key is never logged server-side. No accounts, no tracking, no cross-device sync. See the extension's Options page for the full privacy disclosure.
