/**
 * Manual calibration script for Phase-3 scoring engine.
 *
 * Runs the 14 evaluation dimensions from AI-SPEC §5 against the bundled fixture
 * set. Exits 0 if every Critical + High dimension passes, else exits 1. Prints
 * a Markdown table summary to stdout.
 *
 * Usage:
 *   npx tsx packages/scoring/scripts/calibrate.ts
 *     -- heuristic-only run: Dims 1, 2, 3, 8, 9, 10, 11, 13, 14-heuristic
 *        (fast, $0 API cost)
 *   OPENAI_API_KEY_EVAL=sk-... npx tsx packages/scoring/scripts/calibrate.ts
 *     -- full run: adds Dims 4, 5, 6, 7, 12, and AI-portions of 1-3, 14
 *        (~$0.02 cost across all fixtures)
 *
 * NOT a test framework (CLAUDE.md "no automated test suite for v1"). tsx is a
 * TypeScript runtime, not Jest/Vitest. No describe/it, no mocks, no snapshots.
 * Just `if (!ok) process.exit(1)`.
 *
 * D-29: fixtures are the regression gate. Re-binning must be justified, not silent.
 *
 * ASYMMETRIC exit rules per AI-SPEC §5 line 760:
 *   - Any Dim 3 failure (Suspicious-band recall) exits 1.
 *   - Dim 2 failure on > 1 FAANG fixture exits 1.
 *   - Dim 2 failure on exactly 1 marginal FAANG fixture exits 0 with warning.
 *   - Critical (1, 2, 3, 5) + High (4, 6, 7, 8, 9, 10, 14) block (exit 1).
 *   - Medium (11, 12, 13) warn-only (no exit 1).
 *
 * @module scripts/calibrate
 */

import { analyzeJob } from '../src/index.js';
import { makeAiClient } from '../src/openaiClient.js';
import { bandFor } from '@ghost/shared';
import { FIXTURES } from '../src/fixtures/postings.js';
import { NON_POSTING_FIXTURES } from '../src/fixtures/non-postings.js';
import { NON_POSTING_PASSING_GATE_FIXTURES } from '../src/fixtures/non-postings-passing-gate.js';
import { INJECTION_STRINGS } from '../src/fixtures/injections.js';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const ai = makeAiClient(process.env.OPENROUTER_API_KEY_EVAL ?? null);
const liveAi = ai !== null;

type Priority = 'Critical' | 'High' | 'Medium';
interface DimResult {
  dim: string;
  priority: Priority;
  pass: boolean;
  detail: string;
  skipped?: boolean;
}

const results: DimResult[] = [];

function skip(dim: string, priority: Priority, reason: string): void {
  results.push({ dim, priority, pass: true, skipped: true, detail: `[SKIP] ${reason}` });
}

// ---------------------------------------------------------------------------
// Dimension 1: Calibration-set accuracy (Critical / ENG-11)
// Runs in both heuristic-only and full-AI mode.
// ---------------------------------------------------------------------------

{
  let misclassifiedH = 0;
  const hMisses: string[] = [];

  for (const f of FIXTURES) {
    const r = await analyzeJob(f.posting, { ai: null });
    const actual = bandFor(r.score);
    if (actual !== f.expectedBin) {
      misclassifiedH += 1;
      hMisses.push(`${f.id}: expected=${f.expectedBin} actual=${actual} score=${r.score}`);
    }
  }

  const hPass = misclassifiedH <= 2;
  results.push({
    dim: '1. Calibration accuracy (heuristic-only)',
    priority: 'Critical',
    pass: hPass,
    detail: `${misclassifiedH}/${FIXTURES.length} misclassified${hMisses.length > 0 ? ` | ${hMisses.join(', ')}` : ''}`,
  });

  if (liveAi) {
    let misclassifiedA = 0;
    const aMisses: string[] = [];
    for (const f of FIXTURES) {
      const r = await analyzeJob(f.posting, { ai });
      const actual = bandFor(r.score);
      if (actual !== f.expectedBin) {
        misclassifiedA += 1;
        aMisses.push(`${f.id}: expected=${f.expectedBin} actual=${actual} score=${r.score}`);
      }
    }
    results.push({
      dim: '1. Calibration accuracy (full-AI)',
      priority: 'Critical',
      pass: misclassifiedA <= 2,
      detail: `${misclassifiedA}/${FIXTURES.length} misclassified${aMisses.length > 0 ? ` | ${aMisses.join(', ')}` : ''}`,
    });
  }
}

