/**
 * Evidence-quote window helper for the scoring engine (D-41).
 *
 * `liftQuote` extracts a ≤140-char context window around a match index in a
 * description string. Used by three heuristic extractors to populate evidence[]:
 *   - buzzword.ts  — D-40 red template (matched buzzword + surrounding context)
 *   - specificity.ts — D-40 green template (present-field quote)
 *   - scam.ts      — D-40 scam-row template (matched phrase + surrounding context)
 *
 * Locked decisions:
 * - D-41: 6 words on each side of matchIndex, ellipsis-truncated at boundaries.
 *   Hard cap at 140 chars total — long captures are mid-truncated with `...`.
 *
 * Ellipsis convention: ASCII `...` (three dots) — consistent prefix and suffix.
 * Safer than U+2026 for CI logs and downstream label.ts template strings
 * (Pattern H — no emoji / special unicode in static strings).
 *
 * Out-of-range matchIndex handling: clamped to [0, description.length - 1].
 * Negative or equal-to-length indices return an empty string.
 */

const MAX_QUOTE_LENGTH = 140;
const CONTEXT_WORDS = 6;
const ELLIPSIS = '...';

/**
 * Return a ≤140-char window with up to 6 words on each side of `matchIndex`.
 *
 * The returned string is prefixed with `...` when context was clipped on the
 * left (match was not at the start of the description), and suffixed with `...`
 * when context was clipped on the right (match does not reach the end).
 *
 * @param description - Full job posting description text (untrusted, read-only).
 * @param matchIndex  - Character index of the matched term inside `description`.
 * @returns Ellipsis-bounded context string of length ≤ 140, or `''` when
 *          `matchIndex` is outside `[0, description.length - 1]`.
 */
export function liftQuote(description: string, matchIndex: number): string {
  // Degenerate / out-of-range input: return empty string.
  if (description.length === 0 || matchIndex < 0 || matchIndex >= description.length) {
    return '';
  }

  // Clamp to valid range (belt-and-braces for callers that pass match.index ?? 0).
  const idx = Math.min(Math.max(0, matchIndex), description.length - 1);

  // Tokenise by whitespace — walk a token list via for..of (Pattern D).
  // Each token records its start offset so we can slice back to the original string.
  const tokens: Array<{ word: string; start: number }> = [];
  for (const tokenMatch of description.matchAll(/\S+/g)) {
    tokens.push({ word: tokenMatch[0], start: tokenMatch.index });
  }

  if (tokens.length === 0) return '';

  // Find the token that contains `idx` (the match position).
  // Use for..of with index counter — no direct [i] indexing under noUncheckedIndexedAccess.
  let matchTokenIdx = 0;
  let tokenIdx = 0;
  for (const token of tokens) {
    if (token.start <= idx && token.start + token.word.length > idx) {
      matchTokenIdx = tokenIdx;
      break;
    }
    // If idx falls in whitespace between tokens, advance to the nearest token.
    matchTokenIdx = tokenIdx;
    tokenIdx += 1;
  }

  // Compute window bounds: up to CONTEXT_WORDS tokens left and right.
  const windowStart = Math.max(0, matchTokenIdx - CONTEXT_WORDS);
  const windowEnd = Math.min(tokens.length - 1, matchTokenIdx + CONTEXT_WORDS);

  // Determine if boundaries were clipped (for ellipsis prefix/suffix).
  const clippedLeft = windowStart > 0;
  const clippedRight = windowEnd < tokens.length - 1;

  // Slice the original description from the first to last token in the window.
  const firstToken = tokens[windowStart];
  const lastToken = tokens[windowEnd];
  if (!firstToken || !lastToken) return '';

  const rawWindow = description.slice(firstToken.start, lastToken.start + lastToken.word.length);

  // Assemble the quote with ellipsis markers.
  const prefix = clippedLeft ? ELLIPSIS : '';
  const suffix = clippedRight ? ELLIPSIS : '';
  let quote = prefix + rawWindow + suffix;

  // Hard-truncate to MAX_QUOTE_LENGTH, re-adding suffix ellipsis when trimmed.
  if (quote.length > MAX_QUOTE_LENGTH) {
    const suffixLen = ELLIPSIS.length;
    quote = quote.slice(0, MAX_QUOTE_LENGTH - suffixLen) + ELLIPSIS;
  }

  return quote;
}
