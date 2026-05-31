/**
 * Service worker — Phase 4 message router.
 *
 * All cross-origin fetch() calls live here (PITFALLS "Cross-Origin Fetches").
 * Content scripts NEVER fetch — they send messages via chrome.runtime.sendMessage
 * and the SW relays.
 *
 * Stateless: every handler re-reads via the storage gateway (gjd:history,
 * gjd:apiKey). No module-level globals. MV3 30s idle timeout cannot bite.
 *
 * 2026-05 — BYOK provider is OpenRouter; TEST_KEY verifies against
 * openrouter.ai/api/v1/models. The ANALYZE flow is unchanged (header name
 * is centralized in @ghost/shared/ANALYZE_HEADER_KEY).
 */

import { ANALYZE_BASE_URL, ANALYZE_HEADER_KEY, ANALYZE_PATH, DEMO_FIXTURES } from '@ghost/shared';
import type { AnalyzeResponse } from '@ghost/shared';
import type { RpcRequest, RpcResponse } from '@/src/lib/messages.js';
import { getApiKey, pushHistory, readHistory } from '@/src/lib/storage.js';


export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((msg: RpcRequest, _sender, sendResponse: (r: RpcResponse) => void) => {
    (async () => {
      try {
        switch (msg.type) {
          case 'ANALYZE': {
            const key = (await getApiKey()) ?? '';
            const apiRes = await fetch(`${ANALYZE_BASE_URL}${ANALYZE_PATH}`, {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                [ANALYZE_HEADER_KEY]: key,
              },
              body: JSON.stringify(msg.payload),
            });
            if (!apiRes.ok) {
              sendResponse({ ok: false, error: `analyze-job HTTP ${apiRes.status}` });
              return;
            }
            const response = (await apiRes.json()) as AnalyzeResponse;
            await pushHistory(msg.payload, response);
            sendResponse({ ok: true, data: response });
            return;
          }
          case 'LOAD_DEMO': {
            const fixture = DEMO_FIXTURES.find((f) => f.band === msg.band);
            if (!fixture) {
              sendResponse({ ok: false, error: `no fixture for band: ${msg.band}` });
              return;
            }
            // D-55: demo entries written to history; meta.usedAi/meta.model already
            // 'demo-fixture' per the fixture authoring contract in Plan 04-01.
            await pushHistory(fixture.posting, fixture.response);
            sendResponse({ ok: true, data: fixture.response });
            return;
          }
          case 'TEST_KEY': {
            // D-51: live verification call from SW (not options page).
            // BYOK key NEVER logged. Auth header sanitized via .trim() at the SDK boundary.
            // 2026-05: verifies against OpenRouter, not OpenAI directly.
            const r = await fetch('https://openrouter.ai/api/v1/auth/key', {
              method: 'GET',
              headers: { Authorization: `Bearer ${msg.payload.trim()}` },
            });
            if (r.ok) {
              sendResponse({ ok: true });
            } else if (r.status === 401) {
              sendResponse({ ok: false, reason: 'invalid' });
            } else if (r.status === 429) {
              sendResponse({ ok: false, reason: 'rate_limit' });
            } else {
              sendResponse({ ok: false, reason: 'network' });
            }
            return;
          }
          case 'GET_HISTORY': {
            const history = await readHistory();
            sendResponse({ ok: true, history });
            return;
          }
        }
      } catch {
        // Static message only — never serialize err.message; the OpenAI SDK embeds
        // request headers (including BYOK key) in APIError.message (CR-01 / API-02 parity
        // with route.ts catch block). Same applies for OpenRouter (compatible SDK).
        sendResponse({ ok: false, error: 'analyze-job request failed' });
      }
    })();
    // CRITICAL: return true so Chrome holds the message channel open for the
    // async response. Without this, the channel closes synchronously and the
    // content script sees `undefined` — RESEARCH Pitfall 3.
    return true;
  });
});

