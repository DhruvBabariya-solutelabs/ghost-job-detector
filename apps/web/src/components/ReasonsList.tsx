import type { Reason } from '@ghost/shared';

export interface ReasonsListProps {
  reasons: Reason[];
}

export function ReasonsList({ reasons }: ReasonsListProps) {
  const visibleReasons = reasons.slice(0, 5);

  if (visibleReasons.length === 0) {
    return (
      <div className="pt-2 border-t border-[--color-border]">
        <h3 className="text-sm font-semibold pb-2">Why this score</h3>
        <p className="text-sm text-[--color-ink-muted]">Couldn't summarize this posting</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold pt-2 pb-2 border-t border-[--color-border]">
        Why this score
      </h3>
      <ul className="space-y-2">
        {visibleReasons.map((reason, index) => {
          const positive = reason.signed >= 0;
          const chipStyle = positive
            ? {
                backgroundColor: 'color-mix(in oklch, #16a34a 22%, transparent)',
                color: 'var(--color-risk-legitimate-fg)',
                borderColor: 'color-mix(in oklch, #16a34a 40%, transparent)',
              }
            : {
                backgroundColor: 'color-mix(in oklch, #dc2626 22%, transparent)',
                color: 'var(--color-risk-ghost-fg)',
                borderColor: 'color-mix(in oklch, #dc2626 40%, transparent)',
              };
          const key = `${reason.signalKey}-${index}`;
          const quoted = reason.evidenceQuote ? `“${reason.evidenceQuote}”` : '';
          return (
            <li key={key} className="py-1">
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm flex-1">{reason.text}</p>
                <span
                  className="inline-block text-center px-1.5 py-0.5 text-xs font-medium rounded-sm border"
                  style={{ minWidth: '36px', ...chipStyle }}
                >
                  {reason.signed > 0 ? '+' : ''}
                  {reason.signed}
                </span>
              </div>
              {reason.evidenceQuote && (
                <p
                  className="mt-1 text-xs text-[--color-ink-muted] bg-[--color-surface-subtle] px-2 py-1 rounded-sm truncate"
                  title={quoted}
                >
                  {quoted}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
