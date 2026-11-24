/**
 * GET /api/assistant/today
 *
 * Returns review follow-ups and rebook check-ins for the current shop.
 * Auth: Bearer (mobile) or cookie (web). Requires customers.read.
 */

import type { AssistantTodayResponse } from '@/features/assistant/api/types';
import { getAssistantTextUsage } from '@/features/assistant/server/assistantUsageMonth';
import { loadAssistantToday } from '@/features/assistant/today/loadAssistantToday';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error,
          code: auth.code,
        } satisfies AssistantTodayResponse,
        { status: auth.status }
      );
    }

    const resolved = await requireBusinessPermission(
      auth.supabase,
      'customers.read'
    );

    if (!resolved.ok) {
      return NextResponse.json(
        {
          success: false,
          error: resolved.error,
        } satisfies AssistantTodayResponse,
        { status: resolved.status }
      );
    }

    const admin = createSupabaseAdminClient();
    const [today, usage] = await Promise.all([
      loadAssistantToday(auth.supabase, resolved.businessId),
      getAssistantTextUsage(admin, resolved.businessId),
    ]);

    return NextResponse.json({
      success: true,
      today,
      usage,
    } satisfies AssistantTodayResponse);
  } catch (error) {
    console.error('[assistant] GET /api/assistant/today failed', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load assistant',
      } satisfies AssistantTodayResponse,
      { status: 500 }
    );
  }
}
