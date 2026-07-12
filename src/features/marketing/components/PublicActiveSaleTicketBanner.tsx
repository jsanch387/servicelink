'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import type { PublicActiveSale } from '../types/publicActiveSale';
import { getPublicSaleBannerTiming } from '../utils/formatPublicSaleBannerDates';
import { formatPublicSaleDiscountHighlight } from '../utils/formatPublicSaleDiscountHighlight';
import {
  MARKETING_TICKET_BODY_CLASS,
  MARKETING_TICKET_STUB_CLASS,
  MarketingTicketShell,
} from './MarketingTicketShell';
import { TruncatedSaleName } from './TruncatedSaleName';

interface PublicActiveSaleTicketBannerProps {
  sale: PublicActiveSale;
  bookingFlowLocale?: PublicBookingFlowLocale;
}

/** Coupon-style ticket banner (saved design — swap in via profile view when desired). */
export const PublicActiveSaleTicketBanner: React.FC<
  PublicActiveSaleTicketBannerProps
> = ({ sale, bookingFlowLocale = 'en' }) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const highlight = formatPublicSaleDiscountHighlight(
    sale.discountType,
    sale.discountValue
  );
  const timing = getPublicSaleBannerTiming(
    sale.startsAt,
    sale.endsAt,
    bookingFlowLocale,
    ui.profile.saleBannerDates
  );

  if (!highlight) return null;

  const ariaDiscount = `${highlight.main} ${ui.profile.saleBannerOffLabel}`;

  return (
    <div
      className="mt-4 px-4 sm:mt-6 sm:px-8"
      role="status"
      aria-label={ui.profile.saleBannerAriaLabel(sale.name, ariaDiscount)}
    >
      <MarketingTicketShell>
        <div className="flex flex-row items-stretch">
          <div className={MARKETING_TICKET_BODY_CLASS}>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 sm:text-[11px] sm:tracking-[0.16em]">
              {ui.profile.saleBannerBadge}
            </p>
            <TruncatedSaleName
              name={sale.name}
              className="mt-1 text-sm font-semibold leading-tight text-zinc-800 sm:mt-1.5 sm:text-lg"
            />
            {timing ? (
              <>
                <p className="mt-1 text-[10px] leading-tight text-zinc-500 sm:hidden">
                  {timing.prefix}
                </p>
                <p className="text-[10px] leading-tight text-zinc-500 sm:hidden">
                  {timing.dates}
                </p>
                <p className="mt-1.5 hidden text-[11px] leading-tight text-zinc-500 sm:block sm:mt-2">
                  {timing.fullLabel}
                </p>
              </>
            ) : (
              <p className="mt-1 text-[10px] leading-tight text-zinc-500 sm:mt-2 sm:text-[11px]">
                {ui.profile.saleBannerLimitedTime}
              </p>
            )}
            <p className="mt-1.5 hidden text-xs text-zinc-500 sm:block sm:mt-2">
              {ui.profile.saleBannerWhenYouBook(ariaDiscount)}
            </p>
          </div>

          <div className={MARKETING_TICKET_STUB_CLASS}>
            <div className="text-center">
              <p className="text-[1.65rem] font-black leading-none tracking-tight text-zinc-800 sm:text-[2.75rem]">
                {highlight.main}
              </p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 sm:mt-1 sm:text-xs sm:tracking-[0.2em]">
                {ui.profile.saleBannerOffLabel}
              </p>
            </div>
          </div>
        </div>
      </MarketingTicketShell>
    </div>
  );
};