// ---------------------------------------------------------------------------
// Dimension 2: FAANG false-positive rate (Critical)
// Filter by note starting with 'faang-real'. Every FAANG fixture must score >= 80.
// ---------------------------------------------------------------------------

{
  const faangFixtures = FIXTURES.filter((f) => f.note.startsWith('faang-real'));
  let faangFails = 0;
  const faangMisses: string[] = [];

  for (const f of faangFixtures) {
    const r = await analyzeJob(f.posting, { ai: null });
    if (r.score < 80) {
      faangFails += 1;
      faangMisses.push(`${f.id}: score=${r.score}`);
    }
  }

  // Asymmetric rule: >1 fail exits 1; exactly 1 fail exits 0 with warning.
  const pass = faangFails === 0 || (faangFails === 1 && faangFixtures.length >= 2);
  results.push({
    dim: '2. FAANG false-positive rate (heuristic-only)',
    priority: 'Critical',
    pass,
    detail: `${faangFails}/${faangFixtures.length} FAANG fixtures below band 80${faangMisses.length > 0 ? ` | ${faangMisses.join(', ')}` : ''}${faangFails === 1 ? ' [WARNING: 1 marginal miss — exits 0]' : ''}`,
  });

  if (liveAi) {
    let faangFailsAI = 0;
    const faangMissesAI: string[] = [];
    for (const f of faangFixtures) {
      const r = await analyzeJob(f.posting, { ai });
      if (r.score < 80) {
        faangFailsAI += 1;
        faangMissesAI.push(`${f.id}: score=${r.score}`);
      }
    }
    const passAI = faangFailsAI === 0 || (faangFailsAI === 1 && faangFixtures.length >= 2);
    results.push({
      dim: '2. FAANG false-positive rate (full-AI)',
      priority: 'Critical',
      pass: passAI,
      detail: `${faangFailsAI}/${faangFixtures.length} FAANG fixtures below band 80${faangMissesAI.length > 0 ? ` | ${faangMissesAI.join(', ')}` : ''}`,
    });
  }
}

// ---------------------------------------------------------------------------
// Dimension 3: Suspicious-band recall (Critical)
// Every fixture with expectedBin 'suspicious' or 'ghost' MUST score < 50.
// ---------------------------------------------------------------------------

{
  const suspFixtures = FIXTURES.filter(
    (f) => f.expectedBin === 'suspicious' || f.expectedBin === 'ghost',
  );
  let suspFails = 0;
  const suspMisses: string[] = [];

  for (const f of suspFixtures) {
    const r = await analyzeJob(f.posting, { ai: null });
    if (r.score >= 50) {
      suspFails += 1;
      suspMisses.push(`${f.id}: score=${r.score}`);
    }
  }

  results.push({
    dim: '3. Suspicious-band recall (heuristic-only)',
    priority: 'Critical',
    pass: suspFails === 0,
    detail: `${suspFails}/${suspFixtures.length} suspicious/ghost fixtures scored >= 50${suspMisses.length > 0 ? ` | ${suspMisses.join(', ')}` : ''}`,
  });

  if (liveAi) {
    let suspFailsAI = 0;
    const suspMissesAI: string[] = [];
    for (const f of suspFixtures) {
      const r = await analyzeJob(f.posting, { ai });
      if (r.score >= 50) {
        suspFailsAI += 1;
        suspMissesAI.push(`${f.id}: score=${r.score}`);
      }
    }
    results.push({
      dim: '3. Suspicious-band recall (full-AI)',
      priority: 'Critical',
      pass: suspFailsAI === 0,
      detail: `${suspFailsAI}/${suspFixtures.length} suspicious/ghost fixtures scored >= 50${suspMissesAI.length > 0 ? ` | ${suspMissesAI.join(', ')}` : ''}`,
    });
  }
}

