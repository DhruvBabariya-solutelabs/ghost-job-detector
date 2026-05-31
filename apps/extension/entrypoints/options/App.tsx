/**
 * Options page — BYOK OpenRouter key paste + Save + Test Key + Privacy disclosure.
 *
 * 2026-05 — BYOK provider switched from OpenAI to OpenRouter. Same UI contract,
 * different key format (`sk-or-v1-...`) and verification endpoint
 * (https://openrouter.ai/api/v1/auth/key).
 *
 * 2026-05 — Visual refit onto the premium dark-glass design system (src/ui/theme.css)
 * shared with the popup / side panel / overlay, replacing the standalone Tailwind
 * light theme. Authored with inline styles + `gjd-*` classes like those surfaces.
 * Behaviour, message contract, and the EXT-16 privacy copy are unchanged.
 *
 * Trust-moment surface (EXT-11 / EXT-12 / EXT-16):
 *   - EXT-11: input type="password" + show/hide eye-glyph toggle.
 *   - EXT-12: Test Key button validates the SAVED value (NOT the unsaved input)
 *     against openrouter.ai via the SW's TEST_KEY handler. D-52 + Pitfall 6.
 *   - EXT-16: Three-paragraph privacy disclosure rendered with provider-neutral
 *     copy — paraphrase = trust violation. Copy is preserved verbatim.
 *
 * Storage goes through the lib/storage.ts gateway (getApiKey/setApiKey) —
 * the same module also applies D-51 quote+whitespace sanitization at write.
 *
 * Security gates (verified by grep acceptance criteria):
 *   - No console.log/warn/error/debug/info anywhere — BYOK key NEVER logged.
 *   - No direct chrome.storage.local access — gateway invariant.
 *   - No lucide-react import — all glyphs are inline SVG.
 *   - TEST_KEY message payload is `savedKey` (NOT `input`/`trimmedInput`) per
 *     D-52 + Pitfall 6.
 */

