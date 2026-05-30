/**
 * Non-job-posting fixture set for AI-SPEC §5 Dimension 11 verification.
 *
 * These fixtures are designed to FAIL the D-25 heuristic gate in
 * `packages/scoring/src/extractors/triage.ts`. `isLikelyJobPosting()` must
 * return `false` for each entry so that `analyzeJob` short-circuits to the
 * D-26 dominant-negative response shape.
 *
 * Gate-fail conditions (D-25):
 *   - No JOB_TERMS keyword match in description (primary failure path), OR
 *   - description.length < 200 or > 50_000 (length gate failure)
 *
 * JOB_TERMS regex (triage.ts):
 *   /\b(role|engineer|manager|developer|designer|analyst|responsibilities|
 *       requirements|qualifications|apply|position|hiring)\b/i
 *
 * Each fixture's `expectedLeadingReasonText` is the CANONICAL wording from
 * `DOMINANT_NEGATIVE_REASON` in `packages/scoring/src/label.ts` (BLOCKER 1
 * single-source-of-truth fix). Plan 03-06 Dim 11 asserts string equality
 * between `response.reasons[0].text` and this constant byte-for-byte.
 *
 * @module fixtures/non-postings
 */

import type { JobPosting } from '@ghost/shared';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

/**
 * A non-posting fixture that must trip the D-25 heuristic gate.
 * `analyzeJob(posting, { ai: null })` must return `score: 50`.
 */
export interface NonPostingFixture {
  /** Kebab-case unique identifier — no emoji (Pattern H). */
  id: string;
  /**
   * A JobPosting whose description contains NO JOB_TERMS keyword
   * (so isLikelyJobPosting returns false) — OR is too short/too long.
   */
  posting: JobPosting;
  /**
   * D-26 neutral midpoint. The dominant-negative response always emits
   * score: 50 regardless of description content.
   */
  expectedScore: 50;
  /**
   * Byte-for-byte match of DOMINANT_NEGATIVE_REASON.text from label.ts.
   * Dim 11 assertion: `response.reasons[0].text === expectedLeadingReasonText`.
   */
  expectedLeadingReasonText: string;
}

// ---------------------------------------------------------------------------
// Canonical dominant-negative text (BLOCKER 1 single source of truth)
// MUST match DOMINANT_NEGATIVE_REASON.text in packages/scoring/src/label.ts
// byte-for-byte. Do NOT paraphrase — calibrate.ts asserts string equality.
// ---------------------------------------------------------------------------

const DOMINANT_NEGATIVE_TEXT =
  "This doesn't look like a job posting - score may not be meaningful";

// ---------------------------------------------------------------------------
// Non-posting fixtures
// ---------------------------------------------------------------------------

/**
 * Four non-posting inputs designed to trigger the D-25 heuristic gate
 * short-circuit per AI-SPEC §5 Dimension 11.
 *
 * Criteria for each description:
 * 1. `lorem-200`: length >= 200 but zero job-terms keywords
 * 2. `resume-excerpt`: a non-tech resume with no job-terms keyword
 *    (teacher's resume — avoids manager/analyst/developer/engineer)
 * 3. `wikipedia-rfc-2616`: HTTP/1.1 spec prose — technical but no job-terms
 * 4. `song-lyrics`: out-of-copyright song excerpt — no job-terms
 */
