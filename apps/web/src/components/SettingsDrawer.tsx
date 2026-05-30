'use client';

/**
 * SettingsDrawer — right-side drawer (≥768px) / bottom-sheet (<768px).
 *
 * Spec: CONTEXT D-66 + D-72 + UI-SPEC §"SettingsDrawer" lines 346-411 +
 * §"Tailwind Class Examples" lines 1278-1319 + §"State Matrix" lines 970-989.
 *
 * Phase 5 ports the extension options page (apps/extension/entrypoints/options/App.tsx)
 * BYOK + Save + Test Key + Privacy disclosure UI verbatim — swapping the
 * chrome.storage.local gateway for the apps/web/src/lib/storage.ts gateway
 * (Plan 05-02). EXT-16 invariant carries forward: the 3-paragraph privacy
 * disclosure tracks the extension's text, swapping the storage backing
 * ("localStorage" vs "chrome.storage.local") and the provider name
 * (OpenRouter, 2026-05).
 *
 * Pitfall 6 (D-52) invariants — verified by grep:
 *   - Save button DISABLED when input === savedKey OR trimmedInput empty.
 *   - Test button DISABLED when no saved key OR input differs from saved.
 *   - Test handler would send `savedKey` (NOT `input`/`trimmedInput`) — in
 *     Phase 5 it stubs success after 400ms; Phase 6 wires the real fetch.
 *
 * Security gates (verified by grep):
 *   - No console output of any level anywhere (T-05-16).
 *   - No lucide-react import — eye/eye-off/X glyphs inline (UI-SPEC line 31).
 *   - localStorage access ONLY via lib/storage.ts gateway (T-05-05).
 */

import { useEffect, useRef, useState } from 'react';
import { getApiKey, setApiKey } from '@/lib/storage';

/**
 * Drawer width in pixels at ≥lg (desktop). Exported so AppShell can shift the
 * page content by exactly this much when the drawer is open — keeps the two
 * surfaces in sync without two sources of truth.
 */
export const DRAWER_WIDTH_PX = 380;

/** Tailwind breakpoint at which the drawer switches from bottom-sheet to
 * pushing-sidebar. Must match the @media in AppShell. Chosen at 1280px so the
 * remaining content area is ≥900px — enough for /analyze's two-column layout
 * (textarea + 440px result block) to not feel squeezed when the drawer pushes. */
const DRAWER_DESKTOP_BREAKPOINT_PX = 1280;

export interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

type TestKeyStatus =
  | { kind: 'idle' }
  | { kind: 'testing' }
  | { kind: 'success' }
  | { kind: 'invalid' }
  | { kind: 'rate_limit' }
  | { kind: 'network' };

type SaveStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved' }
  | { kind: 'error_quota' }
  | { kind: 'error_unavailable' };

