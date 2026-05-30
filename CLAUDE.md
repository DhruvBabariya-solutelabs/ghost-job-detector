# Ghost Job Detector

<!-- GSD:project-start source:PROJECT.md -->
## Project

An AI-powered Chrome extension and companion web app that helps job seekers instantly judge whether a job posting on LinkedIn or Indeed is legitimate, low-effort, AI-generated, or an outright ghost/scam listing. The extension reads the visible posting from the page, sends it to a Next.js backend that runs a weighted trust-scoring engine (regex heuristics + LLM via OpenRouter), and surfaces a 0–100 trust score with color-coded risk label and 3–5 plain-English explanations directly inside the job page.

**Core value:** A job seeker scrolling LinkedIn or Indeed sees a trustworthy/suspicious verdict on the listing they are looking at — without leaving the page, without copying text, in under three seconds. If the in-page overlay does not deliver that moment, nothing else matters.

**Constraints:**
- Demo-ready within 72 hours (hackathon judging).
- Single Vercel deploy. Next.js fullstack + Chrome MV3. No Python, no DB, no auth.
- BYOK — user supplies their own OpenRouter API key (default model: `openai/gpt-4o-mini`). Server never persists, never logs the key.
- Only analyze content visible in the user's browser. No scraping behind login walls.

See `.planning/PROJECT.md` for full context, key decisions, and the locked Out-of-Scope list.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

- **Monorepo:** npm 10+ + Turborepo 2.9 (`apps/web`, `apps/extension`, `packages/shared`, `packages/scoring`)
- **Web app:** Next.js 15 App Router + React 19 + TypeScript 5.7+ strict
- **Extension:** WXT 0.20 + `@wxt-dev/module-react` (auto-generates MV3 manifest, HMR for content/SW/options)
- **Styling:** Tailwind v4 with CSS-first `@theme` shared via `packages/shared/theme.css`
- **AI:** OpenAI SDK ^6.37 pointed at OpenRouter (`baseURL: https://openrouter.ai/api/v1`), default model `openai/gpt-4o-mini`, Chat Completions API + Structured Outputs (`strict: true`)
- **Validation:** Zod 3.x in `packages/shared` (single schema validates wire input AND types the engine + UI)
- **Tooling:** Biome 2 (lint + format), no ESLint/Prettier
- **Persistence:** `chrome.storage.local` (extension) + `localStorage` (web). No DB.
- **Deployment:** Vercel (Node runtime, `maxDuration = 30`). Extension is sideloaded only.

**Out of bounds (do not propose):** HuggingFace, FastAPI, Supabase, auth, streaming, CWS submission, Edge runtime, ESLint+Prettier, Plasmo, Nx, Bun, Next 16, Project References, Playwright, NLP libraries (compromise/natural).

See `.planning/research/STACK.md` for full stack rationale and `.planning/research/SUMMARY.md` for the at-a-glance table.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

- TypeScript strict mode with `noUncheckedIndexedAccess`. Type-checking via `npm run typecheck` (tsc --noEmit) is the primary safety net — there is no automated test suite for v1.
- Shared packages (`@ghost/shared`, `@ghost/scoring`) export raw `.ts` and skip a build step. Next.js `transpilePackages` and Vite handle them. Do not add a build step to the shared packages.
- Wire schemas live in `@ghost/shared/contracts.ts` as zod. Never duplicate `AnalyzeRequest` / `AnalyzeResponse` types elsewhere.
- The scoring engine has a uniform `SignalResult { key, ghostiness, confidence, evidence[] }` shape. The aggregator never branches on extractor identity. "No AI key" is handled by weight renormalization across present signals — there is no separate heuristics-only code path.
- The OpenRouter key is read from `x-openrouter-key` request headers only. Never the body, never the query string, never logged. There is intentionally no `OPENROUTER_API_KEY` env fallback on the server.
- DOM extraction uses JSON-LD (`<script type="application/ld+json">`) as the primary path with comma-separated CSS-selector fallbacks. When extraction fails, render a visible "couldn't read this posting" empty state — never silently emit a zero score.
- Tailwind classes inside the extension content script are isolated via a closed Shadow DOM with `adoptedStyleSheets` and a `:host { font-size: 16px }` reset. Do not inject Tailwind into the host page directly.
- Service worker (NOT content script) issues all `fetch` calls. Cross-origin requests from content scripts hit the host page's CORS policy and will fail.
- The `<ScoreDial>` component is duplicated v1 between `apps/extension` and `apps/web`. Refactoring into a shared `packages/ui` is a v2 item — do not factor it out before v1 ships.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

```
ghost-job-detector/
├─ apps/
│  ├─ web/                          # Next.js 15: marketing + /analyze + /dashboard + /install + /api
│  │  └─ src/app/api/analyze-job/route.ts   <-- THE ONLY API ROUTE
│  └─ extension/                    # WXT MV3: content + background + options + popup
│     └─ src/content/adapters/      <-- linkedin.ts, indeed.ts, types.ts (the seam)
└─ packages/
   ├─ shared/                       # framework-free types + zod contracts + design tokens
   │  └─ src/contracts.ts           <-- THE MOST LEVERAGED FILE IN THE REPO
   └─ scoring/                      # pure-TS engine; server-only consumer
      └─ src/index.ts: analyzeJob(posting, { ai }): AnalyzeResponse
```

**Data flow:** content script extracts DOM → message-passes to service worker → service worker `fetch`es `/api/analyze-job` with `x-openrouter-key` header → API route validates body, builds an OpenAI-SDK client pointed at OpenRouter, calls `analyzeJob()` from `@ghost/scoring` → returns JSON → SW relays back → content script renders Shadow-DOM overlay.

**Three load-bearing seams:** the `JobBoardAdapter` interface (Document → JobPosting | null), the uniform `SignalResult` shape, and the aggregator's weight renormalization. See `.planning/research/ARCHITECTURE.md` for the full architecture document.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` — do not edit manually.
<!-- GSD:profile-end -->
