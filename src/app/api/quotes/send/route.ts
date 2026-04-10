import {
  sendQuoteSentToCustomerEmail,
  type QuoteSentToCustomerPayload,
} from '@/features/email';
import { validateSendQuoteBody } from '@/features/quotes/send/validateSendQuoteBody';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const parsed = validateSendQuoteBody(await request.json());
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: parsed.status }
      );
    }
    const body = parsed.data;

    const admin = createSupabaseAdminClient();

    const { data: business, error: businessError } = await admin
      .from('business_profiles')
      .select('id, business_slug, profile_id, business_name')
      .eq('business_slug', body.businessSlug)
      .maybeSingle();

    if (businessError || !business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    const businessRow = business as {
      id: string;
      business_slug: string | null;
      profile_id: string | null;
      business_name: string | null;
    };

    const businessDisplayName =
      businessRow.business_name?.trim() ||
      businessRow.business_slug?.trim() ||
      'Your service provider';

    const vehicleLine =
      [body.vehicleYear, body.vehicleMake, body.vehicleModel]
        .map(v => (v ?? '').trim())
        .filter(Boolean)
        .join(' ') || null;

    if (!businessRow.profile_id || businessRow.profile_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // `quotes` / `quote_public_links` may not yet be in generated DB types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any;

    const { data: quote, error: quoteError } = await db
      .from('quotes')
      .insert({
        business_id: businessRow.id,
        created_by_user_id: user.id,
        customer_name: body.customerName,
        customer_email: body.customerEmail,
        customer_phone: body.customerPhoneDigits,
        vehicle_year: body.vehicleYear,
        vehicle_make: body.vehicleMake,
        vehicle_model: body.vehicleModel,
        service_name: body.serviceName,
        price_cents: body.priceCents,
        duration_minutes: body.durationMinutes,
        note: body.note,
        scheduled_date: body.scheduledDate,
        scheduled_start_time: body.scheduledStartTimeForDb,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { success: false, error: 'Failed to create quote' },
        { status: 500 }
      );
    }

    const quoteId = (quote as { id: string }).id;
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24 * 14
    ).toISOString(); // 14 days

    const { error: linkError } = await db.from('quote_public_links').insert({
      quote_id: quoteId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      is_active: true,
    });

    if (linkError) {
      return NextResponse.json(
        { success: false, error: 'Failed to create quote link' },
        { status: 500 }
      );
    }

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
      request.nextUrl.origin;
    const publicUrl = `${origin}/q/${rawToken}`;

    try {
      const emailPayload: QuoteSentToCustomerPayload = {
        customerName: body.customerName,
        serviceName: body.serviceName,
        businessName: businessDisplayName,
        priceCents: body.priceCents,
        scheduledDate: body.scheduledDate,
        scheduledStartTime: body.scheduledStartTimeForDb,
        durationMinutes: body.durationMinutes,
        note: body.note,
        customerRequestMessage: null,
        vehicleLine,
        publicQuoteUrl: publicUrl,
      };
      const emailResult = await sendQuoteSentToCustomerEmail(
        body.customerEmail,
        emailPayload
      );
      if (!emailResult.sent) {
        console.warn(
          '[API] POST /api/quotes/send: customer email not sent:',
          emailResult.error
        );
      }
    } catch (emailErr) {
      console.warn(
        '[API] POST /api/quotes/send: customer email error',
        emailErr
      );
    }

    return NextResponse.json(
      { success: true, data: { quoteId, publicUrl, expiresAt } },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] POST /api/quotes/send error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send quote' },
      { status: 500 }
    );
  }
}
