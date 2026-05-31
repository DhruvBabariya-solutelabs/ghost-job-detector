import type { HistoryEntry } from '@/src/lib/messages';
import { TrustGauge } from './TrustGauge';
import { VerdictPill } from './VerdictPill';
import { VERDICTS } from './verdict';

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

      <div style={{ marginTop: 10 }}>
        <TrustGauge
          score={response.score}
          band={response.risk}
          animate={animate}
          reducedMotion={reducedMotion}
          size={gaugeSize}
        />
      </div>

      <div style={{ marginTop: -8 }}>
        <VerdictPill band={response.risk} animate={animate} reducedMotion={reducedMotion} />
      </div>

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