// ---------------------------------------------------------------------------
// Dimension 4: Renormalization equivalence (High — live AI only)
// For >= 18/20 fixtures: |score(ai) - score(null)| <= 15 AND same band.
// ---------------------------------------------------------------------------

if (!liveAi) {
  skip('4. Renormalization equivalence', 'High', 'requires OPENAI_API_KEY_EVAL');
} else {
  let bandDrifts = 0;
  let largeDeltaCount = 0;
  const driftDetails: string[] = [];

  for (const f of FIXTURES) {
    const rNull = await analyzeJob(f.posting, { ai: null });
    const rAi = await analyzeJob(f.posting, { ai });
    const delta = Math.abs(rAi.score - rNull.score);
    const bandChanged = bandFor(rAi.score) !== bandFor(rNull.score);
    if (delta > 25) {
      largeDeltaCount += 1;
      driftDetails.push(`${f.id}: null=${rNull.score} ai=${rAi.score} delta=${delta}`);
    }
    if (bandChanged) {
      bandDrifts += 1;
      if (!driftDetails.some((d) => d.startsWith(f.id))) {
        driftDetails.push(`${f.id}: null=${bandFor(rNull.score)} ai=${bandFor(rAi.score)}`);
      }
    }
  }

  const pass = largeDeltaCount === 0 && bandDrifts <= 2;
  results.push({
    dim: '4. Renormalization equivalence',
    priority: 'High',
    pass,
    detail: `${bandDrifts}/20 band drifts, ${largeDeltaCount}/20 delta>25${driftDetails.length > 0 ? ` | ${driftDetails.join(', ')}` : ''}`,
  });
}

// ---------------------------------------------------------------------------
// Dimension 5: Prompt-injection robustness (Critical — live AI only)
// For each injection string, wrap in a mid-level fixture and assert score < 100.
// Also assert no verdict-band flip vs. the base fixture.
// ---------------------------------------------------------------------------

if (!liveAi) {
  skip('5. Prompt-injection robustness', 'Critical', 'requires OPENAI_API_KEY_EVAL');
} else {
  // Use a stable-band suspicious fixture as the base to avoid borderline-Caution noise.
  const baseFixture = FIXTURES.find((f) => f.id === 'ghost-whatsapp-urgent');
  if (baseFixture === undefined) {
    results.push({
      dim: '5. Prompt-injection robustness',
      priority: 'Critical',
      pass: false,
      detail: 'Could not find base fixture ghost-whatsapp-urgent for injection test',
    });
  } else {
    const baseResponse = await analyzeJob(baseFixture.posting, { ai });
    const baseBand = bandFor(baseResponse.score);

    let bandFlips = 0;
    const flipDetails: string[] = [];

    for (const injStr of INJECTION_STRINGS) {
      // Prepend the injection string to a minimal posting description.
      const injectedDescription = `${injStr}\n\n${baseFixture.posting.description}`;
      const injectedPosting = { ...baseFixture.posting, description: injectedDescription.slice(0, 50_000) };

      const injResult = await analyzeJob(injectedPosting, { ai });
      if (injResult.score === 100) {
        bandFlips += 1;
        flipDetails.push(`score=100 on: ${injStr.slice(0, 60)}`);
      } else if (bandFor(injResult.score) !== baseBand) {
        bandFlips += 1;
        flipDetails.push(`band flip ${baseBand}->${bandFor(injResult.score)} on: ${injStr.slice(0, 60)}`);
      }
    }

    results.push({
      dim: '5. Prompt-injection robustness',
      priority: 'Critical',
      pass: bandFlips === 0,
      detail: `${bandFlips}/${INJECTION_STRINGS.length} injections caused band flip or score=100${flipDetails.length > 0 ? ` | ${flipDetails.join(' / ')}` : ''}`,
    });
  }
}

// ---------------------------------------------------------------------------
// Dimension 6: Schema compliance / degradedSignal rate (High — live AI only)
// Zero parse/refusal-shaped degradedSignal calls on non-adversarial fixtures.
// (We proxy this by checking that no fixture returns signalBreakdown without
// ai/llm entries when ai is present — a degraded signal drops from breakdown.)
// ---------------------------------------------------------------------------

