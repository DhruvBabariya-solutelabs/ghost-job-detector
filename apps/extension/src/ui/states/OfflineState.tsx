import { WifiOffIcon } from '../icons';

export function OfflineBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 'var(--r-card)',
        background: 'color-mix(in oklab, var(--brand) 10%, var(--surface))',
        border: '1px solid color-mix(in oklab, var(--brand) 26%, transparent)',
        fontSize: 'var(--t-xs)',
        color: 'var(--ink-soft)',
      }}
    >
      <WifiOffIcon size={15} style={{ color: 'var(--brand)', flexShrink: 0 }} />
      <span>You’re offline — live scans are paused. Cached results and samples still work.</span>
    </div>
  );
}
