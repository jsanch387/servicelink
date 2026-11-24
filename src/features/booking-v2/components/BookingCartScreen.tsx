'use client';

import { BookFlowLoadingState } from '@/features/availability/booking/components/BookFlowLoadingState';
import { bookingV2ColumnClass } from '@/features/booking-v2/bookingV2Column';
import type { ServiceLocationMode } from '@/features/business-profile/utils/serviceLocationMode';
import type { PublicActiveSale } from '@/features/marketing/types/publicActiveSale';
import {
  getBusinessBookV2PlaceUrl,
  getBusinessBookV2ServicesUrl,
  getBusinessBookV2SetupUrl,
  getBusinessBookV2TimeUrl,
  getPublicBusinessProfilePath,
  type PublicBookingFlowLocale,
} from '@/constants/routes';
import { PUBLIC_BOOKING_MAX_JOBS } from '@/features/availability/booking/constants/publicBookingJobs';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import type { BookingV2Cart, BookingV2ServiceLocation } from '../types';
import { cartVisitTotals } from '../utils/cartVisitTotals';
import {
  readBookingV2Cart,
  removeBookingV2CartItem,
  saveBookingV2ServiceLocation,
} from '../utils/bookingV2Cart';
import { formatCartDollars } from '../utils/formatCartMoney';
import { BookingCartFooter } from './BookingCartFooter';
import { BookingCartItemCard } from './BookingCartItemCard';
import { ServiceSetupHeader } from './ServiceSetupHeader';

export function BookingCartScreen({
  businessSlug,
  bookingFlowLocale,
  locationMode,
  sale,
}: {
  businessSlug: string;
  bookingFlowLocale: PublicBookingFlowLocale;
  locationMode: ServiceLocationMode;
  sale: PublicActiveSale | null;
}) {
  const flowUi = publicBookingUi(bookingFlowLocale);
  const ui = flowUi.bookingV2;
  const router = useRouter();
  const [cart, setCart] = useState<BookingV2Cart | null>(null);

  useEffect(() => {
    const next = readBookingV2Cart(businessSlug);
    if (next.items.length === 0 || locationMode === 'both') {
      setCart(next);
      return;
    }
    const implied: BookingV2ServiceLocation =
      locationMode === 'shop_only' ? 'shop' : 'mobile';
    if (next.serviceLocation === implied) {
      setCart(next);
      return;
    }
    setCart(saveBookingV2ServiceLocation(businessSlug, implied));
  }, [businessSlug, locationMode]);

  if (!cart) return <BookFlowLoadingState />;

  const totals = cartVisitTotals(cart.items);
  const asksLocation = locationMode === 'both' && cart.items.length > 0;
  const canContinue = cart.items.length > 0;
  const savings = totals.originalCents - totals.dueCents;
  const offLabel =
    savings > 0
      ? sale?.discountType === 'percentage'
        ? ui.percentOffApplied(sale.discountValue)
        : ui.amountOffApplied(formatCartDollars(savings))
      : null;
  const firstItem = cart.items[0];
  const backHref = firstItem
    ? getBusinessBookV2SetupUrl(businessSlug, {
        serviceId: firstItem.serviceId,
        lang: bookingFlowLocale,
        editIndex: 0,
      })
    : getPublicBusinessProfilePath(businessSlug, { lang: bookingFlowLocale });

  return (
    <div
      className={`${bookingV2ColumnClass} flex min-h-screen flex-col bg-[#0F0F0F] text-white`}
    >
      <ServiceSetupHeader
        businessSlug={businessSlug}
        bookingFlowLocale={bookingFlowLocale}
        backHref={backHref}
        backLabel={firstItem ? ui.back : ui.backToProfile}
      />
      <main className="flex flex-1 flex-col gap-7 px-5 pb-36 pt-7">
        <div>
          <h1 className="text-[26px] font-bold leading-[1.15] tracking-[-0.6px] text-white">
            {ui.yourBooking}
          </h1>
          <p className="mt-0.5 text-[15px] font-normal leading-5 text-[#A3A3A3]">
            {asksLocation
              ? ui.yourBookingSubtitlePlace
              : ui.yourBookingSubtitle}
          </p>
        </div>

        {cart.items.length === 0 ? (
          <p className="text-[15px] text-[#A3A3A3]">{ui.emptyBooking}</p>
        ) : null}

        <div className="flex flex-col gap-3">
          {cart.items.map((item, index) => (
            <BookingCartItemCard
              key={`${item.serviceId}-${index}`}
              item={item}
              editIndex={index}
              businessSlug={businessSlug}
              bookingFlowLocale={bookingFlowLocale}
              onRemove={() =>
                setCart(removeBookingV2CartItem(businessSlug, index))
              }
            />
          ))}
          {cart.items.length >= PUBLIC_BOOKING_MAX_JOBS ? (
            <p className="px-1 text-[14px] leading-5 text-[#A3A3A3]">
              {flowUi.multiJob.maxJobsReached}
            </p>
          ) : (
            <Link
              href={getBusinessBookV2ServicesUrl(businessSlug, {
                lang: bookingFlowLocale,
              })}
              className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-[#262626] bg-[#181818] px-4 py-3.5 text-left hover:bg-[#202020]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2A2A2A] text-white">
                <PlusIcon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[16px] font-semibold leading-5 text-white">
                  {ui.addAnotherService}
                </span>
                <span className="mt-0.5 block text-[13px] font-normal leading-5 text-[#8F8F8F]">
                  {ui.addAnotherServiceHint}
                </span>
              </span>
            </Link>
          )}
        </div>
      </main>
      {cart.items.length > 0 ? (
        <BookingCartFooter
          dueCents={totals.dueCents}
          durationMinutes={totals.durationMinutes}
          offLabel={offLabel}
          canContinue={canContinue}
          actionLabel={asksLocation ? ui.continue : undefined}
          onPickTime={() =>
            router.push(
              (asksLocation
                ? getBusinessBookV2PlaceUrl
                : getBusinessBookV2TimeUrl)(businessSlug, {
                lang: bookingFlowLocale,
              })
            )
          }
          bookingFlowLocale={bookingFlowLocale}
        />
      ) : null}
    </div>
  );
}