import type { ReactNode, SVGProps } from 'react';
import { useEffect, useState } from 'react';
import { getApiKey, setApiKey } from '@/src/lib/storage';
import type { RpcResponse } from '@/src/lib/messages';
import { Brand } from '@/src/ui/Brand';
import { ThemeToggle } from '@/src/ui/ThemeToggle';
import { CheckIcon } from '@/src/ui/icons';

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

  // Connection state for the header pill — never reveals the key itself.
  const connected = savedKey !== null;
  const keyTail = connected && savedKey.length >= 4 ? savedKey.slice(-4) : null;

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
    <main
      className="gjd-canvas"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Sticky glass header — mirrors the side panel. */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 22px',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          background: 'color-mix(in oklab, var(--bg) 78%, transparent)',
        }}
      >
        <Brand size={22} />
        <ThemeToggle />
      </header>

      <div
        style={{
          width: '100%',
          maxWidth: 640,
          margin: '0 auto',
          padding: '48px 22px 72px',
        }}
      >
        {/* Hero */}
        <div className="gjd-rise" style={{ animationDelay: '40ms' }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: 'var(--t-2xs)',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--brand)',
            }}
          >
            Configuration
          </span>
          <h1
            style={{
              margin: '8px 0 0',
              fontSize: '1.9rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              color: 'var(--ink)',
            }}
          >
            Bring your own AI key
          </h1>
          <p
            style={{
              margin: '10px 0 0',
              fontSize: 'var(--t-md)',
              lineHeight: 1.55,
              color: 'var(--ink-muted)',
              maxWidth: 520,
            }}
          >
            Ghost Job Detector runs its smartest signals through your own OpenRouter key.
            It lives on this device only — we never see it.
          </p>
        </div>

        {/* API key card — the hero surface with a violet ambient glow. */}
        <section
          className="gjd-card gjd-rise"
          style={{
            position: 'relative',
            overflow: 'hidden',
            marginTop: 28,
            padding: 26,
            borderRadius: 'var(--r-container)',
            boxShadow: 'var(--shadow-card)',
            animationDelay: '120ms',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                'radial-gradient(120% 90% at 100% 0%, color-mix(in oklab, var(--brand) 16%, transparent), transparent 58%)',
            }}
          />
          <div style={{ position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <IconChip>
                  <KeyIcon size={18} />
                </IconChip>
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 'var(--t-md)',
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    OpenRouter API key
                  </h2>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: 'var(--t-xs)',
                      color: 'var(--ink-muted)',
                    }}
                  >
                    Pay-as-you-go · default model openai/gpt-4o-mini
                  </p>
                </div>
              </div>
              <ConnectionPill connected={connected} tail={keyTail} />
            </div>

            <label
              htmlFor="gjd-key-input"
              style={{
                display: 'block',
                marginTop: 22,
                marginBottom: 7,
                fontSize: 'var(--t-sm)',
                fontWeight: 600,
                color: 'var(--ink-soft)',
              }}
            >
              Your key
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="gjd-key-input"
                className="gjd-input gjd-focus"
                type={revealed ? 'text' : 'password'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onBlur={handleBlur}
                placeholder="sk-or-v1-…"
                autoComplete="off"
                spellCheck={false}
                style={{
                  width: '100%',
                  height: 46,
                  padding: '0 84px 0 14px',
                  background: 'var(--surface)',
                  color: 'var(--ink)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-card)',
                  fontSize: 'var(--t-base)',
                  fontFamily: 'ui-monospace, "SF Mono", "Cascadia Code", Menlo, monospace',
                  letterSpacing: '0.01em',
                  boxSizing: 'border-box',
                }}
              />
              {/* Live format check — reassures before the user even saves. */}
              {isFormatOk && (
                <span
                  className="gjd-fade"
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    right: 46,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--brand)',
                  }}
                >
                  <CheckIcon size={16} />
                </span>
              )}
              <button
                type="button"
                onClick={() => setRevealed((r) => !r)}
                aria-label={revealed ? 'Hide key' : 'Show key'}
                title={revealed ? 'Hide key' : 'Show key'}
                className="gjd-focus gjd-iconbtn"
                style={{
                  all: 'unset',
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'grid',
                  placeItems: 'center',
                  width: 30,
                  height: 30,
                  borderRadius: 'var(--r-pill)',
                  color: 'var(--ink-muted)',
                  cursor: 'pointer',
                }}
              >
                {revealed ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            <p
              style={{
                margin: '12px 0 0',
                fontSize: 'var(--t-xs)',
                lineHeight: 1.5,
                color: 'var(--ink-muted)',
              }}
            >
              Used only for AI-powered signals (authenticity + AI-generated-text detection).
              Stored locally in this browser. Never sent to our servers. Don't have one?{' '}
              <a className="gjd-link" href="https://openrouter.ai/keys" target="_blank" rel="noopener">
                Get a key
                <ExternalLinkIcon size={11} />
              </a>
            </p>

            {!isFormatOk && trimmedInput.length > 0 && (
              <p
                className="gjd-fade"
                style={{
                  margin: '8px 0 0',
                  fontSize: 'var(--t-xs)',
                  color: 'var(--ink-muted)',
                }}
              >
                This doesn't look like a standard OpenRouter key (sk-or-v1-…). Testing anyway will
                hit the API.
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 20 }}>
              <button
                type="button"
                onClick={() => {
                  void handleSave();
                }}
                disabled={saveDisabled || saveStatus.kind === 'saving'}
                className={`gjd-focus ${saveDisabled || saveStatus.kind === 'saving' ? '' : 'gjd-cta'}`}
                style={{
                  all: 'unset',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 22px',
                  borderRadius: 'var(--r-pill)',
                  background: 'var(--brand)',
                  color: 'var(--brand-ink)',
                  fontSize: 'var(--t-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: saveDisabled || saveStatus.kind === 'saving' ? 0.45 : 1,
                  pointerEvents: saveDisabled || saveStatus.kind === 'saving' ? 'none' : 'auto',
                  boxSizing: 'border-box',
                }}
              >
                {saveStatus.kind === 'saving' ? (
                  <>
                    <Spinner /> Saving…
                  </>
                ) : saveStatus.kind === 'saved' ? (
                  <>
                    <CheckIcon size={15} /> Saved
                  </>
                ) : (
                  'Save key'
                )}
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
                      : 'Verify the saved key against OpenRouter'
                }
                className={`gjd-focus ${testDisabled ? '' : 'gjd-chip'}`}
                style={{
                  all: 'unset',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 20px',
                  borderRadius: 'var(--r-pill)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--ink)',
                  fontSize: 'var(--t-sm)',
                  fontWeight: 600,
                  cursor: testDisabled ? 'not-allowed' : 'pointer',
                  opacity: testDisabled ? 0.45 : 1,
                  boxSizing: 'border-box',
                }}
              >
                {testStatus.kind === 'testing' ? (
                  <>
                    <Spinner /> Testing…
                  </>
                ) : (
                  <>
                    <ShieldBoltIcon size={15} /> Test key
                  </>
                )}
              </button>
            </div>

            {/* Verification feedback — one calm region, animated in. */}
            {testStatus.kind === 'success' && (
              <StatusNote tone="success" icon={<CheckIcon size={15} />}>
                Key works — you're all set.
              </StatusNote>
            )}
            {testStatus.kind === 'invalid' && (
              <StatusNote tone="danger" icon={<AlertIcon size={15} />}>
                That key isn't valid. Double-check it starts with sk-or-v1- and you copied the whole
                thing.
              </StatusNote>
            )}
            {testStatus.kind === 'rate_limit' && (
              <StatusNote tone="warn" icon={<AlertIcon size={15} />}>
                Rate-limited by OpenRouter. Wait a minute and try again.
              </StatusNote>
            )}
            {testStatus.kind === 'network' && (
              <StatusNote tone="warn" icon={<AlertIcon size={15} />}>
                Couldn't reach OpenRouter. Check your internet, then try again.
              </StatusNote>
            )}
          </div>
        </section>

        {/* Privacy & data — verbatim EXT-16 disclosure, premium card treatment. */}
        <section className="gjd-rise" style={{ marginTop: 30, animationDelay: '200ms' }}>
          <h2
            style={{
              margin: '0 0 14px',
              fontSize: 'var(--t-sm)',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--ink-muted)',
            }}
          >
            Privacy &amp; data
          </h2>
          <div style={{ display: 'grid', gap: 12 }}>
            <PrivacyCard icon={<SendIcon size={17} />} title="What gets sent">
              When you analyze a job, this extension sends the title, company, location, and
              description text to ghost-job-detector.vercel.app. We never send the URL of the page
              you're on, and we never log your OpenRouter key.
            </PrivacyCard>
            <PrivacyCard icon={<LockIcon size={17} />} title="Where your key lives">
              Your OpenRouter key is stored in <code className="gjd-code">chrome.storage.local</code>{' '}
              on this device only. It never leaves your browser except for the one direct call to
              openrouter.ai/api/v1/auth/key to verify it works (the "Test key" button) and the
              per-analysis calls when you view a job.
            </PrivacyCard>
            <PrivacyCard icon={<BanIcon size={17} />} title="What we don't do">
              No accounts. No tracking. No analytics. No cross-device sync. No selling anything. If
              you uninstall the extension, your key and history are gone.
            </PrivacyCard>
          </div>
        </section>

        <p
          className="gjd-fade"
          style={{
            margin: '34px 0 0',
            textAlign: 'center',
            fontSize: 'var(--t-2xs)',
            letterSpacing: '0.04em',
            color: 'var(--ink-faint)',
            animationDelay: '300ms',
          }}
        >
          Ghost Job Detector · BYOK · No accounts, no tracking
        </p>
      </div>
    </main>
  );
}

