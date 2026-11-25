/**
 * POST /api/assistant/review-links
 *
 * Mint unique review invite URLs for Assistant prepare drafts.
 * Auth: Bearer or cookie. Requires customers.read (same gate as Assistant).
 * Body: { items: [{ customerId, bookingId }] }
 */

import { assistantProRequiredResponse } from '@/features/assistant/server/requireAssistantPro';
import { resolveAssistantReviewInviteUrl } from '@/features/reviews/server/resolveAssistantReviewInviteUrl';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextResponse } from 'next/server';

const BATCH_LIMIT = 20;

export type AssistantReviewLinksResponse =
  | {
      success: true;
      links: Array<{
        customerId: string;
        ok: boolean;
        url?: string;
        reason?: string;
      }>;
    }
  | {
      success: false;
      error: string;
      code?: string;
    };

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error,
          code: auth.code,
        } satisfies AssistantReviewLinksResponse,
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
        } satisfies AssistantReviewLinksResponse,
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
        } satisfies AssistantReviewLinksResponse,
        { status: 400 }
      );
    }

    const items = parseItems(body);
    if (!items) {
      return NextResponse.json(
        {
          success: false,
          error: 'Provide 1–20 review link items',
          code: 'invalid_body',
        } satisfies AssistantReviewLinksResponse,
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();
    const links = [];

    for (const item of items) {
      const result = await resolveAssistantReviewInviteUrl(admin, {
        businessId: resolved.businessId,
        customerId: item.customerId,
        bookingId: item.bookingId,
      });

      if (!result.ok) {
        links.push({
          customerId: item.customerId,
          ok: false,
          reason: result.reason,
        });
        continue;
      }

      links.push({
        customerId: item.customerId,
        ok: true,
        url: result.url,
      });
    }

    return NextResponse.json({
      success: true,
      links,
    } satisfies AssistantReviewLinksResponse);
  } catch (error) {
    console.error('[assistant] POST /api/assistant/review-links failed', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to resolve review links',
      } satisfies AssistantReviewLinksResponse,
      { status: 500 }
    );
  }
}

function parseItems(
  body: unknown
): Array<{ customerId: string; bookingId: string | null }> | null {
  if (!body || typeof body !== 'object') return null;
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length === 0) return null;
  if (items.length > BATCH_LIMIT) return null;

  const normalized: Array<{ customerId: string; bookingId: string | null }> =
    [];
  for (const item of items) {
    if (!item || typeof item !== 'object') return null;
    const customerId =
      typeof (item as { customerId?: unknown }).customerId === 'string'
        ? (item as { customerId: string }).customerId.trim()
        : '';
    if (!customerId) return null;
    const bookingRaw = (item as { bookingId?: unknown }).bookingId;
    const bookingId =
      typeof bookingRaw === 'string' && bookingRaw.trim()
        ? bookingRaw.trim()
        : null;
    normalized.push({ customerId, bookingId });
  }
  return normalized;
}
