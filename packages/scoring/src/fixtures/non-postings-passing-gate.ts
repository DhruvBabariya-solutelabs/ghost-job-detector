/**
 * Non-posting fixtures that PASS the D-25 heuristic gate — for AI-SPEC §5
 * Dimension 12 (LLM `is_job_posting` backstop).
 *
 * Unlike `non-postings.ts` (which trip the gate), these fixtures FOOL the
 * heuristic gate: `isLikelyJobPosting()` returns TRUE (description >= 200 chars
 * AND contains a JOB_TERMS keyword). Only the live LLM call (`extractLlmEval`)
 * can catch these — it must return `is_job_posting: false`.
 *
 * Dim 12 is ONLY verifiable in full mode (`OPENAI_API_KEY_EVAL` set).
 * The heuristic-only calibration run skips Dim 12 assertions.
 *
 * When `is_job_posting: false` is returned by the LLM, `extractLlmEval` sets
 * `confidence: 0.5` (Plan 03-03 design). Plan 03-04's `label.ts` then inserts
 * `DOMINANT_NEGATIVE_REASON` as `reasons[0]` (D-25 LLM-backstop path).
 *
 * `expectedLeadingReasonText` is the CANONICAL wording from `DOMINANT_NEGATIVE_REASON`
 * in `packages/scoring/src/label.ts` (BLOCKER 1 single-source-of-truth fix) —
 * byte-for-byte identical to `NON_POSTING_FIXTURES.expectedLeadingReasonText`.
 *
 * @module fixtures/non-postings-passing-gate
 */

import type { JobPosting } from '@ghost/shared';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

/**
 * A fixture that passes the D-25 heuristic gate but should fail the LLM backstop.
 *
 * `isLikelyJobPosting(posting)` returns `true` (has JOB_TERMS keyword + length >= 200).
 * The live `extractLlmEval` call must return `is_job_posting: false`.
 * Plan 03-04's `label.ts` inserts `DOMINANT_NEGATIVE_REASON` as `reasons[0]`.
 *
 * Dim 12 requires `OPENAI_API_KEY_EVAL` to be set — heuristic-only runs skip this.
 */
export interface NonPostingPassingGateFixture {
  /** Kebab-case unique identifier — no emoji (Pattern H). */
  id: string;
  /**
   * A JobPosting whose description passes the heuristic gate (has a JOB_TERMS
   * keyword + length >= 200) but is NOT an actual job posting.
   */
  posting: JobPosting;
  /**
   * The expected value of `extractLlmEval(posting, ai).is_job_posting`
   * when the LLM processes this input. Must be false.
   */
  expectedLlmIsJobPosting: false;
  /**
   * Byte-for-byte match of DOMINANT_NEGATIVE_REASON.text from label.ts.
   * Dim 12 assertion (live-AI mode only): `response.reasons[0].text === expectedLeadingReasonText`.
   */
  expectedLeadingReasonText: string;
}

// ---------------------------------------------------------------------------
// Canonical dominant-negative text (must match label.ts DOMINANT_NEGATIVE_REASON.text)
// ---------------------------------------------------------------------------

const DOMINANT_NEGATIVE_TEXT =
  "This doesn't look like a job posting - score may not be meaningful";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * Two inputs that pass the D-25 heuristic gate but are NOT job postings.
 * The LLM backstop (Plan 03-03 `extractLlmEval` `is_job_posting` field) must
 * catch them. Requires `OPENAI_API_KEY_EVAL` to exercise.
 */