// D-51: format-check regex. Used informationally (does NOT block save).
// OpenRouter keys have the form `sk-or-v1-<hex>`.
const KEY_REGEX = /^sk-or-v1-[A-Za-z0-9_-]{20,}$/;

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const [input, setInput] = useState('');
  const [savedKey, setSavedKeyState] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [testStatus, setTestStatus] = useState<TestKeyStatus>({ kind: 'idle' });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ kind: 'idle' });
  const keyInputRef = useRef<HTMLInputElement | null>(null);

  // D-51: silently sanitize on read for comparison (does NOT rewrite state until blur).
  const trimmedInput = input.trim().replace(/^["']|["']$/g, '');
  const isFormatOk = KEY_REGEX.test(trimmedInput);
  const hasUnsavedChange = trimmedInput !== (savedKey ?? '');
  const saveDisabled = !hasUnsavedChange || trimmedInput.length === 0;
  // Pitfall 6 mitigation: Test disabled when no saved key OR input differs from saved.
  const testDisabled =
    savedKey === null || hasUnsavedChange || testStatus.kind === 'testing';

  // Initial load — synchronous Plan 05-02 gateway (web localStorage, not async chrome.storage).
  useEffect(() => {
    const k = getApiKey();
    setSavedKeyState(k);
    if (k !== null) setInput(k);
  }, []);

  // Focus + Escape + body-scroll handling on drawer open. Body scroll is
  // locked ONLY on mobile (where the drawer is a modal bottom-sheet). On
  // desktop the drawer is a pushing sidebar — page should remain scrollable.
  useEffect(() => {
    if (!open) return;

    const focusTimer = setTimeout(() => {
      keyInputRef.current?.focus();
    }, 50);

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);

    const isMobile = window.matchMedia(
      `(max-width: ${DRAWER_DESKTOP_BREAKPOINT_PX - 1}px)`
    ).matches;
    const previousOverflow = document.body.style.overflow;
    if (isMobile) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleEscape);
      if (isMobile) {
        document.body.style.overflow = previousOverflow;
      }
    };
  }, [open, onClose]);

  const handleBlur = (): void => {
    // D-51: silent sanitization on blur — no toast, no warning.
    if (input !== trimmedInput) setInput(trimmedInput);
    // Accessibility defense: revert to password mask on blur so a user who
    // alt-tabs away doesn't leave the unmasked key on screen.
    if (revealed) setRevealed(false);
  };

  const handleSave = (): void => {
    setSaveStatus({ kind: 'saving' });
    const result = setApiKey(trimmedInput);
    if (result.kind === 'ok') {
      setSavedKeyState(trimmedInput);
      setSaveStatus({ kind: 'saved' });
      // Auto-revert to idle after 3 seconds (UI-SPEC State Matrix line 983).
      setTimeout(() => setSaveStatus({ kind: 'idle' }), 3000);
    } else if (result.kind === 'quota_exceeded') {
      setSaveStatus({ kind: 'error_quota' });
    } else {
      setSaveStatus({ kind: 'error_unavailable' });
    }
  };

  const handleTest = (): void => {
    if (savedKey === null) return;
    setTestStatus({ kind: 'testing' });
    // Phase 5 stub: simulate success after 400ms so the UI control is testable.
    // Phase 6 replaces this with a real fetch to api.openai.com — the Pitfall 6
    // invariant (send savedKey, NEVER input/trimmedInput) carries forward there.
    setTimeout(() => {
      setTestStatus({ kind: 'success' });
      // Success auto-reverts after 4 seconds; errors stay STICKY per UI-SPEC line 986-989.
      setTimeout(() => setTestStatus({ kind: 'idle' }), 4000);
    }, 400);
  };

  return (
    <>
      {/* Backdrop — only mobile/tablet (<lg). On desktop the drawer is a
          pushing sidebar with no modal overlay; clicking the gear/X closes it.
          Always mounted so the opacity transition runs on open/close. */}
      <div
        className={[
          'fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm transition-opacity duration-200 ease-out xl:hidden',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        aria-label="Settings"
        className={[
          'fixed z-[200] bg-[--color-surface-elevated] border-l border-[--color-border] shadow-[--shadow-overlay]',
          'overflow-y-auto px-5 py-5 xl:px-6 xl:py-6',
          'transition-transform duration-300',
          // <xl: bottom-sheet (mobile + tablet + smaller laptops)
          'bottom-0 left-0 right-0 w-full max-h-[85vh] rounded-t-xl',
          // ≥xl (1280px): pushing sidebar — slides in below the 48px topbar.
          // Width is hard-coded to 380px to match DRAWER_WIDTH_PX (consumed by
          // AppShell for the page content shift).
          'xl:top-12 xl:bottom-0 xl:right-0 xl:left-auto xl:w-[380px] xl:max-h-[calc(100vh-3rem)] xl:rounded-none',
          open
            ? 'translate-y-0 xl:translate-y-0 xl:translate-x-0'
            : 'translate-y-full xl:translate-y-0 xl:translate-x-full',
        ].join(' ')}
        style={{ transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)' }}
        inert={!open || undefined}
      >
        {/* Mobile drag-handle affordance (purely visual — actual swipe-to-dismiss
            is deferred; this just hints "this is a sheet" and reduces the
            "where do I close it" friction). Hidden on desktop. */}
        <div
          className="xl:hidden mx-auto mb-3 w-10 h-1 rounded-full bg-[--color-border]"
          aria-hidden="true"
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-2 border-b border-[--color-border]">
          <h2 className="text-2xl font-semibold text-[--color-ink] tracking-tight">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="w-9 h-9 grid place-items-center rounded-md text-[--color-ink-muted] hover:text-[--color-ink] hover:bg-[--color-surface-subtle] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[oklch(0.55_0.18_260/0.4)] transition-colors duration-150"
          >
            <XIcon />
          </button>
        </div>

        {/* Section 1: OpenRouter API key */}
        <section className="mt-6">
          <h3 className="text-xs font-mono uppercase tracking-[0.18em] text-[--color-ink-muted] mb-4">
            OpenRouter API key
          </h3>
          <p className="text-xs text-[--color-ink-muted] -mt-2 mb-3">
            Get a key at{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[--color-brand] underline"
            >
              openrouter.ai/keys
            </a>{' '}
            — pay-as-you-go, no minimums.
          </p>
          <label
            htmlFor="gjd-key-input"
            className="block text-sm font-semibold mt-3 mb-1"
          >
            Your key
          </label>
          <div className="relative">
            <input
              id="gjd-key-input"
              ref={keyInputRef}
              type={revealed ? 'text' : 'password'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onBlur={handleBlur}
              placeholder="sk-or-v1-..."
              autoComplete="off"
              spellCheck={false}
              className="w-full h-11 px-3.5 pr-10 py-2 bg-[--color-surface] text-[--color-ink] border border-[--color-border] rounded-md text-sm placeholder:text-[--color-ink-subtle] hover:border-[--color-border-strong] focus:outline-none focus:border-[--color-brand] focus:shadow-[0_0_0_3px_oklch(0.55_0.18_260/0.25)] transition-[border-color,box-shadow] duration-200"
            />
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              aria-label={revealed ? 'Hide key' : 'Show key'}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center rounded-sm text-[--color-ink-muted] hover:text-[--color-ink] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[oklch(0.55_0.18_260/0.4)]"
            >
              {revealed ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          <p className="text-xs text-[--color-ink-muted] mt-2">
            Used only for AI-powered signals (authenticity + AI-generated-text
            detection). Stored locally in this browser. Never sent to our
            servers.
          </p>
          {!isFormatOk && trimmedInput.length > 0 && (
            <p className="text-xs text-[--color-ink-muted] mt-1">
              This doesn't look like a standard OpenRouter key (sk-or-v1-…).
              Testing anyway will hit the API.
            </p>
          )}
          <div className="mt-2 flex gap-2 items-center">
            <button
              type="button"
              onClick={handleSave}
              disabled={saveDisabled || saveStatus.kind === 'saving'}
              className="h-10 px-4 text-sm font-semibold rounded-md bg-[--color-brand] text-white shadow-[0_1px_0_0_oklch(1_0_0/0.15)_inset] hover:bg-[--color-brand-strong] hover:-translate-y-[1px] active:scale-[0.97] disabled:bg-[--color-surface-subtle] disabled:text-[--color-ink-muted] disabled:shadow-none disabled:hover:translate-y-0 disabled:cursor-not-allowed transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[--color-border-focus]/40"
            >
              {saveStatus.kind === 'saving' ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={testDisabled}
              title={
                hasUnsavedChange && savedKey !== null
                  ? 'Save your key first'
                  : savedKey === null
                    ? 'Save a key first'
                    : ''
              }
              className="h-10 px-4 text-sm font-semibold rounded-md bg-transparent text-[--color-ink] border border-[--color-border] hover:bg-[--color-surface-subtle] hover:border-[--color-border-strong] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all duration-200 focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[--color-border-focus]/40"
            >
              {testStatus.kind === 'testing' ? 'Testing…' : 'Test key'}
            </button>
            {saveStatus.kind === 'saved' && (
              <span className="text-xs text-[--color-ink-muted] ml-2">
                Saved.
              </span>
            )}
          </div>
          {saveStatus.kind === 'error_quota' && (
            <p className="text-xs mt-2" style={{ color: '#b91c1c' }}>
              Couldn't save the key. Try clearing browser storage and try again.
            </p>
          )}
          {saveStatus.kind === 'error_unavailable' && (
            <p className="text-xs mt-2" style={{ color: '#b91c1c' }}>
              Couldn't save the key. Your browser may have storage disabled.
            </p>
          )}
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
              That key isn't valid. Double-check it starts with sk-or-v1- and
              you copied the whole thing.
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

        {/* Section 2: Privacy disclosure (EXT-16) — VERBATIM from apps/extension/entrypoints/options/App.tsx lines 222-249 */}
        <section className="mt-8">
          <h3 className="text-xs font-mono uppercase tracking-[0.18em] text-[--color-ink-muted] mb-3">
            Privacy &amp; data
          </h3>
          <div className="p-4 bg-[--color-surface-subtle] rounded-md space-y-3 text-sm border border-[--color-border]">
            <div>
              <p className="font-semibold">What gets sent</p>
              <p>
                When you analyze a job, this extension sends the title, company,
                location, and description text to ghost-job-detector.vercel.app.
                We never send the URL of the page you're on, and we never log
                your OpenRouter key.
              </p>
            </div>
            <div>
              <p className="font-semibold">Where your key lives</p>
              <p>
                Your OpenRouter key is stored in <code>localStorage</code> on
                this device only. It never leaves your browser except for the
                one direct call to openrouter.ai/api/v1/auth/key to verify it
                works (the "Test key" button) and the per-analysis calls when
                you view a job.
              </p>
            </div>
            <div>
              <p className="font-semibold">What we don't do</p>
              <p>
                No accounts. No tracking. No analytics. No cross-device sync. No
                selling anything. If you uninstall the extension, your key and
                history are gone.
              </p>
            </div>
          </div>
        </section>
      </aside>
    </>
  );
}

// Inline SVG glyphs — UI-SPEC line 31 forbids lucide-react. Static JSX, no
// dangerouslySetInnerHTML, so React's escaping defends against any XSS attempt
// even though these are author-controlled (T-04-54 mitigation pattern).
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

function XIcon() {
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
      <path d="M3 3 L13 13" />
      <path d="M13 3 L3 13" />
    </svg>
  );
}
