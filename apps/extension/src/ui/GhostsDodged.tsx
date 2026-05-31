/**
 * "Ghosts dodged" lifetime counter — a small engagement chip showing how many
 * suspicious/ghost listings the user has been warned about. Pops a brief
 * sparkle celebration when the count lands on a milestone (5/10/25/50/100…).
 */

import { useEffect, useRef, useState } from 'react';
import { GhostIcon } from './icons';
import { useReducedMotion } from './useReducedMotion';

const MILESTONES = new Set([5, 10, 25, 50, 100, 250]);

export function GhostsDodged({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const prev = useRef(value);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (value > prev.current && MILESTONES.has(value) && !reduced) {
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 1400);
      prev.current = value;
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value, reduced]);

  return (
    <span
      className="gjd-tnum"
      title="Suspicious or ghost listings you've been warned about"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 'var(--r-pill)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        fontSize: 'var(--t-xs)',
        fontWeight: 600,
        color: 'var(--ink-soft)',
        position: 'relative',
        animation: celebrate ? 'gjd-pop var(--dur-recolor) var(--ease-expo)' : undefined,
      }}
    >
      <GhostIcon size={14} style={{ color: 'var(--brand)' }} />
      <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{value}</span>
      <span style={{ color: 'var(--ink-muted)' }}>dodged</span>
      {celebrate && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -6,
            right: -4,
            fontSize: 12,
            animation: 'gjd-pop 600ms var(--ease-expo)',
          }}
        >
          ✦
        </span>
      )}
    </span>
  );
}
