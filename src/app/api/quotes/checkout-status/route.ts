import { resolveQuoteTokenHash } from '@/features/quotes/shared/utils/resolveQuoteTokenHash';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')?.trim() ?? '';
  const sessionId =
    request.nextUrl.searchParams.get('session_id')?.trim() ?? '';
  if (!token || !sessionId) {
    return NextResponse.json(
      { success: false, error: 'Missing checkout session' },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const tokenHash = resolveQuoteTokenHash(token);
  const { data: link } = await db
    .from('quote_public_links')
    .select('quote_id')
    .eq('token_hash', tokenHash)
    .maybeSingle();
  const quoteId = (link as { quote_id?: string } | null)?.quote_id;
  if (!quoteId) {
    return NextResponse.json(
      { success: false, error: 'Link not found' },
      { status: 404 }
    );
  }

  const { data: sessionRow } = await db
    .from('quote_checkout_sessions')
    .select('status, quote_id')
    .eq('stripe_checkout_session_id', sessionId)
    .eq('quote_id', quoteId)
    .maybeSingle();
  const session = sessionRow as { status?: string } | null;
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Checkout not found' },
      { status: 404 }
    );
  }

  const { data: quoteRow } = await db
    .from('quotes')
    .select('status, booking_id')
    .eq('id', quoteId)
    .maybeSingle();
  const quote = quoteRow as {
    status?: string;
    booking_id?: string | null;
  } | null;

  if (session.status === 'completed' || quote?.booking_id) {
    return NextResponse.json({ success: true, status: 'approved' });
  }
  if (session.status === 'failed') {
    return NextResponse.json({ success: true, status: 'failed' });
  }
  return NextResponse.json({ success: true, status: 'pending' });
}
