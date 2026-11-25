/**
 * POST /api/assistant/skip
 *
 * Persist Skip decisions for review / check-in suggestions.
 * Auth: Bearer or cookie. Requires customers.write.
 * Body: { items: [{ customerId, subject, bookingId? }] }
 */

import type {
  AssistantDecisionItemBody,
  AssistantDecisionResponse,
} from '@/features/assistant/api/types';
import { applyAssistantSkip } from '@/features/assistant/server/applyAssistantDecisions';
import { assistantProRequiredResponse } from '@/features/assistant/server/requireAssistantPro';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error,
          code: auth.code,
        } satisfies AssistantDecisionResponse,
        { status: auth.status }
      );
    }

    const resolved = await requireBusinessPermission(
      auth.supabase,
      'customers.write'
    );

    if (!resolved.ok) {
      return NextResponse.json(
        {
          success: false,
          error: resolved.error,
        } satisfies AssistantDecisionResponse,
        { status: resolved.status }
      );
    }

    const proDenied = await assistantProRequiredResponse(resolved.businessId);
    if (proDenied) return proDenied;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON body',
          code: 'invalid_body',
        } satisfies AssistantDecisionResponse,
        { status: 400 }
      );
    }

    const items = parseItems(body);
    if (!items) {
      return NextResponse.json(
        {
          success: false,
          error: 'Provide 1–20 valid Assistant items',
          code: 'invalid_body',
        } satisfies AssistantDecisionResponse,
        { status: 400 }
      );
    }

    const result = await applyAssistantSkip({
      admin: createSupabaseAdminClient(),
      businessId: resolved.businessId,
      actorUserId: auth.user.id,
      items,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          code: result.code,
          usage: result.usage,
        } satisfies AssistantDecisionResponse,
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      recorded: result.recorded,
      usage: result.usage,
    } satisfies AssistantDecisionResponse);
  } catch (error) {
    console.error('[assistant] POST /api/assistant/skip failed', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to skip Assistant items',
      } satisfies AssistantDecisionResponse,
      { status: 500 }
    );
  }
}

function parseItems(body: unknown): AssistantDecisionItemBody[] | null {
  if (!body || typeof body !== 'object') return null;
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return null;
  return items as AssistantDecisionItemBody[];
}
