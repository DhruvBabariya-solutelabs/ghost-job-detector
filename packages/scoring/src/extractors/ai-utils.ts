/**
 * Shared prompt-building utilities for the AI extractors (aiText.ts, llmEval.ts).
 *
 * Option B layout (CONTEXT line 226 / Plan 03-03 §interfaces): these three helpers
 * are worth extracting because they are identical across both extractors — only the
 * Zod schema and schema-name argument differ per call.
 *
 * Locked decisions:
 * - D-35: `<JOB_POSTING>...</JOB_POSTING>` delimiter wrap is MANDATORY. The system
 *   prompt frames the block as untrusted user-provided data. Title / company / location
 *   are placed AFTER the close-tag so injection inside the description cannot pollute them.
 * - D-36: 6000-char description cap — first 3600 + last 1400 chars. Preserves the
 *   typical opening (title/role/summary) AND the closing block (comp, contact, apply
 *   instructions) where ghost/scam signals frequently appear.
 * - D-37: Soft-strip of zero-width characters (U+200B ZWSP, U+200C ZWNJ, U+200D ZWJ,
 *   U+FEFF BOM) and collapse of 3+ consecutive newlines → 2, 3+ consecutive spaces → 1.
 *   These are best-effort layered defenses; the closed-enum schema in llmEval.ts is the
 *   LOAD-BEARING prompt-injection defense (D-23 / ENG-12).
 *
 * Zero `console.*` calls. Zero `process.env.*` references. Pure functions — no I/O.
 */

import type { JobPosting } from '@ghost/shared';

/** D-36: 6000-char description cap — splice first 3600 + last 1400. */
function truncate6000(d: string): string {
  const CAP = 6_000;
  const HEAD = 3_600;
  const TAIL = 1_400;
  if (d.length <= CAP) return d;
  return d.slice(0, HEAD) + '\n... [posting truncated mid-content] ...\n' + d.slice(-TAIL);
}

/**
 * D-37: Strip zero-width chars and collapse excessive whitespace.
 * Using \u escapes to keep the source file ASCII-clean (no raw invisibles).
 */
function stripControlChars(s: string): string {
  return s
    .replace(/​|‌|‍|﻿/g, '') // ZWSP, ZWNJ, ZWJ, BOM — alternation (not class) because ZWJ in a class composes emojis (Biome noMisleadingCharacterClass)
    .replace(/\n{3,}/g, '\n\n') // 3+ newlines → 2
    .replace(/ {3,}/g, ' '); // 3+ spaces → 1
}

/**
 * D-35 + D-36 + D-37: Build the user-turn input for both AI extractors.
 *
 * Structural rules (locked):
 * - Description is truncated and sanitized first, then wrapped in delimiters.
 * - Title / company / location are appended AFTER </JOB_POSTING> so an injection
 *   inside the description body cannot reach or pollute the metadata fields
 *   (LLM recency bias puts later tokens at higher attention weight).
 */
export function buildUserInput(posting: JobPosting): string {
  const sanitized = stripControlChars(truncate6000(posting.description));
  return (
    'Analyze the following job posting:\n' +
    '<JOB_POSTING>\n' +
    sanitized +
    '\n</JOB_POSTING>\n' +
    'Title: ' +
    posting.title +
    '\n' +
    'Company: ' +
    posting.company +
    '\n' +
    'Location: ' +
    posting.location
  );
}
