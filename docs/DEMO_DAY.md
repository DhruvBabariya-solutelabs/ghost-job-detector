# Ghost Job Detector — Demo Day Guide

## Pre-flight checklist

Run this checklist 30 minutes before the demo.

1. **Extension sideloaded** — verify the puzzle-piece icon shows Ghost Job Detector in the toolbar.
2. **OpenAI key entered** — open extension Options, confirm key is saved and "Test key" shows "Key works".
3. **Sample analyzed once** — open a LinkedIn job, wait for the overlay to appear (warm the cache). Confirm score + risk label + 3-5 reasons render within 3 seconds.
4. **Hotspot connected** — if using venue Wi-Fi is risky, connect phone hotspot and confirm the overlay still loads.
5. **Dedicated demo Chrome profile** — open the known demo LinkedIn job URL in a clean profile pre-warmed 30 minutes before the demo.
6. **Backup: web app open** — have `https://[your-vercel-url]/analyze` open in a backup tab with the demo posting already in the textarea.
7. **Frozen dist.zip on hand** — have a local copy of `apps/extension/.output/chrome-mv3/` zipped as `dist.zip` on your desktop. If the extension gets corrupted, re-sideload in 30 seconds.
8. **Demo posting URLs confirmed** — paste and confirm the 2 demo LinkedIn job URLs (one FAANG-style, one ghost-style) load and show overlay. Note the scores.

## 7-step demo storyboard

**Step 1 — Open the web app landing page.**
Show the hero section with the animated ScoreDial cycling through the four risk bands. Click each band button (Legitimate → Caution → Suspicious → Ghost). The dial re-animates to 87, 64, 32, 12. Say: "This shows the four verdict bands — from trusted postings down to likely ghost jobs."

**Step 2 — Show the extension on a real LinkedIn job (FAANG-style).**
Navigate to the pre-selected FAANG-style job URL. The overlay appears within 3 seconds. Score should be 80+, Legitimate band, green color, 3-5 reasons including a salary/tech-stack green flag. Say: "Real postings from Stripe or Google score above 80 — here's why."

**Step 3 — Show the extension on a ghost job.**
Navigate to the pre-selected ghost job URL (or load demo fixture: click popup → Demo: load sample → Ghost). Score 0–19, Likely Ghost Job band, red color. Show the quoted-evidence reasons. Say: "This posting has zero specifics, urgent language, and a WhatsApp contact — classic ghost."

**Step 4 — Expand the signal breakdown drawer.**
Click the ScoreDial. The drawer slides open showing 5 weighted bars: AI 30%, Specificity 25%, Buzzwords 20%, Scam 15%, LLM 10%. Say: "Five signals, each with a weighted contribution — not a black box."

**Step 5 — Show the zero-network demo safety net (extension popup).**
Click the extension puzzle-piece icon. Show the popup. Click any of the 4 band chips. The overlay on the active tab renders the pre-baked fixture instantly — no network call, no OpenAI key required. Say: "If Wi-Fi dies, the demo doesn't die."

**Step 6 — Show the /analyze fallback on the web app.**
Switch to the backup tab (`https://[vercel-url]/analyze`). Paste the ghost job posting text. Click Analyze. The same trust score, same breakdown, same reasons appear — same API, different surface. Say: "Everything the extension does, the web app does too — useful if you find a job posting outside LinkedIn."

**Step 7 — Show the /install page.**
Navigate to `/install`. Show the 4-step sideload instructions. Say: "Two minutes to install. No Chrome Web Store review. No waiting."

## Fallback script

- If the extension overlay fails to render: use the popup Demo chips (Step 5 above).
- If the API is down: the extension falls back to heuristics-only scoring automatically (no error shown to the judge).
- If everything fails: `/analyze` + pasted text always works.
