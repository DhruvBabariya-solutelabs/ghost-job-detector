const MAX_QUOTE_LENGTH = 140;
const CONTEXT_WORDS = 6;
const ELLIPSIS = '...';

export function liftQuote(description: string, matchIndex: number): string {
  if (description.length === 0 || matchIndex < 0 || matchIndex >= description.length) {
    return '';
  }

  const idx = Math.min(Math.max(0, matchIndex), description.length - 1);

  const tokens: Array<{ word: string; start: number }> = [];
  for (const tokenMatch of description.matchAll(/\S+/g)) {
    tokens.push({ word: tokenMatch[0], start: tokenMatch.index });
  }

  if (tokens.length === 0) return '';

  let matchTokenIdx = 0;
  let tokenIdx = 0;
  for (const token of tokens) {
    if (token.start <= idx && token.start + token.word.length > idx) {
      matchTokenIdx = tokenIdx;
      break;
    }
    matchTokenIdx = tokenIdx;
    tokenIdx += 1;
  }

  const windowStart = Math.max(0, matchTokenIdx - CONTEXT_WORDS);
  const windowEnd = Math.min(tokens.length - 1, matchTokenIdx + CONTEXT_WORDS);

  const clippedLeft = windowStart > 0;
  const clippedRight = windowEnd < tokens.length - 1;

  const firstToken = tokens[windowStart];
  const lastToken = tokens[windowEnd];
  if (!firstToken || !lastToken) return '';

  const rawWindow = description.slice(firstToken.start, lastToken.start + lastToken.word.length);

  const prefix = clippedLeft ? ELLIPSIS : '';
  const suffix = clippedRight ? ELLIPSIS : '';
  let quote = prefix + rawWindow + suffix;

  if (quote.length > MAX_QUOTE_LENGTH) {
    const suffixLen = ELLIPSIS.length;
    quote = quote.slice(0, MAX_QUOTE_LENGTH - suffixLen) + ELLIPSIS;
  }

  return quote;
}