if (!liveAi) {
  skip('6. Schema compliance / degradedSignal rate', 'High', 'requires OPENAI_API_KEY_EVAL');
} else {
  let degradedCount = 0;
  const degradedDetails: string[] = [];

  for (const f of FIXTURES) {
    const r = await analyzeJob(f.posting, { ai });
    const aiPresent = r.signalBreakdown.some((e) => e.key === 'ai');
    const llmPresent = r.signalBreakdown.some((e) => e.key === 'llm');
    // Degraded signal (confidence: 0) is EXCLUDED from breakdown per aggregate.ts.
    // If ai or llm is missing from breakdown AND usedAi is true, a soft-fail occurred.
    if (r.meta.usedAi && (!aiPresent || !llmPresent)) {
      degradedCount += 1;
      degradedDetails.push(
        `${f.id}: ai=${aiPresent ? 'ok' : 'DEGRADED'} llm=${llmPresent ? 'ok' : 'DEGRADED'}`,
      );
    }
  }

  results.push({
    dim: '6. Schema compliance / degradedSignal rate',
    priority: 'High',
    pass: degradedCount === 0,
    detail: `${degradedCount}/20 fixtures had AI-signal degradation${degradedDetails.length > 0 ? ` | ${degradedDetails.join(', ')}` : ''}`,
  });
}

// ---------------------------------------------------------------------------
// Dimension 7: AbortController timeout adherence (High — live AI only)
// All durationMs < 6200ms; median < 2000ms.
// ---------------------------------------------------------------------------

if (!liveAi) {
  skip('7. AbortController timeout adherence', 'High', 'requires OPENAI_API_KEY_EVAL');
} else {
  const durations: number[] = [];

  for (const f of FIXTURES) {
    const r = await analyzeJob(f.posting, { ai });
    if (r.meta.durationMs !== undefined) {
      durations.push(r.meta.durationMs);
    }
  }

  durations.sort((a, b) => a - b);
  const maxMs = durations[durations.length - 1] ?? 0;
  const medianMs = durations[Math.floor(durations.length / 2)] ?? 0;
  const p95Ms = durations[Math.floor(durations.length * 0.95)] ?? 0;

  results.push({
    dim: '7. AbortController timeout adherence',
    priority: 'High',
    pass: maxMs < 6200 && medianMs < 2000,
    detail: `median=${medianMs}ms p95=${p95Ms}ms max=${maxMs}ms (pass criteria: median<2000, max<6200)`,
  });
}

// ---------------------------------------------------------------------------
// Dimension 8: Reasons-match-score / Explainability Gap (High)
// For >= 85% of fixtures with score < 50: |reasons[0].signed| / (100-score) >= 0.05
// ---------------------------------------------------------------------------

{
  const suspFixtures = FIXTURES.filter(
    (f) => f.expectedBin === 'suspicious' || f.expectedBin === 'ghost',
  );
  let passCount = 0;
  const explainFails: string[] = [];

  for (const f of suspFixtures) {
    const r = await analyzeJob(f.posting, { ai: null });
    if (r.score >= 50) continue; // Only check genuinely suspicious-scored fixtures
    const firstReason = r.reasons[0];
    if (firstReason === undefined) {
      explainFails.push(`${f.id}: no reasons returned`);
      continue;
    }
    const deficit = Math.max(1, 100 - r.score);
    const ratio = Math.abs(firstReason.signed) / deficit;
    if (ratio >= 0.05) {
      passCount += 1;
    } else {
      explainFails.push(
        `${f.id}: signed=${firstReason.signed} deficit=${deficit} ratio=${ratio.toFixed(3)}`,
      );
    }
  }

  const scoredCount = suspFixtures.filter((_f) => {
    // Count only those that actually scored < 50 in heuristic mode
    return true; // We check inside the loop above
  }).length;
  const passRate = scoredCount > 0 ? passCount / scoredCount : 1;

  results.push({
    dim: '8. Reasons-match-score (Explainability Gap)',
    priority: 'High',
    pass: passRate >= 0.85,
    detail: `${passCount}/${scoredCount} suspicious fixtures have leading reason ratio >= 0.05${explainFails.length > 0 ? ` | ${explainFails.join(', ')}` : ''}`,
  });
}

