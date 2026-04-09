import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

interface SendQuoteRequestBody {
  businessSlug: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  serviceName: string;
  priceCents: number;
  durationMinutes: number;
  note?: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledStartTime: string; // HH:mm
}

function isValidEmail(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v);
}

function toTimeWithSeconds(hhmm: string): string {
  const trimmed = hhmm.trim();
  if (!/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  return `${trimmed}:00`;
}

function normalizeOptionalPhoneDigits(
  value: string | undefined
): string | null {
  if (!value?.trim()) return null;
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 ? digits : null;
}

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

    const body = (await request.json()) as SendQuoteRequestBody;
    if (!body.businessSlug?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Business slug is required' },
        { status: 400 }
      );
    }
    if (!body.customerName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Customer name is required' },
        { status: 400 }
      );
    }
    if (!isValidEmail(body.customerEmail ?? '')) {
      return NextResponse.json(
        { success: false, error: 'A valid customer email is required' },
        { status: 400 }
      );
    }
    const customerPhoneDigits = normalizeOptionalPhoneDigits(
      body.customerPhone
    );
    if (body.customerPhone?.trim() && !customerPhoneDigits) {
      return NextResponse.json(
        { success: false, error: 'Phone must be 10 digits or omitted' },
        { status: 400 }
      );
    }
    if (!body.serviceName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Service name is required' },
        { status: 400 }
      );
    }
    if (!Number.isInteger(body.priceCents) || body.priceCents < 0) {
      return NextResponse.json(
        { success: false, error: 'Price is invalid' },
        { status: 400 }
      );
    }
    if (!Number.isInteger(body.durationMinutes) || body.durationMinutes <= 0) {
      return NextResponse.json(
        { success: false, error: 'Duration is invalid' },
        { status: 400 }
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.scheduledDate ?? '')) {
      return NextResponse.json(
        { success: false, error: 'Scheduled date must be YYYY-MM-DD' },
        { status: 400 }
      );
    }
    if (!/^\d{2}:\d{2}$/.test(body.scheduledStartTime ?? '')) {
      return NextResponse.json(
        { success: false, error: 'Scheduled start time must be HH:mm' },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();

    const { data: business, error: businessError } = await admin
      .from('business_profiles')
      .select('id, business_slug, profile_id')
      .eq('business_slug', body.businessSlug.trim())
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
    };

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
        customer_name: body.customerName.trim(),
        customer_email: body.customerEmail.trim(),
        customer_phone: customerPhoneDigits,
        vehicle_year: body.vehicleYear?.trim() || null,
        vehicle_make: body.vehicleMake?.trim() || null,
        vehicle_model: body.vehicleModel?.trim() || null,
        service_name: body.serviceName.trim(),
        price_cents: body.priceCents,
        duration_minutes: body.durationMinutes,
        note: body.note?.trim() || null,
        scheduled_date: body.scheduledDate,
        scheduled_start_time: toTimeWithSeconds(body.scheduledStartTime),
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