export const NON_POSTING_PASSING_GATE_FIXTURES: NonPostingPassingGateFixture[] = [
  {
    id: 'resume-with-engineer-4x',
    posting: {
      title: 'x',
      company: '',
      location: '',
      // A resume that mentions "engineer" 4 times across 800+ chars.
      // Passes isLikelyJobPosting: "engineer" is a JOB_TERMS keyword, length >= 200.
      // But this is a RESUME (first-person, work history), not a job posting.
      // LLM should return is_job_posting: false.
      description:
        'Jordan Kim — Software Engineer\n\n' +
        'Summary: Experienced software engineer with 7 years of expertise in building ' +
        'distributed backend systems. Previously a software engineer at two Series-B startups ' +
        'and one Fortune 500 company. Seeking new opportunities in infrastructure engineering.\n\n' +
        'Skills: Python, Go, TypeScript, PostgreSQL, Redis, Kafka, Kubernetes, AWS, Terraform\n\n' +
        'Experience:\n\n' +
        '2022-2025: Senior Software Engineer — DataStream Inc., Seattle WA\n' +
        '  Built and maintained real-time data ingestion pipelines handling 2B events/day.\n' +
        '  Led migration of 40 microservices from on-prem to AWS EKS cluster.\n' +
        '  Reduced p99 API latency from 450ms to 80ms via query optimization.\n' +
        '  Mentored 4 junior engineers on distributed systems design patterns.\n\n' +
        '2019-2022: Software Engineer — Meridian Payments, San Francisco CA\n' +
        '  Developed payment processing APIs serving 500k monthly active users.\n' +
        '  Owned on-call rotation for critical payment services (1 week in 8).\n' +
        '  Introduced integration testing framework that cut production incidents by 60%.\n\n' +
        '2018-2019: Junior Software Engineer — TechCorp, Austin TX\n' +
        '  Shipped 12 features across the customer-facing web application.\n' +
        '  Wrote internal tooling in Python to automate deployment workflows.\n\n' +
        'Education: B.S. Computer Science, University of Texas at Austin, 2018.\n' +
        'References: available upon request.',
    },
    expectedLlmIsJobPosting: false,
    expectedLeadingReasonText: DOMINANT_NEGATIVE_TEXT,
  },

  {
    id: 'saas-marketing-careers',
    posting: {
      title: 'x',
      company: '',
      location: '',
      // A SaaS marketing / careers-overview page listing 6 engineer job titles
      // in promotional prose — not an actual job posting for a specific role.
      // Passes isLikelyJobPosting: "engineer" appears multiple times, length >= 200.
      // LLM should return is_job_posting: false (marketing page, not a specific opening).
      description:
        'Join the Helix Team — Build the Future of Healthcare Analytics\n\n' +
        'At Helix, we are on a mission to make precision medicine accessible to everyone. ' +
        'Our platform helps health systems turn genomic data into clinical decisions in real time. ' +
        'We are a team of 200+ builders backed by Andreessen Horowitz, and we are growing fast.\n\n' +
        'We hire world-class engineers across every layer of our stack. Whether you are a ' +
        'senior backend engineer who loves distributed data systems, a platform engineer ' +
        'who wants to own our Kubernetes infrastructure, a frontend engineer who builds ' +
        'beautiful clinical dashboards, a data engineer who wrangles genomic pipelines at ' +
        'scale, a machine learning engineer working on predictive diagnostics, or a ' +
        'security engineer hardening our HIPAA-compliant architecture — Helix has a home for you.\n\n' +
        'Why engineers choose Helix:\n' +
        '- Mission-driven work with real patient impact\n' +
        '- Competitive salaries, equity, and full benefits (health, dental, vision, 401k)\n' +
        '- Remote-first culture with quarterly off-sites\n' +
        '- $5,000 annual learning and development stipend\n' +
        '- Fast-moving environment where your work ships to production weekly\n\n' +
        'Interested in building with us? Visit helix.bio/careers to see all open engineer ' +
        'and non-engineer roles. We are actively interviewing for positions across engineering, ' +
        'product, design, and data science. Come shape the future of health at Helix.',
    },
    expectedLlmIsJobPosting: false,
    expectedLeadingReasonText: DOMINANT_NEGATIVE_TEXT,
  },
];
