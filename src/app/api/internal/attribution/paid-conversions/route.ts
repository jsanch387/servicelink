/**
 * GET /api/internal/attribution/paid-conversions
 *
 * First-touch signup → paid Pro conversion. Auth: existing internal secret
 * (`x-internal-push-secret` or `Authorization: Bearer`).
 */

import { loadPaidConversionReport } from '@/features/marketing-attribution/server/loadPaidConversionReport';
import { parsePaidConversionPeriod } from '@/features/marketing-attribution/utils/paidConversion';
import { verifyInternalCronAuth } from '@/features/cron/server/verifyInternalCronAuth';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = verifyInternalCronAuth(request);
  if (auth === 'not_configured') {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }
  if (auth === 'unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const period = parsePaidConversionPeriod(
      request.nextUrl.searchParams.get('period')
    );
    const report = await loadPaidConversionReport(period);
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    console.error('[internal/attribution] paid-conversions failed', error);
    return NextResponse.json(
      { error: 'Failed to load conversion report' },
      { status: 500 }
    );
  }
}
