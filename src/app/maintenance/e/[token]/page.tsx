import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { MaintenanceEnrollmentAnchorForm } from '@/features/maintenance/components/MaintenanceEnrollmentAnchorForm';
import { MaintenanceEnrollmentPaymentActions } from '@/features/maintenance/components/MaintenanceEnrollmentPaymentActions';
import { hasMaintenanceAnchorScheduled } from '@/features/maintenance/server/hasMaintenanceAnchorScheduled';
import { loadPublicMaintenanceEnrollmentByToken } from '@/features/maintenance/server/loadPublicMaintenanceEnrollment';
import { maintenanceEnrollmentPaidWithCard } from '@/features/maintenance/server/maintenanceEnrollmentPaymentStatus';
import { maintenancePlanServiceLabel } from '@/features/maintenance/utils/maintenancePlanServiceLabel';
import {
  maintenanceCustomerPaymentOptions,
  type MaintenanceLivePaymentFlags,
} from '@/features/maintenance/server/maintenancePaymentEligibility';
import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import { paymentSettingsOf } from '@/features/payments/server/paymentSettingsQuery';
import { checkoutModeFromDb } from '@/features/payments/utils/paymentSettingsMaps';
import { ownerHasProAccessForBusiness } from '@/features/pricing/server/ownerHasProAccessForBusiness';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

interface PublicMaintenanceEnrollmentPageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ checkout?: string; session_id?: string }>;
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
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime12FromDb(timeVal: string): string {
  const trimmed = timeVal.trim().slice(0, 5);
  const [hs, ms] = trimmed.split(':');
  const h = parseInt(hs ?? '0', 10);
  const m = parseInt(ms ?? '0', 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return trimmed;
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'AM' : 'PM';
  return m === 0
    ? `${h12} ${ampm}`
    : `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function frequencyLabel(weeks: number): string {
  if (weeks === 1) return 'Every week';
  return `Every ${weeks} weeks`;
}

function customerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

type MaintenanceSectionProps = {
  title: string;
  children: ReactNode;
  emphasis?: boolean;
  /** When false, no bordered card — heading + content only (e.g. Payment). */
  surface?: boolean;
};

/** One heading; optional bordered surface below. */
function MaintenanceSection({
  title,
  children,
  emphasis = false,
  surface = true,
}: MaintenanceSectionProps) {
  const surfaceClass = `rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 backdrop-blur-md sm:rounded-2xl sm:px-5 sm:py-4 ${
    emphasis ? 'border-white/[0.12] bg-white/[0.05]' : ''
  }`;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold tracking-tight text-white sm:text-base">
        {title}
      </h2>
      {surface ? (
        <div className={surfaceClass}>{children}</div>
      ) : (
        <div className="pt-0.5">{children}</div>
      )}
    </section>
  );
}

function formatEnrollmentStatusLine(
  status: string,
  paymentStatus: string
): string {
  if (status === 'accepted') {
    if (maintenanceEnrollmentPaidWithCard(paymentStatus)) return 'Paid online';
    if (paymentStatus === 'pay_in_person') return 'Pay in person';
    return 'Complete';
  }
  if (status === 'enrolled_pending_customer') return 'Waiting on payment';
  return status.replace(/_/g, ' ');
}

export default async function PublicMaintenanceEnrollmentPage({
  params,
  searchParams,
}: PublicMaintenanceEnrollmentPageProps) {
  const { token } = await params;
  const query = await searchParams;
  if (!token?.trim()) notFound();

  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const enrollment = await loadPublicMaintenanceEnrollmentByToken(db, token);
  if (!enrollment) {
    notFound();
  }

  const status = String(enrollment.status ?? '');

  const businessId = enrollment.business_id as string;

  const [
    { data: businessRow },
    { data: customerRow },
    ownerHasPro,
    { data: settingsRow, error: settingsError },
    { data: accountRow, error: accountError },
  ] = await Promise.all([
    db
      .from('business_profiles')
      .select('business_name, business_type')
      .eq('id', businessId)
      .maybeSingle(),
    db
      .from('customers')
      .select('full_name, email')
      .eq('id', enrollment.customer_id as string)
      .maybeSingle(),
    ownerHasProAccessForBusiness(supabase, businessId),
    paymentSettingsOf(supabase)
      .select('payments_enabled, checkout_mode')
      .eq('business_id', businessId)
      .maybeSingle(),
    paymentAccountsOf(supabase)
      .select('charges_enabled')
      .eq('business_id', businessId)
      .maybeSingle(),
  ]);

  const paymentsEnabled =
    !settingsError &&
    (settingsRow as { payments_enabled?: boolean } | null)?.payments_enabled ===
      true;
  const checkoutMode = checkoutModeFromDb(
    (settingsRow as { checkout_mode?: string | null } | null)?.checkout_mode
  );
  const chargesEnabled =
    !accountError &&
    (accountRow as { charges_enabled?: boolean } | null)?.charges_enabled ===
      true;

  const liveFlags: MaintenanceLivePaymentFlags = {
    checkoutMode,
    paymentsEnabled,
    chargesEnabled,
    ownerHasProForPayments: ownerHasPro,
  };

  const { showPayInPerson, showPayWithCard } =
    maintenanceCustomerPaymentOptions(liveFlags);

  const checkoutRaw = query.checkout?.trim().toLowerCase();
  const checkoutReturn =
    checkoutRaw === 'success'
      ? ('success' as const)
      : checkoutRaw === 'cancel'
        ? ('cancel' as const)
        : null;

  const businessName =
    (
      businessRow as { business_name?: string | null } | null
    )?.business_name?.trim() || 'Your detailer';
  const businessTypeLabel =
    (
      businessRow as { business_type?: string | null } | null
    )?.business_type?.trim() ?? '';
  const customerName =
    (customerRow as { full_name?: string | null } | null)?.full_name?.trim() ||
    'Customer';
  const customerEmail =
    (customerRow as { email?: string | null } | null)?.email?.trim() ?? '';

  const initials = customerInitials(customerName);
  const paymentStatusRaw = String(enrollment.payment_status ?? '');
  const statusLine = formatEnrollmentStatusLine(status, paymentStatusRaw);
  const isEnrollmentAccepted = status === 'accepted';
  const firstVisitScheduled = hasMaintenanceAnchorScheduled(enrollment);
  const paymentsRequired =
    !isEnrollmentAccepted && (showPayInPerson || showPayWithCard);
  const mustPickDateFirst =
    paymentsRequired && !firstVisitScheduled && !isEnrollmentAccepted;

  return (
    <main className="min-h-screen bg-[var(--dashboard-bg)] text-white">
      <div className="mx-auto w-full max-w-lg px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-10 md:max-w-xl lg:max-w-2xl lg:px-8 lg:pt-12">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl md:text-3xl">
            Your maintenance plan
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-400 md:max-w-lg">
            Here is your maintenance plan.
          </p>
        </header>

        {isEnrollmentAccepted ? (
          <div
            className="mb-6 flex gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/25 px-4 py-4 backdrop-blur-md sm:mb-7 sm:rounded-2xl sm:px-5 sm:py-4"
            role="status"
          >
            <CheckCircleIcon
              className="h-11 w-11 shrink-0 text-emerald-500"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold leading-snug text-white">
                Your maintenance plan is confirmed.
              </p>
              <p className="mt-1.5 text-sm text-gray-400">
                With {businessName}. Read on for the details.
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-6 sm:gap-7">
          <MaintenanceSection title="Business">
            <div className="flex min-w-0 gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10"
                aria-hidden
              >
                <BuildingStorefrontIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="min-w-0 py-0.5">
                <p className="text-xl font-semibold leading-tight tracking-tight text-white sm:text-2xl">
                  {businessName}
                </p>
                {businessTypeLabel ? (
                  <p className="mt-1.5 text-sm text-gray-400">
                    {businessTypeLabel}
                  </p>
                ) : null}
              </div>
            </div>
          </MaintenanceSection>

          <MaintenanceSection title="Customer">
            <div className="flex min-w-0 gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-gray-200 ring-1 ring-white/10 sm:h-12 sm:w-12 sm:text-base"
                aria-hidden
              >
                {initials}
              </div>
              <div className="min-w-0 py-0.5">
                <p className="truncate text-base font-medium text-white sm:text-lg">
                  {customerName}
                </p>
                {customerEmail ? (
                  <p className="mt-0.5 break-all text-xs leading-snug text-gray-400 sm:text-sm">
                    {customerEmail}
                  </p>
                ) : null}
              </div>
            </div>
          </MaintenanceSection>

          <MaintenanceSection title="Service and dates">
            <div className="space-y-4">
              <div>
                <p className="text-base font-semibold leading-snug text-white">
                  {maintenancePlanServiceLabel(
                    enrollment.service_name_snapshot
                  )}
                </p>
                <p className="mt-2 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-medium text-gray-300">
                  {formatDurationMinutes(
                    Number(enrollment.duration_minutes ?? 0)
                  )}
                </p>
              </div>

              <div className="h-px bg-white/[0.06]" />

              {!isEnrollmentAccepted && !firstVisitScheduled ? (
                <MaintenanceEnrollmentAnchorForm token={token.trim()} />
              ) : null}

              {firstVisitScheduled || isEnrollmentAccepted ? (
                <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
                  <div>
                    <p className="text-sm font-semibold leading-snug text-white">
                      {formatDateLong(String(enrollment.anchor_date ?? ''))}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Preferred time{' '}
                      {formatTime12FromDb(String(enrollment.anchor_time ?? ''))}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-sm font-semibold text-white">
                      {frequencyLabel(Number(enrollment.frequency_weeks ?? 0))}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </MaintenanceSection>

          <MaintenanceSection title="Price" emphasis>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <p className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-white sm:text-4xl">
                {formatPrice(Number(enrollment.price_cents ?? 0))}
              </p>
              <p className="max-w-xs text-xs leading-relaxed text-gray-500 sm:text-right">
                {mustPickDateFirst
                  ? 'Choose a date above, then pay below.'
                  : paymentsRequired
                    ? 'Continue to payment'
                    : 'Your price for this maintenance detail.'}
              </p>
            </div>
          </MaintenanceSection>

          <MaintenanceSection title="Payment">
            <MaintenanceEnrollmentPaymentActions
              token={token.trim()}
              businessDisplayName={businessName}
              showPayInPerson={showPayInPerson}
              showPayWithCard={showPayWithCard}
              firstVisitScheduled={firstVisitScheduled}
              initialStatus={status}
              initialPaymentStatus={paymentStatusRaw}
              checkoutReturn={checkoutReturn}
            />
          </MaintenanceSection>
        </div>

        {!isEnrollmentAccepted ? (
          <p className="mt-8 text-center text-xs text-gray-500 sm:mt-10">
            <span className="font-medium text-gray-300">{statusLine}</span>
          </p>
        ) : null}

        <footer
          className="mt-10 px-2 pb-2 lg:mt-14"
          style={{
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
          }}
        >
          <div className="w-full border-t border-white/[0.06] pt-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <Link
                href="/"
                className="group inline-flex items-center gap-2 text-gray-500 transition-colors hover:text-gray-300"
              >
                <span className="text-[11px] uppercase tracking-wider">
                  Powered by
                </span>
                <Image
                  src="/favicon.png"
                  alt=""
                  width={14}
                  height={14}
                  className="opacity-70 transition-opacity group-hover:opacity-100"
                />
                <span className="text-sm font-medium text-gray-400 transition-colors group-hover:text-white">
                  ServiceLink
                </span>
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
