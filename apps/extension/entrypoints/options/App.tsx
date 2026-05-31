import type { ReactNode, SVGProps } from 'react';
import { useEffect, useState } from 'react';
import type { RpcResponse } from '@/src/lib/messages';
import { clearApiKey, getApiKey, setApiKey } from '@/src/lib/storage';
import { Brand } from '@/src/ui/Brand';
import { CheckIcon } from '@/src/ui/icons';
import { ThemeToggle } from '@/src/ui/ThemeToggle';

type TestKeyStatus =
  | { kind: 'idle' }
  | { kind: 'testing' }
  | { kind: 'success' }
  | { kind: 'invalid' }
  | { kind: 'rate_limit' }
  | { kind: 'network' };

type SaveStatus = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' };

const KEY_REGEX = /^sk-or-v1-[A-Za-z0-9_-]{20,}$/;

export function App() {
  const [input, setInput] = useState('');
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [testStatus, setTestStatus] = useState<TestKeyStatus>({ kind: 'idle' });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ kind: 'idle' });
  const [confirmRemove, setConfirmRemove] = useState(false);

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

  const handleRemove = async (): Promise<void> => {
    if (!confirmRemove) {
      setConfirmRemove(true);
      setTimeout(() => setConfirmRemove(false), 3500);
      return;
    }
    await clearApiKey();
    setSavedKey(null);
    setInput('');
    setConfirmRemove(false);
    setTestStatus({ kind: 'idle' });
    setSaveStatus({ kind: 'idle' });
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
            Ghost Job Detector runs its smartest signals through your own OpenRouter key. It lives
            on this device only — we never see it.
          </p>
        </div>

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
              Used only for AI-powered signals (authenticity + AI-generated-text detection). Stored
              locally in this browser. Never sent to our servers. Don't have one?{' '}
              <a
                className="gjd-link"
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener"
              >
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

              {connected && (
                <button
                  type="button"
                  onClick={() => {
                    void handleRemove();
                  }}
                  title="Remove the saved key from this device"
                  className="gjd-focus"
                  style={{
                    all: 'unset',
                    marginLeft: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '10px 16px',
                    borderRadius: 'var(--r-pill)',
                    fontSize: 'var(--t-sm)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    color: confirmRemove ? '#fff' : '#ff7585',
                    background: confirmRemove ? '#e23950' : 'transparent',
                    border: `1px solid ${
                      confirmRemove ? '#e23950' : 'color-mix(in oklab, #ff5f6d 42%, transparent)'
                    }`,
                  }}
                >
                  <svg
                    width={15}
                    height={15}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6" />
                  </svg>
                  {confirmRemove ? 'Confirm remove' : 'Remove key'}
                </button>
              )}
            </div>

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
              Your OpenRouter key is stored in{' '}
              <code className="gjd-code">chrome.storage.local</code> on this device only. It never
              leaves your browser except for the one direct call to openrouter.ai/api/v1/auth/key to
              verify it works (the "Test key" button) and the per-analysis calls when you view a
              job.
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
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: c.fg,
          display: 'inline-block',
        }}
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
