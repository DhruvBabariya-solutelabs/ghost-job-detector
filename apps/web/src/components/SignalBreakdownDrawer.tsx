/**
 * SignalBreakdownDrawer (web) — the expandable bottom drawer of weighted bars.
 *
 * D-70 duplicated v1 from apps/extension/src/content/overlay/SignalBreakdownDrawer.tsx.
 * Phase 5 UI-SPEC §"Signal-breakdown drawer" + 04-UI-SPEC lines 354-382 + D-50
 * motion timing.
 *
 * Motion (D-50): max-height transitions 0 → 288px over 300ms with
 * cubic-bezier(0.25, 1, 0.5, 1) (ease-out-quart — slightly snappier than
 * EASE_OUT_SOFT; drawer is secondary motion, not the hero). Each bar's
 * width transitions 0 → min(100, contribution*2)% with the same easing.
 *
 * UI-SPEC line 370 — simplified v1 rule: ALL bars use RISK_COLORS[band]
 * (the band color of the final score), NOT per-signal directional color.
 * Single visual story per overlay/web surface.
 *
 * `inert` attribute when collapsed (UI-SPEC §Accessibility): removes the
 * collapsed drawer's contents from tab order + screen reader output.
 * React 19 supports `inert` as a proper boolean prop; using `|| undefined`
 * omits the attribute entirely when the drawer is open.
 *
 * Web app uses the `@/lib/labels` path alias instead of the extension's
 * relative `./labels.js` import.
 */

import type { RiskBand, SignalBreakdownEntry } from '@ghost/shared';
import { RISK_COLORS } from '@ghost/shared';
import { SIGNAL_LABELS } from '@/lib/labels';

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
  return (
    <section
      id={drawerId}
      className="overflow-hidden border-t border-[--color-border] transition-[max-height] duration-300"
      style={{
        maxHeight: open ? '288px' : '0',
        transitionTimingFunction: EASE_OUT_QUART,
      }}
      aria-hidden={!open}
      inert={!open || undefined}
    >
      <div className="p-4 space-y-2">
        {breakdown.map((bar) => (
          <div key={bar.key}>
            <div className="flex items-baseline justify-between">
              <span className="text-sm">{SIGNAL_LABELS[bar.key]}</span>
              <span className="text-xs text-[--color-ink-muted]">
                {Math.round(bar.weight * 100)}%
              </span>
            </div>
            <div className="mt-1 h-1.5 bg-[--color-surface-subtle] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{
                  width: open
                    ? `${Math.min(100, bar.contribution * 2)}%`
                    : '0%',
                  backgroundColor: RISK_COLORS[band],
                  transitionTimingFunction: EASE_OUT_QUART,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
