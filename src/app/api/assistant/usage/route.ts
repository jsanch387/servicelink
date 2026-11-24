/**
 * GET /api/assistant/usage
 *
 * Monthly Assistant text usage for the current shop (beta cap).
 * Auth: Bearer or cookie. Requires customers.read.
 */

import type { AssistantUsageResponse } from '@/features/assistant/api/types';
import { getAssistantTextUsage } from '@/features/assistant/server/assistantUsageMonth';
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
        } satisfies AssistantUsageResponse,
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
        } satisfies AssistantUsageResponse,
        { status: resolved.status }
      );
    }

    const admin = createSupabaseAdminClient();
    const usage = await getAssistantTextUsage(admin, resolved.businessId);

    return NextResponse.json({
      success: true,
      usage,
    } satisfies AssistantUsageResponse);
  } catch (error) {
    console.error('[assistant] GET /api/assistant/usage failed', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load Assistant usage',
      } satisfies AssistantUsageResponse,
      { status: 500 }
    );
  }
}
