/**
 * "Why this score" — the reason cards, grouped working-against-it (negative)
 * then in-its-favour (positive), each card stagger-revealed 55ms apart after
 * the gauge settles. Up to 5 reasons (engine contract); empty → friendly note.
 */

import type { Reason, RiskBand } from '@ghost/shared';
import { SignalCard } from './SignalCard';

interface SignalListProps {
  reasons: Reason[];
  band: RiskBand;
  animate: boolean;
  reducedMotion: boolean;
}

function Group({
  title,
  reasons,
  band,
  maxAbs,
  startIndex,
  animate,
  reducedMotion,
}: {
  title: string;
  reasons: Reason[];
  band: RiskBand;
  maxAbs: number;
  startIndex: number;
  animate: boolean;
  reducedMotion: boolean;
}) {
  if (reasons.length === 0) return null;
  return (
    <div>
      <h4
        style={{
          margin: '0 0 8px',
          fontSize: 'var(--t-2xs)',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
        }}
      >
        {title}
      </h4>
      <ul style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {reasons.map((r, i) => (
          <SignalCard
            key={`${r.signalKey}-${r.text}`}
            reason={r}
            band={band}
            maxAbs={maxAbs}
            index={startIndex + i}
            animate={animate}
            reducedMotion={reducedMotion}
          />
        ))}
      </ul>
    </div>
  );
}

export function SignalList({ reasons, band, animate, reducedMotion }: SignalListProps) {
  const visible = reasons.slice(0, 5);
  const negative = visible.filter((r) => r.signed < 0);
  const positive = visible.filter((r) => r.signed >= 0);
  const maxAbs = visible.reduce((m, r) => Math.max(m, Math.abs(r.signed)), 1);

  return (
    <section aria-label="Why this score">
      <h3
        style={{
          margin: '0 0 12px',
          fontSize: 'var(--t-2xs)',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
        }}
      >
        Why this score
      </h3>

      {visible.length === 0 ? (
        <p style={{ margin: 0, fontSize: 'var(--t-sm)', color: 'var(--ink-muted)' }}>
          Couldn&apos;t summarize this posting in detail — the score still stands.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Group
            title="Working against it"
            reasons={negative}
            band={band}
            maxAbs={maxAbs}
            startIndex={0}
            animate={animate}
            reducedMotion={reducedMotion}
          />
          <Group
            title="In its favour"
            reasons={positive}
            band={band}
            maxAbs={maxAbs}
            startIndex={negative.length}
            animate={animate}
            reducedMotion={reducedMotion}
          />
        </div>
      )}

      <p
        style={{
          margin: '14px 0 0',
          fontSize: 'var(--t-2xs)',
          color: 'var(--ink-faint)',
          lineHeight: 1.5,
        }}
      >
        The score is the engine&apos;s weighted verdict across every signal — individual flags
        don&apos;t add up to it directly.
      </p>
    </section>
  );
}
