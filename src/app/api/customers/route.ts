import type { CustomerDbRow } from '@/features/customer-management/api/customerDbRow';
import { mapCustomerRowToRecord } from '@/features/customer-management/api/mapCustomerRowToRecord';
import {
  aggregateBookingsPerCustomer,
  type BookingRowForCustomerMetrics,
} from '@/features/customer-management/server/aggregateBookingsPerCustomer';
import { loadLatestMaintenanceEnrollmentByCustomerIds } from '@/features/customer-management/server/loadLatestMaintenanceEnrollmentByCustomerIds';
import {
  DUPLICATE_CUSTOMER_MESSAGE,
  parseCreateCustomerBody,
} from '@/features/customer-management/utils/parseCreateCustomerBody';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextResponse } from 'next/server';

function withHttps(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

type CustomerIdRow = { id: string };

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const resolved = await resolveCurrentBusinessId(supabase);

    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const businessId = resolved.businessId;
    const rawBody: unknown = await req.json().catch(() => null);
    const parsed = parseCreateCustomerBody(rawBody);
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    if (parsed.phoneNormalized) {
      const { data: byPhone } = await db
        .from('customers')
        .select('id')
        .eq('business_id', businessId)
        .eq('phone_normalized', parsed.phoneNormalized)
        .maybeSingle();

      const row = byPhone as CustomerIdRow | null;
      if (row?.id) {
        return NextResponse.json(
          { success: false, error: DUPLICATE_CUSTOMER_MESSAGE },
          { status: 409 }
        );
      }
    }

    if (parsed.emailNormalized) {
      const { data: byEmail } = await db
        .from('customers')
        .select('id')
        .eq('business_id', businessId)
        .eq('email_normalized', parsed.emailNormalized)
        .maybeSingle();

      const row = byEmail as CustomerIdRow | null;
      if (row?.id) {
        return NextResponse.json(
          { success: false, error: DUPLICATE_CUSTOMER_MESSAGE },
          { status: 409 }
        );
      }
    }

    const { error: insertError } = await db.from('customers').insert({
      business_id: businessId,
      full_name: parsed.fullName,
      phone: parsed.phoneNormalized,
      email: parsed.emailNormalized,
      phone_normalized: parsed.phoneNormalized,
      email_normalized: parsed.emailNormalized,
      notes: parsed.notes,
      maintenance_visits_completed: 0,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { success: false, error: DUPLICATE_CUSTOMER_MESSAGE },
          { status: 409 }
        );
      }
      console.error('customers POST insert:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: insertError.message || 'Failed to create customer',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('customers POST:', e);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error, code: auth.code },
        { status: auth.status }
      );
    }

    const { supabase } = auth;
    const resolved = await resolveCurrentBusinessId(supabase);

    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const businessId = resolved.businessId;
    const {
      data: businessProfile,
      error: businessProfileError,
    }: {
      data: {
        business_name: string | null;
        business_slug: string | null;
        business_link: string | null;
      } | null;
      error: unknown;
    } = await supabase
      .from('business_profiles')
      .select('business_name, business_slug, business_link')
      .eq('id', businessId)
      .single();

    if (businessProfileError) {
      return NextResponse.json(
        { success: false, error: 'Failed to load business profile' },
        { status: 500 }
      );
    }

    const baseUrl = (
      process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app'
    ).replace(/\/$/, '');
    const businessBookingLink = businessProfile?.business_link
      ? withHttps(businessProfile.business_link)
      : businessProfile?.business_slug
        ? `${baseUrl}/${encodeURIComponent(businessProfile.business_slug)}`
        : `${baseUrl}/businessname`;

    const { data: rows, error } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('customers list error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to load customers' },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bookingRows, error: bookingError } = await (supabase as any)
      .from('bookings')
      .select(
        'customer_id, service_name, service_price_cents, addon_details, scheduled_date, start_time, status, created_at'
      )
      .eq('business_id', businessId)
      .not('customer_id', 'is', null);

    if (bookingError) {
      console.error('customers list bookings error:', bookingError);
      return NextResponse.json(
        {
          success: false,
          error: bookingError.message || 'Failed to load booking metrics',
        },
        { status: 500 }
      );
    }

    const metricsByCustomer = aggregateBookingsPerCustomer(
      (bookingRows ?? []) as BookingRowForCustomerMetrics[]
    );

    const customerRows: CustomerDbRow[] =
      (rows as CustomerDbRow[] | null) ?? [];
    const customerIds = customerRows.map(r => r.id);
    const maintenanceByCustomer =
      await loadLatestMaintenanceEnrollmentByCustomerIds(
        supabase,
        businessId,
        customerIds
      );

    const customers = customerRows.map(row =>
      mapCustomerRowToRecord(
        row,
        metricsByCustomer.get(row.id) ?? null,
        maintenanceByCustomer.get(row.id) ?? null
      )
    );

    return NextResponse.json({
      success: true,
      customers,
      businessName: businessProfile?.business_name ?? null,
      businessBookingLink,
    });
  } catch (e) {
    console.error('customers GET:', e);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}
