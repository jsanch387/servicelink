import { GlassCard } from '@/components/shared';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { parsePublicQuoteRequestNote } from '@/features/quotes/dashboard/utils/parsePublicQuoteRequestNote';
import { PublicQuoteRespondActions } from '@/features/quotes/public-view/components/PublicQuoteRespondActions';
import { resolveQuoteTokenHash } from '@/features/quotes/shared/utils/resolveQuoteTokenHash';
import { formatUsPhoneDigits } from '@/lib/formatUsPhone';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
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

function customerRequestRawFromRow(q: {
  source: string;
  note: string | null;
  request_message: string | null;
}): string {
  if (q.source !== 'customer_requested') return '';
  return q.request_message?.trim() || q.note?.trim() || '';
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

  const tokenHash = resolveQuoteTokenHash(token);
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
      'id, source, customer_name, customer_email, customer_phone, vehicle_year, vehicle_make, vehicle_model, service_name, price_cents, duration_minutes, note, request_message, scheduled_date, scheduled_start_time, status'
    )
    .eq('id', link.quote_id)
    .maybeSingle();

  if (!quoteRow) notFound();

  const quote = quoteRow as {
    id: string;
    source: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    vehicle_year: string | null;
    vehicle_make: string | null;
    vehicle_model: string | null;
    service_name: string;
    price_cents: number;
    duration_minutes: number;
    note: string | null;
    request_message: string | null;
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

  // Atomic transition to avoid clobbering approved/declined with stale reads.
  await db
    .from('quotes')
    .update({
      status: 'viewed',
      viewed_at: nowIso,
    })
    .eq('id', quote.id)
    .eq('status', 'sent');

  const { data: quoteFresh } = await db
    .from('quotes')
    .select(
      'id, source, customer_name, customer_email, customer_phone, vehicle_year, vehicle_make, vehicle_model, service_name, price_cents, duration_minutes, note, request_message, scheduled_date, scheduled_start_time, status'
    )
    .eq('id', quote.id)
    .maybeSingle();

  if (!quoteFresh) notFound();

  const displayQuote = quoteFresh as typeof quote;
  const isAccepted = displayQuote.status === 'approved';
  const isDeclined = displayQuote.status === 'declined';
  const customerPhoneDigits =
    displayQuote.customer_phone?.replace(/\D/g, '') ?? '';
  const customerPhoneDisplay =
    customerPhoneDigits.length === 10
      ? formatUsPhoneDigits(customerPhoneDigits)
      : null;

  const isCustomerRequested = displayQuote.source === 'customer_requested';
  const requestRaw = customerRequestRawFromRow(displayQuote);
  const parsedRequest = parsePublicQuoteRequestNote(requestRaw);
  const yourRequestText =
    isCustomerRequested && isAccepted
      ? parsedRequest.detailsOnly.trim()
      : isCustomerRequested
        ? requestRaw.trim()
        : '';
  const ownerNoteText = displayQuote.note?.trim() ?? '';
  const showYourRequestBlock = yourRequestText.length > 0;
  const showOwnerNoteBlock = ownerNoteText.length > 0;

  return (
    <main className="min-h-screen bg-[var(--dashboard-bg)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-xl">
        {isAccepted ? (
          <div
            className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3.5 sm:gap-3.5 sm:px-5"
            role="status"
          >
            <CheckCircleIcon
              className="h-8 w-8 shrink-0 text-emerald-400"
              aria-hidden
            />
            <p className="text-sm font-semibold text-emerald-100">
              Quote accepted — you&apos;re all set.
            </p>
          </div>
        ) : null}

        {isDeclined ? (
          <div
            className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3.5 sm:gap-3.5 sm:px-5"
            role="status"
          >
            <XCircleIcon
              className="h-8 w-8 shrink-0 text-red-400"
              aria-hidden
            />
            <p className="text-sm font-semibold text-red-100">
              Quote declined.
            </p>
          </div>
        ) : null}

        <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
          {isAccepted
            ? 'Your quote'
            : isDeclined
              ? 'Quote details'
              : 'Review Quote'}
        </h1>
        <p className="mt-0.5 max-w-xl text-sm text-gray-500">
          {isAccepted
            ? 'Summary of what you agreed to.'
            : isDeclined
              ? 'What was offered on this link.'
              : 'Review the details below before choosing to accept or decline.'}
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
              <p className="font-medium text-white">
                {displayQuote.service_name}
              </p>
              <p className="mt-0.5 text-sm text-gray-400">
                {formatDurationMinutes(displayQuote.duration_minutes)}
              </p>
            </div>
            <div className="h-px bg-white/10" />
            <div>
              <p className="mb-1 text-xs tracking-wider text-gray-500">
                Date &amp; time
              </p>
              <p className="font-medium text-white">
                {formatDateLong(displayQuote.scheduled_date)}
              </p>
              <p className="mt-0.5 text-sm text-gray-400">
                Starts {formatTime12(displayQuote.scheduled_start_time)}
              </p>
            </div>
            <div className="h-px bg-white/10" />
            <div>
              <p className="mb-1 text-xs tracking-wider text-gray-500">
                Customer
              </p>
              <p className="font-medium text-white">
                {displayQuote.customer_name}
              </p>
              <p className="break-words text-sm text-gray-400">
                {displayQuote.customer_email}
              </p>
              {customerPhoneDisplay ? (
                <p className="mt-0.5 text-sm text-gray-400 tabular-nums">
                  {customerPhoneDisplay}
                </p>
              ) : null}
            </div>
            {displayQuote.vehicle_year ||
            displayQuote.vehicle_make ||
            displayQuote.vehicle_model ? (
              <>
                <div className="h-px bg-white/10" />
                <div>
                  <p className="mb-1 text-xs tracking-wider text-gray-500">
                    Vehicle
                  </p>
                  <p className="font-medium text-white">
                    {[
                      displayQuote.vehicle_year,
                      displayQuote.vehicle_make,
                      displayQuote.vehicle_model,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  </p>
                </div>
              </>
            ) : null}
            {showYourRequestBlock ? (
              <>
                <div className="h-px bg-white/10" />
                <div>
                  <p className="mb-1 text-xs tracking-wider text-gray-500">
                    Customer note
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-gray-400">
                    {yourRequestText}
                  </p>
                </div>
              </>
            ) : null}
            {showOwnerNoteBlock ? (
              <>
                <div className="h-px bg-white/10" />
                <div>
                  <p className="mb-1 text-xs tracking-wider text-gray-500">
                    Notes from the business
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-gray-400">
                    {ownerNoteText}
                  </p>
                </div>
              </>
            ) : null}
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
              <p className="text-sm font-medium text-gray-300">Total</p>
              <p className="text-lg font-bold text-white">
                {formatPrice(displayQuote.price_cents)}
              </p>
            </div>
          </div>
        </GlassCard>

        <PublicQuoteRespondActions
          token={token.trim()}
          initialStatus={displayQuote.status}
        />
      </div>
    </main>
  );
}
