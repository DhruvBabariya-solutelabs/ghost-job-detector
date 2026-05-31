# Ghost Job Detector

AI-powered Chrome extension + Next.js web app that scores LinkedIn and Indeed job postings **0–100** for legitimacy — directly on the page, in under three seconds. Bring your own OpenRouter key. No accounts. No tracking. No database.

---

## What it does

Ghost Job Detector reads the job posting visible in your browser, sends it to a scoring engine that combines **regex heuristics** with **LLM analysis** (via OpenRouter), and surfaces a trust score with a color-coded verdict and 3–5 plain-English reasons — rendered in an isolated overlay on top of the posting.

**Four risk bands:**

| Band | Score | Meaning |
|------|-------|---------|
| 🟢 **Legitimate** | 80–100 | Specific, well-formed, human-written posting |
| 🟡 **Caution** | 50–79 | Some weak signals; read carefully |
| 🟠 **Suspicious** | 20–49 | Multiple red flags |
| 🔴 **Likely Ghost Job** | 0–19 | Strong scam / ghost / AI-spam signals |

The engine blends several **regex signals** (buzzword density, specificity, scam patterns, recruiter "lift-quote" phrasing) with **LLM-backed signals** (AI-generated-text detection and an LLM legitimacy evaluation). It runs on a uniform `SignalResult` shape and a weight-renormalizing aggregator — when no API key is supplied, the LLM signals drop out and weights renormalize across the remaining heuristics. There is no separate "heuristics-only" code path.

