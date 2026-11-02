import type { PublicBookingFlowLocale } from '@/constants/routes';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { formatBookingWallTime } from '@/features/availability/booking/utils/formatBookingWallTime';
import { formatSalesTaxRateLabel } from '@/features/payments/utils/salesTaxRate';
import { formatPhoneUsDisplay } from '@/lib/formatPhoneUs';
import {
  bcp47ForBookingLocale,
  publicBookingUi,
} from '@/libs/i18n/publicBookingUi';
import React from 'react';
import type {
  CustomerSubscriptionPlan,
  SubscriptionCadenceOption,
} from '../types/customerSubscriptionPlan';
import {
  formatCadenceOptionLabel,
  formatCadencePriceSuffix,
  formatMembershipAmountCents,
  formatSubscriptionPriceCents,
} from '../utils/formatSubscriptionPrice';
import type { MembershipServiceDetailsValue } from './MembershipServiceDetailsFields';

function ReviewField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-white/60">{label}</p>
      <div className="mt-1 text-sm leading-5 text-white">{children}</div>
    </div>
  );
}

function addressLines(details: MembershipServiceDetailsValue): string[] {
  const street = [details.street.trim(), details.unit.trim()]
    .filter(Boolean)
    .join(', ');
  const cityState = [details.city.trim(), details.state.trim()]
    .filter(Boolean)
    .join(', ');
  const cityLine = [cityState, details.zip.trim()].filter(Boolean).join(' ');
  return [street, cityLine].filter(Boolean);
}

/**
 * Subscribe review. The plan price stays pre-tax. Tax and the charged total
 * live in the breakdown, not above the pay button.
 */
export function MembershipSubscribeReview({
  plan,
  cadenceOption,
  details,
  firstVisitDate,
  firstVisitTime,
  visitDurationMinutes,
  needsAddress,
  bookingFlowLocale = 'en',
}: {
  plan: CustomerSubscriptionPlan;
  cadenceOption: SubscriptionCadenceOption;
  details: MembershipServiceDetailsValue;
  firstVisitDate: Date;
  firstVisitTime: string;
  visitDurationMinutes: number;
  needsAddress: boolean;
  bookingFlowLocale?: PublicBookingFlowLocale;
}) {
  const ui = publicBookingUi(bookingFlowLocale);
  const taxCents = Math.max(0, Math.round(cadenceOption.taxCents ?? 0));
  const totalCents =
    Math.max(0, Math.round(cadenceOption.priceCents)) + taxCents;
  const rate = formatSalesTaxRateLabel(cadenceOption.taxRateBps ?? 0);
  const taxLabel = rate ? ui.common.salesTax(rate) : '';
  const cadenceLabel = formatCadenceOptionLabel(
    cadenceOption,
    bookingFlowLocale
  );
  const price = formatSubscriptionPriceCents(
    cadenceOption.priceCents,
    bookingFlowLocale
  );
  const priceSuffix = formatCadencePriceSuffix(
    cadenceOption,
    bookingFlowLocale
  );

  const whenDate = firstVisitDate.toLocaleDateString(
    bcp47ForBookingLocale(bookingFlowLocale),
    { weekday: 'short', month: 'short', day: 'numeric' }
  );
  const whenTime = formatBookingWallTime(firstVisitTime, bookingFlowLocale);
  const duration =
    visitDurationMinutes > 0
      ? formatDurationMinutes(visitDurationMinutes, bookingFlowLocale)
      : '';

  const name = details.fullName.trim();
  const email = details.email.trim();
  const phone = formatPhoneUsDisplay(details.phone);
  const vehicle = [
    details.vehicleYear,
    details.vehicleMake,
    details.vehicleModel,
  ]
    .map(part => part.trim())
    .filter(Boolean)
    .join(' ');
  const address = needsAddress ? addressLines(details) : [];

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        <div className="flex items-baseline justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-sm text-white">{plan.name}</p>
            <p className="mt-0.5 text-sm text-white/60">{cadenceLabel}</p>
          </div>
          <p className="shrink-0 text-sm tabular-nums text-white/60">
            {price}
            {priceSuffix}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        <div className="grid grid-cols-1 gap-5 px-4 py-4 sm:grid-cols-2 sm:gap-x-8 sm:px-6 sm:py-5">
          <ReviewField label={ui.subscriptions.reviewFirstVisitLabel}>
            <p>
              {whenDate} · {whenTime}
            </p>
            {duration ? <p className="text-white/60">{duration}</p> : null}
          </ReviewField>
          {name || email || phone ? (
            <ReviewField label={ui.common.customer}>
              {name ? <p>{name}</p> : null}
              {email ? (
                <p className="break-words text-white/60">{email}</p>
              ) : null}
              {phone ? (
                <p className="tabular-nums text-white/60">{phone}</p>
              ) : null}
            </ReviewField>
          ) : null}
          {vehicle ? (
            <ReviewField label={ui.common.vehicle}>
              <p>{vehicle}</p>
            </ReviewField>
          ) : null}
          {address.length > 0 ? (
            <ReviewField label={ui.common.address}>
              {address.map(line => (
                <p key={line}>{line}</p>
              ))}
            </ReviewField>
          ) : null}
        </div>

        <div className="mx-4 border-t border-white/[0.08] sm:mx-6" />
        <dl className="flex flex-col gap-2 px-4 py-4 text-sm sm:px-6">
          {taxCents > 0 ? (
            <>
              <div className="flex items-center justify-between gap-4 text-white/60">
                <dt>{cadenceLabel}</dt>
                <dd className="tabular-nums text-white">
                  {formatMembershipAmountCents(cadenceOption.priceCents)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 text-white/60">
                <dt>{taxLabel}</dt>
                <dd className="tabular-nums text-white">
                  {formatMembershipAmountCents(taxCents)}
                </dd>
              </div>
            </>
          ) : null}
          <div className="flex items-baseline justify-between gap-4 font-semibold text-white">
            <dt>{ui.common.total}</dt>
            <dd className="text-xl tabular-nums">
              {formatMembershipAmountCents(totalCents)}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
