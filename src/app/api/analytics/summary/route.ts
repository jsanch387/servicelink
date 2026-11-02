/**
 * GET /api/analytics/summary?businessProfileId=...&period=24h
 * Owner-only link view counts from public_analytics_events.
 */

import {
  DEFAULT_ANALYTICS_PERIOD,
  isAnalyticsPeriod,
  resolveLinkViewsPeriodForAccess,
} from '@/features/analytics/constants';
import { getLinkViewsSummary } from '@/features/analytics/server/getLinkViewsSummary';
import { ownerHasProAccessForBusiness } from '@/features/pricing/server/ownerHasProAccessForBusiness';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const resolved = await requireBusinessPermission(
      supabase,
      'dashboard.read'
    );

    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const businessProfileId = searchParams.get('businessProfileId')?.trim();
    const periodParam =
      searchParams.get('period')?.trim() ?? DEFAULT_ANALYTICS_PERIOD;

    if (!businessProfileId) {
      return NextResponse.json(
        { success: false, error: 'businessProfileId is required' },
        { status: 400 }
      );
    }

    if (!isAnalyticsPeriod(periodParam)) {
      return NextResponse.json(
        { success: false, error: 'Invalid period' },
        { status: 400 }
      );
    }

    if (businessProfileId !== resolved.businessId) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    const hasProAccess = await ownerHasProAccessForBusiness(
      supabase,
      businessProfileId
    );
    const effectivePeriod = resolveLinkViewsPeriodForAccess(
      periodParam,
      hasProAccess
    );

    const summary = await getLinkViewsSummary(
      supabase,
      businessProfileId,
      effectivePeriod
    );

    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error('[Analytics] Summary error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
