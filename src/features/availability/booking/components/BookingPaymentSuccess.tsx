'use client';

import { Button, GlassCard } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { formatBookingWallTime } from '@/features/availability/booking/utils/formatBookingWallTime';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import {
  bcp47ForBookingLocale,
  publicBookingUi,
} from '@/libs/i18n/publicBookingUi';
import { SubscriptionSuccessCheckmark } from '@/features/subscriptions/components/SubscriptionSuccessCheckmark';
import type { AddOnDisplay } from '../types';

function formatMoney(
  cents: number,
  currency: string,
  locale: PublicBookingFlowLocale
): string {
  const safeCents = Number.isFinite(cents) ? Math.max(0, cents) : 0;
  const safeCurrency = (currency || 'usd').toUpperCase();
  return new Intl.NumberFormat(bcp47ForBookingLocale(locale), {
    style: 'currency',
    currency: safeCurrency,
  }).format(safeCents / 100);
}

function formatLinePrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDateDisplay(
  isoDate: string,
  locale: PublicBookingFlowLocale
): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString(
    bcp47ForBookingLocale(locale),
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );
}

/** Stored name may be `Service — Option` (same as webhook / createBooking). */
function splitStoredServiceName(stored: string): {
  title: string;
  variant?: string;
} {
  const parts = stored.split(/\s+—\s+/);
  if (parts.length >= 2) {
    return {
      title: parts[0]?.trim() || stored,
      variant: parts.slice(1).join(' — ').trim() || undefined,
    };
  }
  return { title: stored.trim() || stored };
}

