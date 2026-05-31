/**
 * Options page — BYOK OpenRouter key paste + Save + Test Key + Privacy disclosure.
 *
 * 2026-05 — BYOK provider switched from OpenAI to OpenRouter. Same UI contract,
 * different key format (`sk-or-v1-...`) and verification endpoint
 * (https://openrouter.ai/api/v1/auth/key).
 *
 * Trust-moment surface (EXT-11 / EXT-12 / EXT-16):
 *   - EXT-11: input type="password" + show/hide eye-glyph toggle.
 *   - EXT-12: Test Key button validates the SAVED value (NOT the unsaved input)
 *     against openrouter.ai via the SW's TEST_KEY handler. D-52 + Pitfall 6.
 *   - EXT-16: Three-paragraph privacy disclosure rendered with provider-neutral
 *     copy — paraphrase = trust violation.
 *
 * Storage goes through the lib/storage.ts gateway (getApiKey/setApiKey) —
 * the same module also applies D-51 quote+whitespace sanitization at write.
 *
 * Security gates (verified by grep acceptance criteria):
 *   - No console.log/warn/error/debug/info anywhere — BYOK key NEVER logged.
 *   - No direct chrome.storage.local access — gateway invariant.
 *   - No lucide-react import — EyeIcon/EyeOffIcon are inline SVG glyphs.
 *   - TEST_KEY message payload is `savedKey` (NOT `input`/`trimmedInput`) per
 *     D-52 + Pitfall 6.
 */

import { useEffect, useState } from 'react';
import { getApiKey, setApiKey } from '@/src/lib/storage';
import type { RpcResponse } from '@/src/lib/messages';

type TestKeyStatus =
  | { kind: 'idle' }
  | { kind: 'testing' }
  | { kind: 'success' }
  | { kind: 'invalid' }
  | { kind: 'rate_limit' }
  | { kind: 'network' };

type SaveStatus = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' };

// OpenRouter keys are `sk-or-v1-<hex>`. Used informationally — does NOT block save.
const KEY_REGEX = /^sk-or-v1-[A-Za-z0-9_-]{20,}$/;

