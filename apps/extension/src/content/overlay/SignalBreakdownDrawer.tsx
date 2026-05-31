import type { RiskBand, SignalBreakdownEntry } from '@ghost/shared';
import { RISK_COLORS } from '@ghost/shared';
import { SIGNAL_LABELS } from './labels.js';

const EASE_OUT_QUART = 'cubic-bezier(0.25, 1, 0.5, 1)';

export interface SignalBreakdownDrawerProps {
  breakdown: SignalBreakdownEntry[];
  open: boolean;
  band: RiskBand;
  drawerId: string;
}

export function SignalBreakdownDrawer({
  breakdown,
  open,
  band,
  drawerId,
}: SignalBreakdownDrawerProps) {
  const accent = RISK_COLORS[band];
  const barGradient = `linear-gradient(90deg, color-mix(in oklch, ${accent} 88%, transparent), ${accent})`;

  return (
    <section
      id={drawerId}
      className="shrink-0 overflow-hidden border-t border-(--ov-border) bg-(--ov-surface) transition-[max-height] duration-300"
      style={{
        maxHeight: open ? '320px' : '0',
        transitionTimingFunction: EASE_OUT_QUART,
      }}
      aria-hidden={!open}
      {...(!open && { inert: '' as unknown as boolean })}
    >
      <div className="px-4 pt-3 pb-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--ov-ink-muted) mb-2">
          Signal Breakdown
        </h3>
        <div className="space-y-2.5">
          {breakdown.map((bar) => (
            <div key={bar.key}>
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] font-medium text-(--ov-ink)">
                  {SIGNAL_LABELS[bar.key]}
                </span>
                <span className="text-[11px] text-(--ov-ink-muted) tabular-nums">
                  {Math.round(bar.weight * 100)}%
                </span>
              </div>
              <div className="mt-1 h-1.5 bg-(--ov-surface-2) rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: open ? `${Math.min(100, bar.contribution * 2)}%` : '0%',
                    backgroundImage: barGradient,
                    transitionTimingFunction: EASE_OUT_QUART,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
