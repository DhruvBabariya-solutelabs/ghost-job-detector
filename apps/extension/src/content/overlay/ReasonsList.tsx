import type { Reason, RiskBand } from '@ghost/shared';
import { RISK_COLORS } from '@ghost/shared';
import { SIGNAL_LABELS } from './labels.js';

export interface ReasonsListProps {
  reasons: Reason[];
  band: RiskBand;
}

function intensityLabel(absSigned: number): 'Mild' | 'Notable' | 'Strong' {
  if (absSigned >= 16) return 'Strong';
  if (absSigned >= 8) return 'Notable';
  return 'Mild';
}

function TrendArrow({ up, color }: { up: boolean; color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {up ? <path d="M6 18L18 6M9 6h9v9" /> : <path d="M6 6l12 12M9 18h9V9" />}
    </svg>
  );
}

const POSITIVE_ACCENT = '#34e89e';

export function ReasonsList({ reasons, band }: ReasonsListProps) {
  const visibleReasons = reasons.slice(0, 5);
  const negativeAccent = RISK_COLORS[band];
  const maxAbs = visibleReasons.reduce((m, r) => Math.max(m, Math.abs(r.signed)), 1);

  if (visibleReasons.length === 0) {
    return (
      <div className="pt-3 border-t border-(--ov-border)">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--ov-ink-muted) pb-2">
          Why this score
        </h3>
        <p className="text-sm text-(--ov-ink-muted)">Couldn't summarize this posting</p>
      </div>
    );
  }

  return (
    <div className="pt-3 border-t border-(--ov-border)">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--ov-ink-muted) pb-2.5">
        Why this score
      </h3>
      <ul className="space-y-2">
        {visibleReasons.map((reason, index) => {
          const positive = reason.signed >= 0;
          const intensity = intensityLabel(Math.abs(reason.signed));
          const accent = positive ? POSITIVE_ACCENT : negativeAccent;
          const brightText = `color-mix(in oklch, ${accent} 74%, white)`;
          const accentTop = `color-mix(in oklch, ${accent} 58%, white)`;
          const pct = Math.max(6, Math.round((Math.abs(reason.signed) / maxAbs) * 100));
          const key = `${reason.signalKey}-${index}`;
          const quoted = reason.evidenceQuote ? `“${reason.evidenceQuote}”` : '';

          const cardBackground = `linear-gradient(var(--ov-surface), var(--ov-surface)) padding-box, linear-gradient(150deg, color-mix(in oklch, ${accent} 50%, transparent), var(--ov-border) 60%) border-box`;

          const chipStyle = {
            backgroundColor: `color-mix(in oklch, ${accent} 16%, transparent)`,
            borderColor: `color-mix(in oklch, ${accent} 36%, transparent)`,
            color: brightText,
          };

          return (
            <li
              key={key}
              className="gjd-ov-reason gjd-ov-rise relative overflow-hidden rounded-xl p-3"
              style={{
                border: '1px solid transparent',
                background: cardBackground,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                animationDelay: `${index * 55}ms`,
              }}
            >
              <div className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className="grid place-items-center w-8 h-8 shrink-0 rounded-[9px]"
                  style={{
                    color: accent,
                    backgroundColor: `color-mix(in oklch, ${accent} 16%, transparent)`,
                    border: `1px solid color-mix(in oklch, ${accent} 32%, transparent)`,
                    boxShadow: `0 0 16px -6px ${accent}`,
                  }}
                >
                  <TrendArrow up={positive} color={accent} />
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] leading-[1.35] flex-1 text-(--ov-ink) font-medium">
                      {reason.text}
                    </p>
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-[3px] text-[10px] font-semibold rounded-full border whitespace-nowrap uppercase tracking-wide mt-[1px]"
                      style={chipStyle}
                      title={`${intensity} ${positive ? 'positive' : 'negative'} signal`}
                    >
                      <span className="w-[5px] h-[5px] rounded-full bg-current shrink-0" />
                      {intensity}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-[10px] font-medium text-(--ov-ink-muted) whitespace-nowrap">
                      {SIGNAL_LABELS[reason.signalKey]}
                    </span>
                    <span className="relative flex-1 h-1.5 rounded-full bg-(--ov-surface-2) overflow-hidden">
                      <span
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundImage: `linear-gradient(90deg, ${accentTop}, ${accent})`,
                          boxShadow: `0 0 10px -1px color-mix(in oklch, ${accent} 65%, transparent)`,
                          transformOrigin: 'left',
                          animation: `gjd-ov-bar 340ms cubic-bezier(0.16, 1, 0.3, 1) ${index * 55 + 120}ms both`,
                        }}
                      />
                    </span>
                  </div>

                  {quoted && (
                    <blockquote
                      className="mt-2 pl-2.5 text-[11px] italic text-(--ov-ink-soft) leading-snug"
                      style={{
                        borderLeft: `2px solid color-mix(in oklch, ${accent} 55%, transparent)`,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                      title={quoted}
                    >
                      {quoted}
                    </blockquote>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[10px] leading-[1.4] text-(--ov-ink-faint)">
        The score is the engine's weighted verdict across every signal — individual flags don't add
        up to it directly.
      </p>
    </div>
  );
}
