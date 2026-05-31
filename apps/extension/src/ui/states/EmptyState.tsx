import type { ReactNode } from 'react';
import { GhostMascot } from '../GhostMascot';
import { useReducedMotion } from '../useReducedMotion';

interface EmptyStateProps {
  title?: string;
  body?: string;
  children?: ReactNode;
}

export function EmptyState({
  title = 'No job posting detected',
  body = 'Open a job on LinkedIn or Indeed and I’ll score it — or try a sample below to see how it works.',
  children,
}: EmptyStateProps) {
  const reduced = useReducedMotion();
  return (
    <div
      className="gjd-fade"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 14,
      }}
    >
      <div style={{ paddingTop: 6, paddingBottom: 2, overflow: 'visible' }}>
        <GhostMascot mode="idle" size={88} still={reduced} />
      </div>
      <div style={{ maxWidth: 290 }}>
        <h2 style={{ margin: 0, fontSize: 'var(--t-md)', fontWeight: 600, color: 'var(--ink)' }}>
          {title}
        </h2>
        <p
          style={{
            margin: '6px 0 0',
            fontSize: 'var(--t-sm)',
            color: 'var(--ink-muted)',
            lineHeight: 1.55,
          }}
        >
          {body}
        </p>
      </div>
      {children && <div style={{ width: '100%' }}>{children}</div>}
    </div>
  );
}
