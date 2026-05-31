/**
 * SignalBreakdownDrawer — the expandable bottom drawer of weighted bars.
 *
 * Hero Score redesign:
 *   - Uppercase eyebrow "SIGNAL BREAKDOWN" header at top of drawer
 *   - Bars wrapped in a divider-topped section to read as one group
 *   - Bar fill: same band color but with a subtle gradient toward the right
 *     for a sense of progress/depth
 *
 * Motion (D-50): max-height transitions 0 → 320px over 300ms with
 * cubic-bezier(0.25, 1, 0.5, 1) (ease-out-quart — slightly snappier than
 * EASE_OUT_SOFT; drawer is secondary motion, not the hero). Each bar's
 * width transitions 0 → min(100, contribution*2)% with the same easing.
 *
 * UI-SPEC line 370 — simplified v1 rule: ALL bars use RISK_COLORS[band]
 * (the band color of the final score), NOT per-signal directional color.
 * Single visual story per overlay.
 *
 * `inert` attribute when collapsed (UI-SPEC §Accessibility): removes the
 * collapsed drawer's contents from tab order + screen reader output.
 * React's TS types don't yet cover the inert attribute fully — the spread
 * `{...(!open && { inert: '' as unknown as boolean })}` is the verified
 * workaround.
 */

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
      className="overflow-hidden border-t border-(--color-border) bg-(--color-surface-subtle) transition-[max-height] duration-300"
      style={{
        maxHeight: open ? '320px' : '0',
        transitionTimingFunction: EASE_OUT_QUART,
        backgroundColor: open ? 'var(--color-surface-subtle, #f3f4f7)' : 'var(--color-surface-subtle, #f3f4f7)',
      }}
      aria-hidden={!open}
      {...(!open && { inert: '' as unknown as boolean })}
    >
      <div className="px-4 pt-3 pb-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-ink-muted) mb-2">
          Signal Breakdown
        </h3>
        <div className="space-y-2.5">
          {breakdown.map((bar) => (
            <div key={bar.key}>
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] font-medium text-(--color-ink)">
                  {SIGNAL_LABELS[bar.key]}
                </span>
                <span className="text-[11px] text-(--color-ink-muted) tabular-nums">
                  {Math.round(bar.weight * 100)}%
                </span>
              </div>
              <div className="mt-1 h-1.5 bg-(--color-surface) border border-(--color-border) rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: open
                      ? `${Math.min(100, bar.contribution * 2)}%`
                      : '0%',
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
