/**
 * ReasonsList (web) — "Why this score" section with up to 5 reason rows.
 *
 * D-70 duplicated v1 from apps/extension/src/content/overlay/ReasonsList.tsx.
 * Phase 5 UI-SPEC §"Reasons list" + 04-UI-SPEC lines 322-352.
 *
 * Row shape:
 *   - Line 1: reason text (14px Regular ink) + signed chip on the right
 *     (`+N` green-tinted / `-N` red-tinted; min-width 36px so `+8` aligns
 *     with `-12`).
 *   - Line 2 (only if evidenceQuote present): typographic-quote pill,
 *     12px muted-ink on surface-subtle, single-line truncate; native
 *     `title` attribute carries the full quote for hover access.
 *
 * Engine-misbehavior edge cases (UI-SPEC line 573-574):
 *   - reasons.length > 5 → render first 5 only.
 *   - reasons.length === 0 → inline "Couldn't summarize this posting" message;
 *     never silently render an empty section.
 *
 * Quote characters: U+201C ("LEFT DOUBLE QUOTATION MARK") and U+201D
 * ("RIGHT DOUBLE QUOTATION MARK") — NOT ASCII " (U+0022). Typographic
 * quotes are the verified UI-SPEC form.
 *
 * Note: signed-chip colors are hardcoded green-#16a34a / red-#dc2626 (NOT
 * band-dependent) — matches extension precedent. ReasonsList does NOT
 * import BAND_DEEP_TEXT.
 */

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
        <p className="text-sm text-[--color-ink-muted]">
          Couldn't summarize this posting
        </p>
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
          // Dark-mode-tuned: brighter fg variants + slightly stronger bg tint
          // so chips read on the dark surface. Border alpha bumped for definition.
          const chipStyle = positive
            ? {
                backgroundColor:
                  'color-mix(in oklch, #16a34a 22%, transparent)',
                color: 'var(--color-risk-legitimate-fg)',
                borderColor:
                  'color-mix(in oklch, #16a34a 40%, transparent)',
              }
            : {
                backgroundColor:
                  'color-mix(in oklch, #dc2626 22%, transparent)',
                color: 'var(--color-risk-ghost-fg)',
                borderColor:
                  'color-mix(in oklch, #dc2626 40%, transparent)',
              };
          // Engine never emits duplicate reason rows; index is a safe key fallback.
          const key = `${reason.signalKey}-${index}`;
          // U+201C / U+201D — typographic curly quotes wrap the evidence text.
          const quoted = reason.evidenceQuote
            ? `“${reason.evidenceQuote}”`
            : '';
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
