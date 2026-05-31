/**
 * ReasonsList — "Why this score" section with up to 5 reason rows.
 *
 * v3 redesign (post-feedback 2026-05-27 evening):
 *   - Directional triangle icon (▼ risk / ▲ good sign) replaces the plain
 *     bullet dot — direction is now encoded visually, not just numerically.
 *   - Chip text reduced to a single intensity word ("Strong" / "Notable" /
 *     "Mild"); the +/− glyph was redundant once the arrow shows direction.
 *   - Evidence quote moved from a heavy bordered pill to a 2px-left-border
 *     blockquote with a leading ❝ glyph — feels more like a citation, less
 *     like a UI chip.
 *   - Tighter vertical rhythm (gap-2.5 → gap-3) and consistent indent so
 *     reason text + quote line up visually.
 *
 * Magnitude thresholds (matches the scoring engine's typical per-field range
 * after rounding in label.ts):
 *   |signed| ≥ 16  → Strong
 *   |signed| ≥ 8   → Notable
 *   otherwise      → Mild
 *
 * Engine-misbehavior edge cases (UI-SPEC line 573-574):
 *   - reasons.length > 5 → render first 5 only.
 *   - reasons.length === 0 → inline "Couldn't summarize this posting" message;
 *     never silently render an empty section.
 *
 * Quote characters: U+201C / U+201D (typographic) — NOT ASCII " (U+0022).
 */

import type { Reason, RiskBand } from '@ghost/shared';
import { RISK_COLORS } from '@ghost/shared';

export interface ReasonsListProps {
  reasons: Reason[];
  /** Drives the negative-arrow tint so reasons stay keyed to the verdict. */
  band: RiskBand;
}

function intensityLabel(absSigned: number): 'Mild' | 'Notable' | 'Strong' {
  if (absSigned >= 16) return 'Strong';
  if (absSigned >= 8) return 'Notable';
  return 'Mild';
}

/** Filled equilateral triangle pointing down — used for risk-leaning rows. */
function DownTriangle({ className, color }: { className?: string; color: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 5 L13 5 L8 12 Z" fill={color} />
    </svg>
  );
}

/** Filled equilateral triangle pointing up — used for trust-leaning rows. */
function UpTriangle({ className, color }: { className?: string; color: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 11 L13 11 L8 4 Z" fill={color} />
    </svg>
  );
}

// Hex constants for the good-sign arrow & chip — matches the green tint used
// throughout the overlay (Phase 5 tokens). Negatives use the verdict's RISK_COLOR.
const POSITIVE_ACCENT = '#16a34a';
const POSITIVE_DEEP = '#15803d';

export function ReasonsList({ reasons, band }: ReasonsListProps) {
  const visibleReasons = reasons.slice(0, 5);
  const negativeAccent = RISK_COLORS[band];

  if (visibleReasons.length === 0) {
    return (
      <div className="pt-3 border-t border-(--color-border)">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-ink-muted) pb-2">
          Why this score
        </h3>
        <p className="text-sm text-(--color-ink-muted)">
          Couldn't summarize this posting
        </p>
      </div>
    );
  }

  return (
    <div className="pt-3 border-t border-(--color-border)">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-ink-muted) pb-2.5">
        Why this score
      </h3>
      <ul className="space-y-3">
        {visibleReasons.map((reason, index) => {
          const positive = reason.signed >= 0;
          const intensity = intensityLabel(Math.abs(reason.signed));
          const accent = positive ? POSITIVE_ACCENT : negativeAccent;
          const deep = positive ? POSITIVE_DEEP : undefined;

          // Chip styling — translucent tint + matching border + deep text.
          const chipStyle = {
            backgroundColor: `color-mix(in oklch, ${accent} 12%, transparent)`,
            borderColor: `color-mix(in oklch, ${accent} 28%, transparent)`,
            color: deep ?? accent,
          };

          // Engine never emits duplicate reason rows; index is a safe key fallback.
          const key = `${reason.signalKey}-${index}`;
          // U+201C / U+201D — typographic curly quotes wrap the evidence text.
          const quoted = reason.evidenceQuote
            ? `“${reason.evidenceQuote}”`
            : '';

          return (
            <li key={key}>
              <div className="flex items-start gap-2">
                {positive ? (
                  <UpTriangle
                    className="w-3.5 h-3.5 mt-[3px] shrink-0"
                    color={accent}
                  />
                ) : (
                  <DownTriangle
                    className="w-3.5 h-3.5 mt-[3px] shrink-0"
                    color={accent}
                  />
                )}
                <p className="text-[13px] leading-[1.45] flex-1 text-(--color-ink)">
                  {reason.text}
                </p>
                <span
                  className="inline-flex items-center px-2 py-[2px] text-[10px] font-semibold rounded-full border whitespace-nowrap uppercase tracking-wide"
                  style={chipStyle}
                  aria-label={`${intensity} ${positive ? 'positive' : 'negative'} signal`}
                >
                  {intensity}
                </span>
              </div>
              {reason.evidenceQuote && (
                <blockquote
                  className="mt-1.5 ml-5 pl-2.5 py-0.5 text-[11px] italic text-(--color-ink-muted) leading-snug"
                  style={{
                    borderLeft: `2px solid color-mix(in oklch, ${accent} 50%, transparent)`,
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
            </li>
          );
        })}
      </ul>
      <p className="mt-3.5 text-[10px] leading-[1.4] text-(--color-ink-muted)">
        Score is the engine's weighted verdict across all signals — individual
        flags don't add up to it directly.
      </p>
    </div>
  );
}
