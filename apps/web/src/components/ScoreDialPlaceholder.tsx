import { ANALYZE_PATH, RISK_BANDS } from '@ghost/shared';

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
