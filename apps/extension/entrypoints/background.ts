import type { AnalyzeResponse } from '@ghost/shared';
import { ANALYZE_BASE_URL, ANALYZE_HEADER_KEY, ANALYZE_PATH, DEMO_FIXTURES } from '@ghost/shared';
import type { RpcRequest, RpcResponse } from '@/src/lib/messages.js';
import { getApiKey, pushHistory, readHistory } from '@/src/lib/storage.js';

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener(
    (msg: RpcRequest, _sender, sendResponse: (r: RpcResponse) => void) => {
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
              await pushHistory(fixture.posting, fixture.response);
              sendResponse({ ok: true, data: fixture.response });
              return;
            }
            case 'TEST_KEY': {
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
          sendResponse({ ok: false, error: 'analyze-job request failed' });
        }
      })();
      return true;
    },
  );
});
