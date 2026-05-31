import type { Reason, RiskBand, SignalKey } from '@ghost/shared';
import { useState } from 'react';
import { ChevronIcon } from './icons';
import { SIGNAL_LABELS, strengthLabel, VERDICTS } from './verdict';

const POSITIVE = '#34e89e';
const POSITIVE_DEEP = '#0b6e58';

const WHY_IT_MATTERS: Record<SignalKey, string> = {
  specificity:
    'Real postings name concrete details — salary, stack, team, reporting line. Vagueness is the #1 ghost-job tell.',
  buzzword:
    'Heavy generic praise ("rockstar", "fast-paced") often pads a listing that has little real substance behind it.',
  scam: 'Off-platform contact, urgency, and pay-to-start are classic recruitment-scam patterns.',
  ai: 'Listings generated wholesale by AI tend to be fluent but hollow — a sign nobody is really hiring.',
  llm: 'Our AI judge weighs how authentic and human-written the posting reads overall.',
};

interface SignalCardProps {
  reason: Reason;
  band: RiskBand;
  maxAbs: number;
  index: number;
  animate: boolean;
  reducedMotion: boolean;
}

function TrendArrow({ up, color }: { up: boolean; color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {up ? <path d="M6 18L18 6M9 6h9v9" /> : <path d="M6 6l12 12M9 18h9V9" />}
    </svg>
  );
}

export function SignalCard({
  reason,
  band,
  maxAbs,
  index,
  animate,
  reducedMotion,
}: SignalCardProps) {
  const [open, setOpen] = useState(false);
  const positive = reason.signed >= 0;
  const accent = positive ? POSITIVE : VERDICTS[band].solid;
  const deep = positive ? POSITIVE_DEEP : VERDICTS[band].deep;
  const accentTop = `color-mix(in oklab, ${accent} 58%, white)`;
  const strength = strengthLabel(Math.abs(reason.signed));
  const pct = Math.max(8, Math.round((Math.abs(reason.signed) / Math.max(1, maxAbs)) * 100));
  const label = SIGNAL_LABELS[reason.signalKey] ?? reason.signalKey;
  const quoted = reason.evidenceQuote ? `“${reason.evidenceQuote}”` : '';
  const move = animate && !reducedMotion;

  const cardBackground = `linear-gradient(var(--surface), var(--surface)) padding-box, linear-gradient(150deg, color-mix(in oklab, ${accent} 55%, transparent), color-mix(in oklab, ${accent} 6%, var(--border)) 58%) border-box`;

  return (
    <li
      className="gjd-signal gjd-focus"
      style={{
        listStyle: 'none',
        position: 'relative',
        padding: '13px 14px',
        borderRadius: 'var(--r-card)',
        border: '1px solid transparent',
        background: cardBackground,
        boxShadow: 'inset 0 1px 0 color-mix(in oklab, white 6%, transparent)',
        animation: move ? 'gjd-rise var(--dur-standard) var(--ease-expo) both' : undefined,
        animationDelay: move ? `${index * 55}ms` : undefined,
      }}
    >
      <button
        type="button"
        className="gjd-focus"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          all: 'unset',
          display: 'flex',
          gap: 11,
          alignItems: 'flex-start',
          cursor: 'pointer',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 32,
            height: 32,
            flexShrink: 0,
            borderRadius: 9,
            color: accent,
            background: `color-mix(in oklab, ${accent} 15%, transparent)`,
            border: `1px solid color-mix(in oklab, ${accent} 28%, transparent)`,
            boxShadow: `0 0 16px -6px ${accent}`,
          }}
        >
          <TrendArrow up={positive} color={accent} />
        </span>

        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span
              style={{
                flex: 1,
                fontSize: 'var(--t-base)',
                fontWeight: 600,
                lineHeight: 1.35,
                color: 'var(--ink)',
              }}
            >
              {reason.text}
            </span>
            <span
              title={`${strength} ${positive ? 'positive' : 'negative'} signal`}
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                marginTop: 1,
                fontSize: 'var(--t-2xs)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '3px 9px',
                borderRadius: 'var(--r-pill)',
                color: `light-dark(${deep}, ${accent})`,
                background: `color-mix(in oklab, ${accent} 13%, transparent)`,
                border: `1px solid color-mix(in oklab, ${accent} 28%, transparent)`,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: 'currentColor',
                  flexShrink: 0,
                }}
              />
              {strength}
            </span>
          </span>

          <span style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 9 }}>
            <span
              style={{
                fontSize: 'var(--t-2xs)',
                color: 'var(--ink-muted)',
                whiteSpace: 'nowrap',
                fontWeight: 500,
              }}
            >
              {label}
            </span>
            <span
              aria-hidden="true"
              style={{
                position: 'relative',
                flex: 1,
                height: 6,
                borderRadius: 'var(--r-pill)',
                background: 'var(--surface-2)',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: `${pct}%`,
                  borderRadius: 'var(--r-pill)',
                  background: `linear-gradient(90deg, ${accentTop}, ${accent})`,
                  boxShadow: `0 0 10px -1px color-mix(in oklab, ${accent} 70%, transparent)`,
                  transformOrigin: 'left',
                  transform: move ? 'scaleX(0)' : 'scaleX(1)',
                  animation: move
                    ? `gjd-barfill var(--dur-standard) var(--ease-expo) ${index * 55 + 120}ms forwards`
                    : undefined,
                }}
              />
            </span>
            <ChevronIcon
              size={13}
              style={{
                flexShrink: 0,
                color: 'var(--ink-faint)',
                transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform var(--dur-micro) var(--ease-quart)',
              }}
            />
          </span>
        </span>
      </button>

      <div
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows var(--dur-standard) var(--ease-quart)',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0)' : 'translateY(-4px)',
              transition:
                'opacity var(--dur-standard) var(--ease-expo), transform var(--dur-standard) var(--ease-expo)',
              paddingTop: 11,
              marginLeft: 43,
            }}
          >
            {quoted && (
              <blockquote
                style={{
                  margin: 0,
                  paddingLeft: 11,
                  borderLeft: `2px solid color-mix(in oklab, ${accent} 50%, transparent)`,
                  fontSize: 'var(--t-sm)',
                  fontStyle: 'italic',
                  color: 'var(--ink-soft)',
                  lineHeight: 1.45,
                }}
              >
                {quoted}
              </blockquote>
            )}
            <p
              style={{
                margin: quoted ? '8px 0 0' : 0,
                fontSize: 'var(--t-xs)',
                color: 'var(--ink-muted)',
                lineHeight: 1.5,
              }}
            >
              {WHY_IT_MATTERS[reason.signalKey]}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}
