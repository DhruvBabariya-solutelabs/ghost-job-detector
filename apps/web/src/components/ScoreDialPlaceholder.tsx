import { ANALYZE_PATH, RISK_BANDS } from '@ghost/shared';

/**
 * ScoreDialPlaceholder — Phase 1 sentinel, Phase 2 rewired.
 *
 * Renders all four risk-band tokens visibly so the Foundation phase can prove,
 * with a single page-render check, that:
 *   1. The @ghost/shared workspace dep resolved (ANALYZE_PATH + RISK_BANDS
 *      imported — Phase 2 retired the Phase-1 SHARED_PACKAGE_NAME sentinel;
 *      real contract constants now prove cross-package resolution)
 *   2. The theme.css @import wired up Tailwind v4 utilities
 *   3. The four locked semantic risk-band tokens (D-06) render with their colors
 *
 * Risk-band labels and thresholds are pulled from the canonical RISK_BANDS
 * tuple in @ghost/shared/risk so the SHRD-05 "thresholds-live-in-one-file"
 * gate stays clean — this placeholder does not duplicate the literals 80/50/20.
 *
 * Phase 5 (Web App) replaces this with the real animated <ScoreDial>.
 */
export function ScoreDialPlaceholder() {
  return (
    <div
      style={{ padding: '2rem' }}
      data-analyze-path={ANALYZE_PATH}
      data-testid="score-dial-placeholder"
    >
      <h1 className="text-xl">Ghost Job Detector — Foundation OK</h1>
      <p className="text-base">
        Workspace import resolved; analyze path: <code>{ANALYZE_PATH}</code>
      </p>
      <ul className="text-sm" style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
        {RISK_BANDS.map((band) => (
          <li key={band.key} className={`text-risk-${band.key}`}>
            {band.label} (score {band.min}-{band.max})
          </li>
        ))}
      </ul>
    </div>
  );
}
