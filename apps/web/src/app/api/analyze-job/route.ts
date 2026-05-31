export const runtime = 'nodejs';
export const maxDuration = 30;

import { analyzeJob, makeAiClient } from '@ghost/scoring';
import { ANALYZE_HEADER_KEY, JobPostingSchema } from '@ghost/shared';
import { type NextRequest, NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': `content-type, ${ANALYZE_HEADER_KEY}`,
  'Access-Control-Max-Age': '86400',
} as const;

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json().catch(() => null);
    if (body === null) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS });
    }

    const parsed = JobPostingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const apiKeyHeader = req.headers.get(ANALYZE_HEADER_KEY);

    const ai = makeAiClient(apiKeyHeader);

    const result = await analyzeJob(parsed.data, { ai });

    return NextResponse.json(result, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