export const NON_POSTING_FIXTURES: NonPostingFixture[] = [
  {
    id: 'lorem-200',
    posting: {
      title: 'x',
      company: '',
      location: '',
      // 'lorem ipsum' repeated 20x = 240 chars. No job-terms keyword.
      // Gate fails on: no JOB_TERMS match (length >= 200 but keyword absent).
      description:
        'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor ' +
        'incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud ' +
        'exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure ' +
        'dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur',
    },
    expectedScore: 50,
    expectedLeadingReasonText: DOMINANT_NEGATIVE_TEXT,
  },

  {
    id: 'resume-excerpt',
    posting: {
      title: 'x',
      company: '',
      location: '',
      // Teacher's resume excerpt — avoids: role, engineer, manager, developer, designer,
      // analyst, responsibilities, requirements, qualifications, apply, position, hiring.
      // Uses "taught", "coordinated", "guided", "assessed" instead.
      description:
        'Emily Chen — Educator and Curriculum Specialist\n\n' +
        'Professional Summary: Dedicated K-12 science instructor with 8 years of classroom ' +
        'experience in urban and suburban school settings. Skilled at translating complex ' +
        'scientific concepts into accessible lessons for students across all learning ' +
        'levels. Passionate about STEM outreach and inquiry-based pedagogy.\n\n' +
        'Work History:\n' +
        '2018-present: Lead Science Instructor, Lincoln Middle School, Chicago IL\n' +
        '  - Taught AP Biology and Chemistry to 120+ students per academic year\n' +
        '  - Coordinated after-school science club with 40 participants\n' +
        '  - Guided six students to state science fair finals (2022, 2023)\n' +
        '  - Assessed student learning outcomes and adapted curriculum accordingly\n\n' +
        'Education: M.Ed. Curriculum and Instruction, Northwestern University 2018\n' +
        'B.S. Biology, University of Illinois Urbana-Champaign 2016\n\n' +
        'Certifications: Illinois Professional Educator License, AP Biology Endorsed.',
    },
    expectedScore: 50,
    expectedLeadingReasonText: DOMINANT_NEGATIVE_TEXT,
  },

  {
    id: 'wikipedia-rfc-2616',
    posting: {
      title: 'x',
      company: '',
      location: '',
      // Wikipedia-style paragraph on HTTP/1.1 (RFC 2616) — no job-terms keywords.
      // Deliberately avoids: engineer, developer, analyst, manager, etc.
      description:
        'HTTP/1.1 (Hypertext Transfer Protocol version 1.1) was formally specified in RFC 2616, ' +
        'published in June 1999 by the IETF. It introduced persistent connections by default, ' +
        'allowing multiple requests and responses to be sent over a single TCP connection without ' +
        'the overhead of re-establishing the connection for each exchange. This improvement was ' +
        'significant compared to HTTP/1.0, which closed the connection after every transaction.\n\n' +
        'The protocol introduced chunked transfer encoding, which allowed servers to begin ' +
        'transmitting a response before knowing its total length — useful for dynamically ' +
        'generated content. HTTP/1.1 also added the Host header field, enabling virtual hosting ' +
        'by allowing multiple domain names to be served from a single IP address.\n\n' +
        'Cache-control directives were expanded to give both clients and servers fine-grained ' +
        'control over caching behavior. The OPTIONS and TRACE methods were added to support ' +
        'diagnostics and cross-origin preflight checks. Despite its age, HTTP/1.1 remains ' +
        'widely deployed alongside HTTP/2 and HTTP/3 as of 2025.',
    },
    expectedScore: 50,
    expectedLeadingReasonText: DOMINANT_NEGATIVE_TEXT,
  },

  {
    id: 'song-lyrics',
    posting: {
      title: 'x',
      company: '',
      location: '',
      // Out-of-copyright folk song excerpt (traditional, public domain).
      // Avoids all JOB_TERMS keywords. 450+ chars.
      description:
        "Oh Shenandoah, I long to hear you,\nAway, you rolling river.\n" +
        "Oh Shenandoah, I long to hear you,\nAway, I'm bound away, 'cross the wide Missouri.\n\n" +
        "'Tis seven years since last I've seen you,\nAway, you rolling river.\n" +
        "'Tis seven years since last I've seen you,\nAway, I'm bound away, 'cross the wide Missouri.\n\n" +
        "Oh Shenandoah, I love your daughter,\nAway, you rolling river.\n" +
        "Oh Shenandoah, I love your daughter,\nAway, I'm bound away, 'cross the wide Missouri.\n\n" +
        "For her I've crossed the rolling water,\nAway, you rolling river.\n" +
        "For her I've crossed the rolling water,\nAway, I'm bound away, 'cross the wide Missouri.",
    },
    expectedScore: 50,
    expectedLeadingReasonText: DOMINANT_NEGATIVE_TEXT,
  },
];
