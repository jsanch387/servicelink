'use client';

import {
  getBusinessBookV2CartUrl,
  getBusinessBookV2TimeUrl,
  type PublicBookingFlowLocale,
} from '@/constants/routes';
import { BookFlowLoadingState } from '@/features/availability/booking/components/BookFlowLoadingState';
import { bookingV2ColumnClass } from '@/features/booking-v2/bookingV2Column';
import type { ServiceLocationMode } from '@/features/business-profile/utils/serviceLocationMode';
import type { PublicActiveSale } from '@/features/marketing/types/publicActiveSale';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import type { BookingV2Cart, BookingV2ServiceLocation } from '../types';
import { cartVisitTotals } from '../utils/cartVisitTotals';
import {
  readBookingV2Cart,
  saveBookingV2ServiceLocation,
} from '../utils/bookingV2Cart';
import { formatCartDollars } from '../utils/formatCartMoney';
import { BookingCartFooter } from './BookingCartFooter';
import { BookingCartLocationChoice } from './BookingCartLocationChoice';
import { ServiceSetupHeader } from './ServiceSetupHeader';

export function BookingPlaceScreen({
  businessSlug,
  bookingFlowLocale,
  locationMode,
  shopDetail,
  sale,
}: {
  businessSlug: string;
  bookingFlowLocale: PublicBookingFlowLocale;
  locationMode: ServiceLocationMode;
  shopDetail: string | null;
  sale: PublicActiveSale | null;
}) {
  const ui = publicBookingUi(bookingFlowLocale).bookingV2;
  const router = useRouter();
  const [cart, setCart] = useState<BookingV2Cart | null>(null);

  useEffect(() => {
    if (locationMode !== 'both') {
      router.replace(
        getBusinessBookV2TimeUrl(businessSlug, { lang: bookingFlowLocale })
      );
      return;
    }
    const next = readBookingV2Cart(businessSlug);
    if (next.items.length === 0) {
      router.replace(
        getBusinessBookV2CartUrl(businessSlug, { lang: bookingFlowLocale })
      );
      return;
    }
    setCart(next);
  }, [businessSlug, bookingFlowLocale, locationMode, router]);

  if (!cart) return <BookFlowLoadingState />;

  const totals = cartVisitTotals(cart.items);
  const savings = totals.originalCents - totals.dueCents;
  const offLabel =
    savings > 0
      ? sale?.discountType === 'percentage'
        ? ui.percentOffApplied(sale.discountValue)
        : ui.amountOffApplied(formatCartDollars(savings))
      : null;
  const choose = (serviceLocation: BookingV2ServiceLocation) => {
    setCart(saveBookingV2ServiceLocation(businessSlug, serviceLocation));
  };

  return (
    <div
      className={`${bookingV2ColumnClass} flex min-h-screen flex-col bg-[#0F0F0F] text-white`}
    >
      <ServiceSetupHeader
        businessSlug={businessSlug}
        bookingFlowLocale={bookingFlowLocale}
        backHref={getBusinessBookV2CartUrl(businessSlug, {
          lang: bookingFlowLocale,
        })}
        backLabel={ui.back}
        step={1}
        stepTitle={ui.servicesStep}
      />
      <main className="flex flex-1 flex-col px-5 pb-36 pt-7">
        <h1 className="text-[26px] font-bold leading-[1.15] tracking-[-0.6px]">
          {ui.whereShouldWeDoIt}
        </h1>
        <div className="mt-6">
          <BookingCartLocationChoice
            value={cart.serviceLocation}
            shopDetail={shopDetail}
            bookingFlowLocale={bookingFlowLocale}
            onChange={choose}
          />
        </div>
      </main>
      <BookingCartFooter
        dueCents={totals.dueCents}
        durationMinutes={totals.durationMinutes}
        offLabel={offLabel}
        canContinue={cart.serviceLocation != null}
        actionLabel={ui.continue}
        onPickTime={() =>
          router.push(
            getBusinessBookV2TimeUrl(businessSlug, { lang: bookingFlowLocale })
          )
        }
        bookingFlowLocale={bookingFlowLocale}
      />
    </div>
  );
}