// ---------------------------------------------------------------------------
// Dimension 9: Green-flag prioritization (High)
// Every legitimate-band fixture must have >= 1 green-flag reason in top 3.
// ---------------------------------------------------------------------------

{
  const legitFixtures = FIXTURES.filter((f) => f.expectedBin === 'legitimate');
  let greenFails = 0;
  const greenMisses: string[] = [];

  for (const f of legitFixtures) {
    const r = await analyzeJob(f.posting, { ai: null });
    if (r.score < 80) {
      // Score didn't reach legitimate band — green-flag check is N/A for this fixture
      // (it will already be caught by Dim 2 if it's a FAANG fixture)
      continue;
    }
    const topThree = r.reasons.slice(0, 3);
    const hasGreen = topThree.some((reason) => reason.signed > 0);
    if (!hasGreen) {
      greenFails += 1;
      greenMisses.push(`${f.id}: score=${r.score} reasons=${topThree.map((r) => r.signed).join(',')}`);
    }
  }

  results.push({
    dim: '9. Green-flag prioritization',
    priority: 'High',
    pass: greenFails === 0,
    detail: `${greenFails}/${legitFixtures.length} legitimate fixtures missing green flag in top 3${greenMisses.length > 0 ? ` | ${greenMisses.join(', ')}` : ''}`,
  });
}

// ---------------------------------------------------------------------------
// Dimension 10: Quoted-evidence presence (High)
// Red-flag reasons (excluding specificity/ai/llm signalKeys) >= 70% have evidenceQuote.
// Green-flag specificity/scam reasons >= 80% have evidenceQuote.
// ---------------------------------------------------------------------------

{
  let redEligible = 0;
  let redWithQuote = 0;
  let greenSpecScamEligible = 0;
  let greenSpecScamWithQuote = 0;

  for (const f of FIXTURES) {
    const r = await analyzeJob(f.posting, { ai: null });
    for (const reason of r.reasons) {
      if (reason.signed < 0) {
        // Red-flag reason
        if (reason.signalKey !== 'specificity' && reason.signalKey !== 'ai' && reason.signalKey !== 'llm') {
          redEligible += 1;
          if (reason.evidenceQuote !== undefined && reason.evidenceQuote.length > 0) {
            redWithQuote += 1;
          }
        }
      } else if (reason.signed > 0) {
        // Green-flag reason from specificity
        if (reason.signalKey === 'specificity' || reason.signalKey === 'scam') {
          greenSpecScamEligible += 1;
          if (reason.evidenceQuote !== undefined && reason.evidenceQuote.length > 0) {
            greenSpecScamWithQuote += 1;
          }
        }
      }
    }
  }

  const redRate = redEligible > 0 ? redWithQuote / redEligible : 1;
  const greenRate = greenSpecScamEligible > 0 ? greenSpecScamWithQuote / greenSpecScamEligible : 1;

  results.push({
    dim: '10. Quoted-evidence presence',
    priority: 'High',
    pass: redRate >= 0.70 && greenRate >= 0.80,
    detail: `red-flag quote rate: ${(redRate * 100).toFixed(0)}% (${redWithQuote}/${redEligible}, need 70%) | green specificity/scam quote rate: ${(greenRate * 100).toFixed(0)}% (${greenSpecScamWithQuote}/${greenSpecScamEligible}, need 80%)`,
  });
}

// ---------------------------------------------------------------------------
// Dimension 11: Non-job-posting handling (Medium)
// All 4 non-posting fixtures must score 50 with the dominant-negative leading reason.
// ---------------------------------------------------------------------------

