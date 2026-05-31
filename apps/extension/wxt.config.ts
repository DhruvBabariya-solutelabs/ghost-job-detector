import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

/**
 * WXT 0.20 config — Phase 4 (Extension Shell + Adapters + Shadow-DOM Overlay).
 *
 * Phase 4 expansions over Phase 1:
 * - `manifest.host_permissions`: LinkedIn + Indeed (content-script targets),
 *   OpenRouter API (D-51 Test Key SW fetch — 2026-05 OpenAI→OpenRouter switch),
 *   Vercel deployment placeholder (Phase 6 will set the real domain; placeholder
 *   lives here to avoid manifest churn). Phase 4 RESEARCH §"Pitfall 8" —
 *   host_permissions is what governs cross-origin SW fetches;
 *   content_scripts.matches governs auto-injection and is declared inline in
 *   entrypoints/content.ts per WXT convention.
 * - `manifest.options_ui.open_in_tab: true` — BYOK options page opens as a
 *   full tab (UI-SPEC §"Options page" layout requires 560px max-width).
 * - `manifest.permissions: ['storage']` UNCHANGED — chrome.storage.local
 *   for BYOK key + last-50 history (D-13 / EXT-13).
 *
 * The MV3 manifest is auto-generated. WXT auto-resolves:
 * - background.service_worker from entrypoints/background.ts (Plan 04-05)
 * - action.default_popup from entrypoints/popup/ (Plan 04-08)
 * - options_ui.page from entrypoints/options/ (Plan 04-08)
 * - content_scripts entries from entrypoints/content.ts defineContentScript matches (Plan 04-06)
 *
 * DO NOT add <all_urls> anywhere. DO NOT add browsing_data, identity, cookies,
 * or any permission not listed below — manifest minimization is a security
 * invariant per RESEARCH.md §"Security Domain" V14 Configuration.
 */
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Ghost Job Detector',
    description:
      'AI-powered trust-scoring overlay for LinkedIn and Indeed job postings. BYOK OpenRouter key required for AI signals.',
    permissions: ['storage'],
    host_permissions: [
      'https://*.linkedin.com/*',
      'https://*.indeed.com/*',
      'https://openrouter.ai/*',
      'https://ghost-job-detector.vercel.app/*',
      'http://localhost:3000/*',
    ],
    options_ui: {
      open_in_tab: true,
    },
  },
  // Push WXT's internal Vite dev server off port 3000 so it does not collide
  // with `apps/web`'s `next dev --port 3000` when both run under `turbo dev`.
  // Phase 1 D-Discovery — keep.
  dev: { server: { port: 3001 } },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
