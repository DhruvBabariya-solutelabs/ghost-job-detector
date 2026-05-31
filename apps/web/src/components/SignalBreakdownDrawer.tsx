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
                  width: open ? `${Math.min(100, bar.contribution * 2)}%` : '0%',
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
