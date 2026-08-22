import { NextRequest, NextResponse } from 'next/server';
import { verifyInternalCronAuth } from './verifyInternalCronAuth';

export type CronJobRunner = (ctx: { request: NextRequest }) => Promise<object>;

/**
 * Shared GET wrapper for `/api/internal/cron/*`.
 * Auth first, then run the job, then `{ ok: true, ...result }`.
 */
export function handleCronGet(run: CronJobRunner) {
  return async function GET(request: NextRequest): Promise<NextResponse> {
    const auth = verifyInternalCronAuth(request);
    if (auth === 'not_configured') {
      return NextResponse.json({ error: 'Not configured' }, { status: 503 });
    }
    if (auth === 'unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const result = await run({ request });
      return NextResponse.json({ ok: true, ...result });
    } catch (e) {
      return NextResponse.json(
        {
          error: 'Internal error',
          message: e instanceof Error ? e.message.slice(0, 200) : String(e),
        },
        { status: 500 }
      );
    }
  };
}
