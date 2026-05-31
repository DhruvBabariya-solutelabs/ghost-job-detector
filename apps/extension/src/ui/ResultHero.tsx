/**
 * ResultHero — the gauge block: posting heading, the animated TrustGauge, the
 * spring-in verdict pill, and the one-line plain-language verdict. Shared by the
 * popup and the side-panel; callers place the signal list + actions around it.
 *
 * A "demo sample" chip is shown when the analysis came from a fixture
 * (meta.usedAi === false && model === 'demo-fixture') so demo entries are never
 * mistaken for live ones.
 */

import type { HistoryEntry } from '@/src/lib/messages';
import { VERDICTS } from './verdict';
import { TrustGauge } from './TrustGauge';
import { VerdictPill } from './VerdictPill';

interface ResultHeroProps {
  entry: HistoryEntry;
  animate: boolean;
  reducedMotion: boolean;
  gaugeSize?: number;
}

export function ResultHero({ entry, animate, reducedMotion, gaugeSize = 200 }: ResultHeroProps) {
  const { response, posting } = entry;
  const v = VERDICTS[response.risk];
  const isDemo = response.meta.usedAi === false && response.meta.model === 'demo-fixture';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {/* Posting heading */}
      <div style={{ maxWidth: 320 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 'var(--t-md)',
            fontWeight: 600,
            color: 'var(--ink)',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          title={posting.title}
        >
          {posting.title || 'Untitled role'}
        </h2>
        <p style={{ margin: '3px 0 0', fontSize: 'var(--t-sm)', color: 'var(--ink-muted)' }}>
          {[posting.company, posting.location].filter(Boolean).join(' · ') || 'Unknown company'}
          {isDemo && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 'var(--t-2xs)',
                fontWeight: 600,
                color: 'var(--brand)',
                border: '1px solid color-mix(in oklab, var(--brand) 40%, transparent)',
                borderRadius: 'var(--r-pill)',
                padding: '1px 7px',
              }}
            >
              Sample
            </span>
          )}
        </p>
      </div>

      {/* Gauge */}
      <div style={{ marginTop: 10 }}>
        <TrustGauge
          score={response.score}
          band={response.risk}
          animate={animate}
          reducedMotion={reducedMotion}
          size={gaugeSize}
        />
      </div>

      {/* Pill */}
      <div style={{ marginTop: -8 }}>
        <VerdictPill band={response.risk} animate={animate} reducedMotion={reducedMotion} />
      </div>

      {/* One-line verdict */}
      <p
        style={{
          margin: '12px 0 0',
          maxWidth: 300,
          fontSize: 'var(--t-base)',
          lineHeight: 1.5,
          color: 'var(--ink-soft)',
          animation:
            animate && !reducedMotion
              ? 'gjd-fade var(--dur-standard) var(--ease-expo) 620ms both'
              : undefined,
        }}
      >
        {v.line}
      </p>
    </div>
  );
}