/* ===================================================================== */
/* Local presentational helpers                                          */
/* ===================================================================== */

/** Soft violet-tinted square that frames a section glyph. */
function IconChip({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'grid',
        placeItems: 'center',
        width: 38,
        height: 38,
        flexShrink: 0,
        borderRadius: 10,
        color: 'var(--brand)',
        background: 'color-mix(in oklab, var(--brand) 14%, transparent)',
        border: '1px solid color-mix(in oklab, var(--brand) 26%, transparent)',
      }}
    >
      {children}
    </span>
  );
}

/** Header status: live green when a key is saved, quiet amber when not. */
function ConnectionPill({ connected, tail }: { connected: boolean; tail: string | null }) {
  const c = connected
    ? { fg: '#34d399', bg: 'rgba(52,211,153,0.12)', bd: 'rgba(52,211,153,0.30)' }
    : { fg: '#fbbf24', bg: 'rgba(251,191,36,0.12)', bd: 'rgba(251,191,36,0.30)' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        flexShrink: 0,
        padding: '5px 11px',
        borderRadius: 'var(--r-pill)',
        fontSize: 'var(--t-2xs)',
        fontWeight: 600,
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.bd}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        className={connected ? 'gjd-glow' : undefined}
        style={{ width: 7, height: 7, borderRadius: '50%', background: c.fg, display: 'inline-block' }}
      />
      {connected ? `Connected${tail ? ` · …${tail}` : ''}` : 'Not connected'}
    </span>
  );
}

