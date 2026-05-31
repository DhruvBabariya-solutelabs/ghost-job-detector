/**
 * Empty / no-posting — a friendly peeking ghost and a prompt to open a job page
 * or try a sample. Never alarmist; calm and inviting.
 */

import type { ReactNode } from 'react';
import { GhostMascot } from '../GhostMascot';
import { useReducedMotion } from '../useReducedMotion';

interface EmptyStateProps {
  title?: string;
  body?: string;
  /** Action area (e.g. sample chips) rendered below the copy. */
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
      {/* Full ghost with vertical breathing room so the idle bob never clips
          the dome (the parent must not constrain its height + the 5px lift). */}
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
