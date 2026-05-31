/**
 * Error — a puzzled ghost and a single, clear recovery path (Retry). Message
 * states what happened and how to fix it; never a raw error string (the SW
 * already redacts those to avoid leaking the BYOK key).
 */

import { GhostMascot } from '../GhostMascot';
import { RefreshIcon } from '../icons';
import { useReducedMotion } from '../useReducedMotion';

interface ErrorStateProps {
  onRetry: () => void;
  message?: string;
}

export function ErrorState({
  onRetry,
  message = 'That scan didn’t go through. Check your connection and try again.',
}: ErrorStateProps) {
  const reduced = useReducedMotion();
  return (
    <div
      className="gjd-fade"
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 14,
      }}
    >
      <GhostMascot mode="puzzled" size={80} still={reduced} />
      <div style={{ maxWidth: 280 }}>
        <h2 style={{ margin: 0, fontSize: 'var(--t-md)', fontWeight: 600, color: 'var(--ink)' }}>
          Something went sideways
        </h2>
        <p
          style={{
            margin: '6px 0 0',
            fontSize: 'var(--t-sm)',
            color: 'var(--ink-muted)',
            lineHeight: 1.55,
          }}
        >
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="gjd-focus gjd-cta"
        style={{
          all: 'unset',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 18px',
          borderRadius: 'var(--r-pill)',
          background: 'var(--brand)',
          color: 'var(--brand-ink)',
          fontWeight: 600,
          fontSize: 'var(--t-sm)',
          cursor: 'pointer',
        }}
      >
        <RefreshIcon size={15} />
        Try again
      </button>
    </div>
  );
}