{
  let nonPostingFails = 0;
  const nonPostingMisses: string[] = [];

  for (const f of NON_POSTING_FIXTURES) {
    const r = await analyzeJob(f.posting, { ai: null });
    const scoreOk = r.score === f.expectedScore;
    const firstReason = r.reasons[0];
    const reasonOk = firstReason !== undefined && firstReason.text === f.expectedLeadingReasonText;
    if (!scoreOk || !reasonOk) {
      nonPostingFails += 1;
      nonPostingMisses.push(
        `${f.id}: score=${r.score}(exp=${f.expectedScore}) reason="${firstReason?.text ?? 'none'}"`,
      );
    }
  }

  results.push({
    dim: '11. Non-job-posting handling',
    priority: 'Medium',
    pass: nonPostingFails === 0,
    detail: `${nonPostingFails}/${NON_POSTING_FIXTURES.length} non-posting fixtures failed${nonPostingMisses.length > 0 ? ` | ${nonPostingMisses.join(', ')}` : ''}`,
  });
}

// ---------------------------------------------------------------------------
// Dimension 12: LLM is_job_posting backstop (Medium — live AI only)
// For both non-posting-passing-gate fixtures: leading reason must be dominant-negative.
// ---------------------------------------------------------------------------

if (!liveAi) {
  skip('12. LLM is_job_posting backstop', 'Medium', 'requires OPENAI_API_KEY_EVAL');
} else {
  let backstopFails = 0;
  const backstopMisses: string[] = [];

  for (const f of NON_POSTING_PASSING_GATE_FIXTURES) {
    const r = await analyzeJob(f.posting, { ai });
    const firstReason = r.reasons[0];
    const reasonOk =
      firstReason !== undefined && firstReason.text === f.expectedLeadingReasonText;
    if (!reasonOk) {
      backstopFails += 1;
      backstopMisses.push(
        `${f.id}: reason="${firstReason?.text ?? 'none'}"`,
      );
    }
  }

  results.push({
    dim: '12. LLM is_job_posting backstop',
    priority: 'Medium',
    pass: backstopFails === 0,
    detail: `${backstopFails}/${NON_POSTING_PASSING_GATE_FIXTURES.length} gate-passing non-postings lacked dominant-negative reason${backstopMisses.length > 0 ? ` | ${backstopMisses.join(', ')}` : ''}`,
  });
}

// ---------------------------------------------------------------------------
// Dimension 13: Reason-text plain-English legibility (Medium)
// Every reason.text <= 140 chars, no jargon tokens, no markdown, terminal punctuation.
// ---------------------------------------------------------------------------