function formatVehicleLine(params: {
  year?: string | null;
  make?: string | null;
  model?: string | null;
}): string | null {
  const parts = [
    params.year?.trim() || null,
    params.make?.trim() || null,
    params.model?.trim() || null,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(' ');
}

export function BookingPaymentSuccess({
  businessName,
  businessSlug,
  serviceName,
  scheduledDate,
  startTime,
  currency,
  paidOnlineAmountCents,
  remainingAmountCents,
  paymentStatus,
  totalAmountCents,
  durationMinutes,
  servicePriceCents,
  selectedAddOns = [],
  customerVehicleYear,
  customerVehicleMake,
  customerVehicleModel,
  bookingFlowLocale = 'en',
}: {
  businessName: string;
  businessSlug: string;
  serviceName: string;
  scheduledDate: string;
  startTime: string;
  currency: string;
  paidOnlineAmountCents: number;
  remainingAmountCents: number;
  paymentStatus: string;
  totalAmountCents: number;
  durationMinutes: number | null;
  servicePriceCents: number | null;
  selectedAddOns?: AddOnDisplay[];
  customerVehicleYear?: string | null;
  customerVehicleMake?: string | null;
  customerVehicleModel?: string | null;
  bookingFlowLocale?: PublicBookingFlowLocale;
}) {
  const ui = publicBookingUi(bookingFlowLocale);
  const paidTitle =
    paymentStatus === 'paid_full'
      ? ui.bookingPaymentSuccess.paidFullTitle
      : ui.bookingPaymentSuccess.depositTitle;
  const heroSubtitle =
    paymentStatus === 'paid_full'
      ? ui.bookingPaymentSuccess.heroPaidFull(businessName)
      : ui.bookingPaymentSuccess.heroDeposit(businessName);

  const { title: serviceTitle, variant: serviceVariant } =
    splitStoredServiceName(serviceName);
  const vehicleLine = formatVehicleLine({
    year: customerVehicleYear,
    make: customerVehicleMake,
    model: customerVehicleModel,
  });
  const dateFormatted = formatDateDisplay(scheduledDate, bookingFlowLocale);
  const timeLabel = formatBookingWallTime(startTime, bookingFlowLocale);
  const safeTotal =
    Number.isFinite(totalAmountCents) && totalAmountCents > 0
      ? totalAmountCents
      : null;

  return (
    <div className="flex flex-col w-full min-h-[55vh] max-w-2xl mx-auto px-4 sm:px-6 py-10 pb-16 sm:pb-24">
      <div className="self-center mb-8">
        <SubscriptionSuccessCheckmark />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2 text-center">
        {paidTitle}
      </h2>
      <p className="self-center text-gray-400 text-sm mb-8 max-w-md text-center px-2">
        {heroSubtitle}
      </p>

      <GlassCard
        padding="none"
        rounded="rounded-2xl"
        blurColor="bg-emerald-500"
        showBlur={true}
        className="w-full mb-8"
      >
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">{ui.common.service}</p>
            <div className="flex items-baseline justify-between gap-4">
              <div className="min-w-0">
                <p className="text-white font-semibold">{serviceTitle}</p>
                {serviceVariant ? (
                  <p className="text-xs text-gray-500 mt-1">{serviceVariant}</p>
                ) : null}
              </div>
              {servicePriceCents != null && servicePriceCents > 0 && (
                <p className="text-sm text-gray-400 shrink-0">
                  {formatLinePrice(servicePriceCents)}
                </p>
              )}
            </div>
          </div>

          {selectedAddOns.length > 0 && (
            <>
              <div className="h-px bg-white/10" />
              <div>
                <p className="text-xs text-gray-500 mb-1">{ui.common.addOns}</p>
                <ul className="space-y-1">
                  {selectedAddOns.map(addOn => (
                    <li
                      key={addOn.id}
                      className="flex justify-between text-sm gap-2"
                    >
                      <span className="text-white min-w-0">
                        {addOn.name}
                        {addOn.durationMinutes != null &&
                        addOn.durationMinutes > 0 ? (
                          <span className="text-gray-500 block text-xs mt-0.5">
                            +
                            {formatDurationMinutes(
                              addOn.durationMinutes,
                              bookingFlowLocale
                            )}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-gray-400 shrink-0">
                        {formatLinePrice(addOn.priceCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {safeTotal != null && (
            <>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-white">
                  {ui.common.total}
                </p>
                <p className="text-lg font-semibold text-white">
                  {formatMoney(safeTotal, currency, bookingFlowLocale)}
                </p>
              </div>
            </>
          )}

          <div className="h-px bg-white/10" />
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
              {ui.bookingPaymentSuccess.serviceLinkPayment}
            </p>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-gray-300">
                {ui.bookingPaymentSuccess.paidNow}
              </span>
              <span className="text-white font-semibold tabular-nums">
                {formatMoney(
                  paidOnlineAmountCents,
                  currency,
                  bookingFlowLocale
                )}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm mt-2">
              <span className="text-gray-300">
                {ui.bookingPaymentSuccess.remaining}
              </span>
              <span className="text-white font-semibold tabular-nums">
                {formatMoney(remainingAmountCents, currency, bookingFlowLocale)}
              </span>
            </div>
          </div>

          <div className="h-px bg-white/10" />
          <div>
            <p className="text-xs text-gray-500 mb-0.5">{ui.common.date}</p>
            <p className="text-white font-medium">{dateFormatted}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">{ui.common.time}</p>
            <p className="text-white font-medium">{timeLabel}</p>
          </div>
          {durationMinutes != null && durationMinutes > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-0.5">
                {ui.common.duration}
              </p>
              <p className="text-white font-medium">
                {formatDurationMinutes(durationMinutes, bookingFlowLocale)}
              </p>
            </div>
          )}

          {vehicleLine && (
            <>
              <div className="h-px bg-white/10" />
              <div>
                <p className="text-xs text-gray-500 mb-0.5">
                  {ui.common.vehicle}
                </p>
                <p className="text-white font-medium">{vehicleLine}</p>
              </div>
            </>
          )}
        </div>
      </GlassCard>

      <Button href={`/${businessSlug}`} variant="inverse" size="lg" fullWidth>
        {ui.bookingPaymentSuccess.backToProfile}
      </Button>

      <p className="text-sm text-gray-400 text-center mt-4">
        {ui.bookingPaymentSuccess.confirmationNote}
      </p>
    </div>
  );
}