type Tone = 'success' | 'danger' | 'warn';
const TONES: Record<Tone, { fg: string; bg: string; bd: string }> = {
  success: { fg: '#34d399', bg: 'rgba(52,211,153,0.10)', bd: 'rgba(52,211,153,0.26)' },
  danger: { fg: '#fb7185', bg: 'rgba(251,113,133,0.10)', bd: 'rgba(251,113,133,0.26)' },
  warn: { fg: '#fbbf24', bg: 'rgba(251,191,36,0.10)', bd: 'rgba(251,191,36,0.26)' },
};

function StatusNote({
  tone,
  icon,
  children,
}: {
  tone: Tone;
  icon: ReactNode;
  children: ReactNode;
}) {
  const c = TONES[tone];
  return (
    <div
      className="gjd-rise"
      role="status"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 9,
        marginTop: 16,
        padding: '11px 14px',
        borderRadius: 'var(--r-card)',
        fontSize: 'var(--t-xs)',
        lineHeight: 1.5,
        fontWeight: 500,
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.bd}`,
      }}
    >
      <span style={{ flexShrink: 0, marginTop: 1, display: 'grid', placeItems: 'center' }}>
        {icon}
      </span>
      <span>{children}</span>
    </div>
  );
}

function PrivacyCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className="gjd-card gjd-signal"
      style={{
        display: 'flex',
        gap: 14,
        padding: 18,
        borderRadius: 'var(--r-card)',
      }}
    >
      <IconChip>{icon}</IconChip>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 'var(--t-sm)', fontWeight: 600, color: 'var(--ink)' }}>
          {title}
        </p>
        <p
          style={{
            margin: '5px 0 0',
            fontSize: 'var(--t-xs)',
            lineHeight: 1.6,
            color: 'var(--ink-muted)',
          }}
        >
          {children}
        </p>
      </div>
    </div>
  );
}

/* ===================================================================== */
/* Inline SVG glyphs — lucide-react forbidden (UI-SPEC line 29). Static  */
/* JSX, no dangerouslySetInnerHTML, so React escaping defends XSS even    */
/* though authored locally (T-04-54 mitigation). 24-grid, 1.6 stroke.    */
/* ===================================================================== */

type GlyphProps = SVGProps<SVGSVGElement> & { size?: number };

function Glyph({ size = 16, children, ...props }: GlyphProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

function KeyIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <circle cx="8" cy="8" r="4" />
      <path d="M11 11l8 8M16 16l2-2M19 19l2-2" />
    </Glyph>
  );
}

function LockIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <rect x="5" y="10.5" width="14" height="9" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </Glyph>
  );
}

function SendIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M21 4L3 11l7 2.5L13 21l8-17z" />
      <path d="M10 13.5L21 4" />
    </Glyph>
  );
}

function BanIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6 6l12 12" />
    </Glyph>
  );
}

function ShieldBoltIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M12.5 8.5L9.5 13h3l-1 3 3-4.5h-3l1-3z" />
    </Glyph>
  );
}

function AlertIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M12 4.5l8 14H4l8-14z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </Glyph>
  );
}

function ExternalLinkIcon({ size = 11, ...p }: GlyphProps) {
  return (
    <Glyph
      size={size}
      style={{ display: 'inline-block', verticalAlign: 'baseline', marginLeft: 3 }}
      {...p}
    >
      <path d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </Glyph>
  );
}

function EyeIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="2.8" />
    </Glyph>
  );
}

function EyeOffIcon(p: GlyphProps) {
  return (
    <Glyph {...p}>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2.8 2.8 0 0 0 3.8 3.8" />
      <path d="M6.5 6.6C3.8 8.2 2 12 2 12s3.5 7 10 7c2 0 3.7-.6 5.2-1.5" />
      <path d="M9.8 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-2.4 3.3" />
    </Glyph>
  );
}

/** Tiny spinner — uses the shared gjd-spin keyframe. */
function Spinner() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={{ animation: 'gjd-spin 0.7s linear infinite' }}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2.4} opacity={0.25} />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </svg>
  );
}
