/**
 * GET /api/memberships
 * Owner: { plans } for the Subscriptions dashboard.
 */

import { loadOwnerMembershipsState } from '@/features/subscriptions/server/loadOwnerMembershipsState';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const resolved = await requireBusinessPermission(
      supabase,
      'billing.manage'
    );

    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const state = await loadOwnerMembershipsState(
      supabase,
      resolved.businessId
    );

    if (!state.ok) {
      return NextResponse.json(
        { success: false, error: state.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, plans: state.plans });
  } catch (error) {
    console.error('[memberships GET]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load memberships' },
      { status: 500 }
    );
  }
}