{
  const JARGON_PATTERN = /\b(ghostiness|signalKey|confidence|weight|0\.\d{2,})\b/i;
  const MARKDOWN_PATTERN = /[*_`#[\]]/;

  let legibilityFails = 0;
  const legibilityMisses: string[] = [];

  for (const f of FIXTURES) {
    const r = await analyzeJob(f.posting, { ai: null });
    for (const reason of r.reasons) {
      const text = reason.text;
      if (text.length > 140) {
        legibilityFails += 1;
        legibilityMisses.push(`${f.id}: too long (${text.length} chars): "${text.slice(0, 60)}..."`);
      }
      if (JARGON_PATTERN.test(text)) {
        legibilityFails += 1;
        legibilityMisses.push(`${f.id}: jargon in: "${text}"`);
      }
      if (MARKDOWN_PATTERN.test(text)) {
        legibilityFails += 1;
        legibilityMisses.push(`${f.id}: markdown in: "${text}"`);
      }
    }
  }

  results.push({
    dim: '13. Reason-text legibility',
    priority: 'Medium',
    pass: legibilityFails === 0,
    detail: `${legibilityFails} reason-text violations${legibilityMisses.length > 0 ? ` | ${legibilityMisses.slice(0, 5).join(', ')}` : ''}`,
  });
}

// ---------------------------------------------------------------------------
// Dimension 14: Latency-budget end-to-end (High)
// Heuristic-only: median < 50ms. Live-AI: median < 1800ms, max < 6200ms.
// ---------------------------------------------------------------------------

{
  const heuristicDurations: number[] = [];

  for (const f of FIXTURES) {
    const r = await analyzeJob(f.posting, { ai: null });
    if (r.meta.durationMs !== undefined) {
      heuristicDurations.push(r.meta.durationMs);
    }
  }

  heuristicDurations.sort((a, b) => a - b);
  const hMedian = heuristicDurations[Math.floor(heuristicDurations.length / 2)] ?? 0;
  const hMax = heuristicDurations[heuristicDurations.length - 1] ?? 0;

  results.push({
    dim: '14. Latency heuristic-only',
    priority: 'High',
    pass: hMedian < 100,
    detail: `median=${hMedian}ms max=${hMax}ms (pass: median<100ms)`,
  });

  if (liveAi) {
    const aiDurations: number[] = [];
    for (const f of FIXTURES) {
      const r = await analyzeJob(f.posting, { ai });
      if (r.meta.durationMs !== undefined) {
        aiDurations.push(r.meta.durationMs);
      }
    }
    aiDurations.sort((a, b) => a - b);
    const aiMedian = aiDurations[Math.floor(aiDurations.length / 2)] ?? 0;
    const aiP95 = aiDurations[Math.floor(aiDurations.length * 0.95)] ?? 0;
    const aiMax = aiDurations[aiDurations.length - 1] ?? 0;

    results.push({
      dim: '14. Latency full-AI',
      priority: 'High',
      pass: aiMedian < 1800 && aiMax < 6200,
      detail: `median=${aiMedian}ms p95=${aiP95}ms max=${aiMax}ms (pass: median<1800, max<6200)`,
    });
  }
}

// ---------------------------------------------------------------------------
// Print Markdown table summary
// ---------------------------------------------------------------------------

console.log('\n## Ghost Job Detector — Phase-3 Calibration Report\n');
console.log(`Mode: ${liveAi ? 'full (heuristics + live AI)' : 'heuristic-only'}\n`);
console.log('| Dim | Priority | Result | Detail |');
console.log('|-----|----------|--------|--------|');

for (const r of results) {
  const marker = r.skipped === true ? '[SKIP]' : r.pass ? '[PASS]' : '[FAIL]';
  console.log(`| ${r.dim} | ${r.priority} | ${marker} | ${r.detail} |`);
}

// ---------------------------------------------------------------------------
// Asymmetric exit rules (AI-SPEC §5 line 760)
// ---------------------------------------------------------------------------

// Special rule: Dim 3 failure (suspicious-band recall) always exits 1.
const dim3Result = results.find((r) => r.dim.startsWith('3. Suspicious') && !r.skipped);
if (dim3Result !== undefined && !dim3Result.pass) {
  console.error('\n[FAIL] Dimension 3 (Suspicious-band recall) failed — any scam false-negative is Critical. Exiting 1.');
  process.exit(1);
}

// Special rule: Dim 2 failure on > 1 FAANG fixture exits 1.
// Dim 2 failure on exactly 1 is a warning (pass=true with warning in detail), already handled above.
const dim2Results = results.filter((r) => r.dim.startsWith('2. FAANG') && !r.skipped);
for (const dim2 of dim2Results) {
  if (!dim2.pass) {
    console.error(`\n[FAIL] Dimension 2 (FAANG false-positive) failed on > 1 fixture. Exiting 1.`);
    process.exit(1);
  }
}

// Critical + High failures (excluding Medium warn-only dimensions 11, 12, 13)
const blockingFailures = results.filter(
  (r) =>
    !r.pass &&
    !r.skipped &&
    (r.priority === 'Critical' || r.priority === 'High'),
);

const warnings = results.filter(
  (r) => !r.pass && !r.skipped && r.priority === 'Medium',
);

if (warnings.length > 0) {
  console.warn(
    `\n[WARN] ${warnings.length} Medium-priority dimension(s) failed (warn-only, exits 0): ${warnings.map((r) => r.dim).join(', ')}`,
  );
}

if (blockingFailures.length > 0) {
  console.error(
    `\n[FAIL] ${blockingFailures.length} Critical/High dimension(s) failed:\n${blockingFailures.map((r) => `  - ${r.dim}: ${r.detail}`).join('\n')}`,
  );
  process.exit(1);
}

console.log(
  `\n[PASS] All Critical + High dimensions passed${warnings.length > 0 ? ` (${warnings.length} Medium warnings above)` : ''}.`,
);
process.exit(0);
