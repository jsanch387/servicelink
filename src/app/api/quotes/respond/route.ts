import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

type Decision = 'approve' | 'decline';

function isDecision(v: unknown): v is Decision {
  return v === 'approve' || v === 'decline';
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      token?: string;
      decision?: string;
      serviceAddress?: string;
    };
    const token = body.token?.trim();
    const decision = body.decision;
    const serviceAddress = body.serviceAddress?.trim();

    if (!token || !isDecision(decision)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      );
    }
    if (
      decision === 'approve' &&
      (!serviceAddress || serviceAddress.length < 6)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service address is required to accept quote',
        },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const admin = createSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any;
    const nowIso = new Date().toISOString();

    const { data: linkRow, error: linkError } = await db
      .from('quote_public_links')
      .select('id, quote_id, is_active, revoked_at, expires_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (linkError || !linkRow) {
      return NextResponse.json(
        { success: false, error: 'Link not found' },
        { status: 404 }
      );
    }

    const link = linkRow as {
      id: string;
      quote_id: string;
      is_active: boolean;
      revoked_at: string | null;
      expires_at: string;
    };

    if (!link.is_active || link.revoked_at || link.expires_at <= nowIso) {
      return NextResponse.json(
        { success: false, error: 'Link is no longer valid' },
        { status: 410 }
      );
    }

    const { data: quoteRow, error: quoteError } = await db
      .from('quotes')
      .select('id, status, note')
      .eq('id', link.quote_id)
      .maybeSingle();

    if (quoteError || !quoteRow) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    const quote = quoteRow as {
      id: string;
      status: string;
      note: string | null;
    };

    if (quote.status === 'approved') {
      if (decision === 'approve') {
        return NextResponse.json({
          success: true,
          status: 'approved',
          alreadyResponded: true,
        });
      }
      return NextResponse.json(
        { success: false, error: 'This quote was already accepted' },
        { status: 409 }
      );
    }

    if (quote.status === 'declined') {
      if (decision === 'decline') {
        return NextResponse.json({
          success: true,
          status: 'declined',
          alreadyResponded: true,
        });
      }
      return NextResponse.json(
        { success: false, error: 'This quote was already declined' },
        { status: 409 }
      );
    }

    if (!['sent', 'viewed'].includes(quote.status)) {
      return NextResponse.json(
        { success: false, error: 'This quote cannot be responded to' },
        { status: 400 }
      );
    }

    const newStatus = decision === 'approve' ? 'approved' : 'declined';
    const quoteUpdate =
      decision === 'approve'
        ? {
            status: newStatus,
            approved_at: nowIso,
            service_address: serviceAddress,
          }
        : {
            status: newStatus,
            declined_at: nowIso,
          };

    let { error: updateQuoteError } = await db
      .from('quotes')
      .update(quoteUpdate)
      .eq('id', quote.id);

    // Backward-safe fallback while DB column rolls out.
    if (updateQuoteError && decision === 'approve') {
      const { error: fallbackError } = await db
        .from('quotes')
        .update({
          status: newStatus,
          approved_at: nowIso,
          note: quote.note?.trim()
            ? `${quote.note.trim()}\n\nService address: ${serviceAddress}`
            : `Service address: ${serviceAddress}`,
        })
        .eq('id', quote.id);
      updateQuoteError = fallbackError ?? null;
    }

    if (updateQuoteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update quote' },
        { status: 500 }
      );
    }

    const { error: updateLinkError } = await db
      .from('quote_public_links')
      .update({
        response_status: newStatus === 'approved' ? 'approved' : 'declined',
        responded_at: nowIso,
      })
      .eq('id', link.id);

    if (updateLinkError) {
      return NextResponse.json(
        { success: false, error: 'Failed to record response' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (e) {
    console.error('[API] POST /api/quotes/respond', e);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