> **BYOK & privacy:** You supply your own [OpenRouter](https://openrouter.ai/keys) key. The server reads it from the `x-openrouter-key` request header only — never from the body, query string, or an env var, and it is **never stored or logged**.

---

## Prerequisites

- **Node.js 22 LTS** (`.nvmrc` is present — run `nvm use`)
- **npm 10+**
- A **Chromium-based browser** (Chrome, Edge, Brave, …)
- An **OpenRouter API key** — free to create at [openrouter.ai/keys](https://openrouter.ai/keys) (format: `sk-or-v1-…`). Default model: `openai/gpt-4o-mini`.

---

## Quick start (development)

```bash
git clone https://github.com/DhruvBabariya-solutelabs/ghost-job-detector.git
cd ghost-job-detector
nvm use            # selects Node 22 from .nvmrc
npm install        # installs all workspaces
npm run dev        # Next.js web app on :3000 + WXT extension dev build (HMR)
```

`npm run dev` runs both workspaces via Turborepo:

- **Web app** → http://localhost:3000
- **Extension** → WXT writes a live-reloading dev build to `apps/extension/.output/chrome-mv3/`

Load that `chrome-mv3/` folder as an unpacked extension (see [Installing the extension](#installing-the-extension-sideload)).

---

## Installing the extension (sideload)

**1. Build the extension**

```bash
npm run build --workspace=apps/extension
# Output → apps/extension/.output/chrome-mv3/
```

(During development you can skip this and use the `npm run dev` output instead.)

**2. Open the extensions page and enable Developer mode**

Paste `chrome://extensions` into your address bar, then toggle **Developer mode** (top-right).

**3. Load unpacked**

Click **Load unpacked** and select the `apps/extension/.output/chrome-mv3/` folder.

**4. Pin it**

Click the puzzle-piece icon in the toolbar and pin **Ghost Job Detector**.

---

## Adding your OpenRouter key

The extension needs your key to run the LLM signals (heuristic-only scoring works without it, but is less accurate).

1. Click the puzzle-piece icon → **Ghost Job Detector** → **Open Options**.
2. Paste your OpenRouter key (`sk-or-v1-…`) and click **Save**.
3. Optionally click **Test key** — it makes one direct call to `openrouter.ai/api/v1/auth/key` to confirm the key works.

Your key is stored only in `chrome.storage.local` on your device. Get a key at [openrouter.ai/keys](https://openrouter.ai/keys).

**Web app:** the `/analyze` page uses the same BYOK model. Open the **gear icon** (Settings) in the top bar, paste your key, and Save — it's stored in `localStorage` in that browser.

---

## Using it

- **Extension:** navigate to any LinkedIn job (`linkedin.com/jobs/*`) or Indeed posting (`indeed.com/*`). The overlay appears automatically and re-scores as you navigate between listings. If a posting can't be read, you'll see a "couldn't read this posting" empty state rather than a misleading zero score.
- **Web app:** open http://localhost:3000/analyze, paste a posting's text, and analyze it manually — no extension required.

---

## Running the full stack locally

```bash
npm run dev          # Next.js (:3000) + WXT extension dev build, both with HMR
npm run build        # Production build of every workspace
npm run typecheck    # tsc --noEmit across all workspaces (the primary safety net)
npm run lint         # Biome lint
npm run format       # Biome format --write
```

> There is **no automated test suite** for v1 — `npm run typecheck` is the primary correctness gate (TypeScript strict mode + `noUncheckedIndexedAccess`).

### Optional: scoring-engine calibration

The scoring package ships a calibration harness. It is the **only** place an env var is used, and it never ships to production:

```bash
# Requires an OpenRouter key in OPENROUTER_API_KEY_EVAL (local only — never deploy this)
OPENROUTER_API_KEY_EVAL=sk-or-v1-... npm run calibrate --workspace=@ghost/scoring
```

---

## Vercel deployment

The web app — including the single `/api/analyze-job` route — deploys as one Vercel project.

1. Import the repo at [vercel.com/new](https://vercel.com/new) and set the project **root directory** to `apps/web`.
2. **No environment variables are required.** There is intentionally no `OPENROUTER_API_KEY` server-side fallback — BYOK by design (see `.env.example`).
3. Deploy. The API route runs on the **Node.js runtime** with `maxDuration = 30`. CORS is wildcard (`*`) so the sideloaded extension can call it.

> The web `prebuild` step runs `scripts/prepare-extension.mjs`, which bundles the extension `.zip` served by the `/install` page.

---

## Project structure

```
ghost-job-detector/
├─ apps/
│  ├─ web/          # Next.js 15 App Router — landing + /analyze + /dashboard + /install + /api
│  │  └─ src/app/api/analyze-job/route.ts   ← THE ONLY API ROUTE
│  └─ extension/    # WXT MV3 — content script + service worker + popup + options
│     └─ src/content/adapters/              ← linkedin.ts, indeed.ts (the extraction seam)
└─ packages/
   ├─ shared/       # Framework-free zod contracts + risk bands + design tokens + fixtures
   │  └─ src/contracts.ts                   ← wire schema, single source of truth
   └─ scoring/      # Pure-TS engine — extractors + weight-renormalizing aggregator + labeler
      └─ src/index.ts: analyzeJob(posting, { ai })
```

**Data flow:** content script extracts the posting (JSON-LD first, CSS-selector fallback) → message-passes to the service worker → SW `fetch`es `/api/analyze-job` with the `x-openrouter-key` header → the route validates the body with zod, builds an OpenAI-SDK client pointed at OpenRouter, and calls `analyzeJob()` → returns JSON → SW relays it back → content script renders the Shadow-DOM overlay.

### Tech stack

- **Monorepo:** npm workspaces + Turborepo 2.9
- **Web:** Next.js 15 (App Router) + React 19 + TypeScript 5.7 strict
- **Extension:** WXT 0.20 + `@wxt-dev/module-react` (auto-generates the MV3 manifest)
- **Styling:** Tailwind v4 (CSS-first `@theme`), shared via `packages/shared`
- **AI:** OpenAI SDK pointed at OpenRouter (`baseURL: https://openrouter.ai/api/v1`), Chat Completions + Structured Outputs
- **Validation:** Zod (one schema validates the wire input and types the engine + UI)
- **Tooling:** Biome 2 (lint + format)
- **Persistence:** `chrome.storage.local` (extension) + `localStorage` (web). No database, no auth.

---

## Privacy

The extension sends only the **job title, company, location, and description** visible on the page to the API route — it never scrapes behind login walls. Your OpenRouter key is sent in a request header and is **never logged or stored server-side**. No accounts, no analytics, no cross-device sync. The full disclosure lives on the extension's Options page.
