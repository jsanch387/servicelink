import { GlassCard } from '@/components/shared';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import crypto from 'crypto';
import { notFound } from 'next/navigation';

interface PublicQuoteViewPageProps {
  params: Promise<{ token: string }>;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDateLong(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.slice(0, 5).split(':').map(Number);
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'AM' : 'PM';
  return m === 0
    ? `${h12} ${ampm}`
    : `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default async function PublicQuoteViewPage({
  params,
}: PublicQuoteViewPageProps) {
  const { token } = await params;
  if (!token?.trim()) notFound();

  const tokenHash = crypto
    .createHash('sha256')
    .update(token.trim())
    .digest('hex');
  const supabase = createSupabaseAdminClient();
  // `quotes` / `quote_public_links` may not yet be in generated DB types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const nowIso = new Date().toISOString();

  const { data: linkRow } = await db
    .from('quote_public_links')
    .select(
      'id, quote_id, is_active, revoked_at, expires_at, view_count, first_viewed_at'
    )
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (!linkRow) notFound();

  const link = linkRow as {
    id: string;
    quote_id: string;
    is_active: boolean;
    revoked_at: string | null;
    expires_at: string;
    view_count: number;
    first_viewed_at: string | null;
  };

  if (!link.is_active || link.revoked_at || link.expires_at <= nowIso) {
    notFound();
  }

  const { data: quoteRow } = await db
    .from('quotes')
    .select(
      'id, customer_name, customer_email, vehicle_year, vehicle_make, vehicle_model, service_name, price_cents, duration_minutes, note, scheduled_date, scheduled_start_time, status'
    )
    .eq('id', link.quote_id)
    .maybeSingle();

  if (!quoteRow) notFound();

  const quote = quoteRow as {
    id: string;
    customer_name: string;
    customer_email: string;
    vehicle_year: string | null;
    vehicle_make: string | null;
    vehicle_model: string | null;
    service_name: string;
    price_cents: number;
    duration_minutes: number;
    note: string | null;
    scheduled_date: string;
    scheduled_start_time: string;
    status: string;
  };

  await db
    .from('quote_public_links')
    .update({
      view_count: (link.view_count ?? 0) + 1,
      first_viewed_at: link.first_viewed_at ?? nowIso,
      last_viewed_at: nowIso,
    })
    .eq('id', link.id);

  await db
    .from('quotes')
    .update({
      status: quote.status === 'sent' ? 'viewed' : quote.status,
      viewed_at: nowIso,
    })
    .eq('id', quote.id);

  return (
    <main className="min-h-screen bg-[var(--dashboard-bg)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-xl">
        <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
          Review Quote
        </h1>
        <p className="mt-0.5 max-w-xl text-sm text-gray-500">
          Review the details below before choosing to accept or decline.
        </p>
        <div className="mt-4 h-px w-full bg-white/10" aria-hidden />

        <GlassCard
          padding="md"
          rounded="rounded-2xl"
          blurColor="bg-zinc-500"
          showBlur={true}
          className="mt-6 w-full"
        >
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs tracking-wider text-gray-500">
                Service
              </p>
              <p className="font-medium text-white">{quote.service_name}</p>
              <p className="mt-0.5 text-sm text-gray-400">
                {formatPrice(quote.price_cents)} •{' '}
                {formatDurationMinutes(quote.duration_minutes)}
              </p>
            </div>
            <div className="h-px bg-white/10" />
            <div>
              <p className="mb-1 text-xs tracking-wider text-gray-500">
                Date &amp; time
              </p>
              <p className="font-medium text-white">
                {formatDateLong(quote.scheduled_date)}
              </p>
              <p className="mt-0.5 text-sm text-gray-400">
                Starts {formatTime12(quote.scheduled_start_time)}
              </p>
            </div>
            <div className="h-px bg-white/10" />
            <div>
              <p className="mb-1 text-xs tracking-wider text-gray-500">
                Customer
              </p>
              <p className="font-medium text-white">{quote.customer_name}</p>
              <p className="break-words text-sm text-gray-400">
                {quote.customer_email}
              </p>
            </div>
            {quote.vehicle_year || quote.vehicle_make || quote.vehicle_model ? (
              <>
                <div className="h-px bg-white/10" />
                <div>
                  <p className="mb-1 text-xs tracking-wider text-gray-500">
                    Vehicle
                  </p>
                  <p className="font-medium text-white">
                    {[
                      quote.vehicle_year,
                      quote.vehicle_make,
                      quote.vehicle_model,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  </p>
                </div>
              </>
            ) : null}
            {quote.note?.trim() ? (
              <>
                <div className="h-px bg-white/10" />
                <div>
                  <p className="mb-1 text-xs tracking-wider text-gray-500">
                    Note
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-gray-400">
                    {quote.note}
                  </p>
                </div>
              </>
            ) : null}
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