export function App() {
  const [input, setInput] = useState('');
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [testStatus, setTestStatus] = useState<TestKeyStatus>({ kind: 'idle' });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ kind: 'idle' });

  useEffect(() => {
    void getApiKey().then((k) => {
      setSavedKey(k);
      if (k !== null) setInput(k);
    });
  }, []);

  const trimmedInput = input.trim().replace(/^["']|["']$/g, '');
  const isFormatOk = KEY_REGEX.test(trimmedInput);
  const hasUnsavedChange = trimmedInput !== (savedKey ?? '');
  const saveDisabled = !hasUnsavedChange || trimmedInput.length === 0;
  const testDisabled = savedKey === null || hasUnsavedChange || testStatus.kind === 'testing';

  const handleBlur = (): void => {
    if (input !== trimmedInput) setInput(trimmedInput);
    if (revealed) setRevealed(false);
  };

  const handleSave = async (): Promise<void> => {
    setSaveStatus({ kind: 'saving' });
    await setApiKey(trimmedInput);
    setSavedKey(trimmedInput);
    setSaveStatus({ kind: 'saved' });
    setTimeout(() => setSaveStatus({ kind: 'idle' }), 3000);
  };

  const handleTest = async (): Promise<void> => {
    if (savedKey === null) return;
    setTestStatus({ kind: 'testing' });
    const res = (await chrome.runtime.sendMessage({
      type: 'TEST_KEY',
      payload: savedKey,
    })) as RpcResponse;
    if (res.ok) {
      setTestStatus({ kind: 'success' });
      setTimeout(() => setTestStatus({ kind: 'idle' }), 4000);
    } else if ('reason' in res) {
      setTestStatus({ kind: res.reason });
    } else {
      setTestStatus({ kind: 'network' });
    }
  };

  return (
    <main className="mx-auto max-w-[560px] px-4 py-8 bg-(--color-surface) text-(--color-ink) font-sans min-h-screen">
      <h1 className="text-xl font-semibold">Ghost Job Detector — Options</h1>

      <section className="mt-6">
        <h2 className="text-sm font-semibold">OpenRouter API key</h2>
        <p className="text-xs text-(--color-ink-muted) mt-1">
          Get a key at{' '}
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener"
            className="text-(--color-brand) underline"
          >
            openrouter.ai/keys
          </a>{' '}
          — pay-as-you-go, no minimums.
        </p>
        <label htmlFor="gjd-key-input" className="block text-sm font-semibold mt-3 mb-1">
          Your key
        </label>
        <div className="relative">
          <input
            id="gjd-key-input"
            type={revealed ? 'text' : 'password'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onBlur={handleBlur}
            placeholder="sk-or-v1-..."
            autoComplete="off"
            spellCheck={false}
            className="w-full h-10 px-3 pr-10 py-2 bg-(--color-surface) text-(--color-ink) border border-(--color-border) rounded-sm text-sm placeholder:text-(--color-ink-muted) focus:outline-none focus:border-(--color-brand) focus:shadow-(--ring-focus)"
          />
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? 'Hide key' : 'Show key'}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center rounded-sm text-(--color-ink-muted) hover:text-(--color-ink) focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[oklch(0.55_0.18_260/0.4)]"
          >
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        <p className="text-xs text-(--color-ink-muted) mt-2">
          Used only for AI-powered signals (authenticity + AI-generated-text detection). Stored
          locally in this browser. Never sent to our servers.
        </p>
        {!isFormatOk && trimmedInput.length > 0 && (
          <p className="text-xs text-(--color-ink-muted) mt-1">
            This doesn't look like a standard OpenRouter key (sk-or-v1-…). Testing anyway will hit the API.
          </p>
        )}
        <div className="mt-2 flex gap-2 items-center">
          <button
            type="button"
            onClick={() => {
              void handleSave();
            }}
            disabled={saveDisabled || saveStatus.kind === 'saving'}
            className="px-4 py-2 text-sm font-semibold rounded-sm bg-(--color-brand) text-(--color-surface) hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[oklch(0.55_0.18_260/0.4)]"
          >
            {saveStatus.kind === 'saving' ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleTest();
            }}
            disabled={testDisabled}
            title={
              hasUnsavedChange && savedKey !== null
                ? 'Save your key first'
                : savedKey === null
                  ? 'Save a key first'
                  : ''
            }
            className="px-4 py-2 text-sm font-semibold rounded-sm bg-transparent text-(--color-ink) border border-(--color-border) hover:bg-(--color-surface-subtle) disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[oklch(0.55_0.18_260/0.4)]"
          >
            {testStatus.kind === 'testing' ? 'Testing…' : 'Test key'}
          </button>
          {saveStatus.kind === 'saved' && (
            <span className="text-xs text-(--color-ink-muted) ml-2">Saved.</span>
          )}
        </div>
        {testStatus.kind === 'success' && (
          <div
            className="mt-2 inline-block px-2 py-1 rounded-sm text-xs font-medium"
            style={{
              backgroundColor: 'color-mix(in oklch, #16a34a 12%, transparent)',
              color: '#15803d',
            }}
          >
            Key works ✓
          </div>
        )}
        {testStatus.kind === 'invalid' && (
          <div
            className="mt-2 inline-block px-2 py-1 rounded-sm text-xs font-medium"
            style={{
              backgroundColor: 'color-mix(in oklch, #dc2626 12%, transparent)',
              color: '#b91c1c',
            }}
          >
            That key isn't valid. Double-check it starts with sk-or-v1- and you copied the whole thing.
          </div>
        )}
        {testStatus.kind === 'rate_limit' && (
          <div
            className="mt-2 inline-block px-2 py-1 rounded-sm text-xs font-medium"
            style={{
              backgroundColor: 'color-mix(in oklch, #ca8a04 12%, transparent)',
              color: '#a16207',
            }}
          >
            Rate-limited by OpenRouter. Wait a minute and try again.
          </div>
        )}
        {testStatus.kind === 'network' && (
          <div
            className="mt-2 inline-block px-2 py-1 rounded-sm text-xs font-medium"
            style={{
              backgroundColor: 'color-mix(in oklch, #ca8a04 12%, transparent)',
              color: '#a16207',
            }}
          >
            Couldn't reach OpenRouter. Check your internet, then try again.
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold">Privacy &amp; data</h2>
        <div className="mt-2 p-4 bg-(--color-surface-subtle) rounded-md space-y-3 text-sm">
          <div>
            <p className="font-semibold">What gets sent</p>
            <p>
              When you analyze a job, this extension sends the title, company, location, and
              description text to ghost-job-detector.vercel.app. We never send the URL of the page
              you're on, and we never log your OpenRouter key.
            </p>
          </div>
          <div>
            <p className="font-semibold">Where your key lives</p>
            <p>
              Your OpenRouter key is stored in <code>chrome.storage.local</code> on this device
              only. It never leaves your browser except for the one direct call to
              openrouter.ai/api/v1/auth/key to verify it works (the "Test key" button) and the
              per-analysis calls when you view a job.
            </p>
          </div>
          <div>
            <p className="font-semibold">What we don't do</p>
            <p>
              No accounts. No tracking. No analytics. No cross-device sync. No selling anything. If
              you uninstall the extension, your key and history are gone.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

// Inline SVG glyphs — UI-SPEC line 29 forbids lucide-react. Static JSX, no
// dangerouslySetInnerHTML, so React's escaping defends against any XSS attempt
// even though these are author-controlled (T-04-54 mitigation).
function EyeIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 2l12 12" />
      <path d="M6.5 6.5a2 2 0 0 0 2.8 2.8" />
      <path d="M3.5 4.5C2 5.8 1 8 1 8s2.5 5 7 5c1.4 0 2.6-.5 3.6-1.2" />
      <path d="M7 3.1c.3 0 .7-.1 1-.1 4.5 0 7 5 7 5s-.6 1.2-1.8 2.4" />
    </svg>
  );
}
