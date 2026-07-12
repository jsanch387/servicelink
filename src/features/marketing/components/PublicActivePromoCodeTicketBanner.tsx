'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import type { PublicActivePromoCode } from '../types/publicActivePromoCode';
import { getPublicSaleBannerTiming } from '../utils/formatPublicSaleBannerDates';
import { formatPublicSaleDiscountHighlight } from '../utils/formatPublicSaleDiscountHighlight';
import {
  MARKETING_TICKET_BODY_CLASS,
  MARKETING_TICKET_STUB_CLASS,
  MarketingTicketShell,
} from './MarketingTicketShell';
import { PromoCodeCopyButton } from './PromoCodeCopyButton';
import { TruncatedSaleName } from './TruncatedSaleName';

interface PublicActivePromoCodeTicketBannerProps {
  promo: PublicActivePromoCode;
  bookingFlowLocale?: PublicBookingFlowLocale;
  className?: string;
}

export const PublicActivePromoCodeTicketBanner: React.FC<
  PublicActivePromoCodeTicketBannerProps
> = ({ promo, bookingFlowLocale = 'en', className = '' }) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const highlight = formatPublicSaleDiscountHighlight(
    promo.discountType,
    promo.discountValue
  );
  const timing = getPublicSaleBannerTiming(
    promo.startsAt,
    promo.endsAt,
    bookingFlowLocale,
    ui.profile.saleBannerDates
  );

  if (!highlight) return null;

  const ariaDiscount = `${highlight.main} ${ui.profile.saleBannerOffLabel}`;

  return (
    <div
      className={className}
      role="status"
      aria-label={ui.profile.promoBannerAriaLabel(promo.code, ariaDiscount)}
    >
      <MarketingTicketShell>
        <div className="flex flex-row items-stretch">
          <div className={MARKETING_TICKET_BODY_CLASS}>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 sm:text-[11px] sm:tracking-[0.16em]">
              {ui.profile.promoBannerBadge}
            </p>
            <div className="mt-1 flex min-w-0 items-center gap-2 sm:mt-1.5">
              <TruncatedSaleName
                name={promo.code}
                className="font-mono text-sm font-semibold leading-tight text-zinc-800 sm:text-lg"
              />
              <PromoCodeCopyButton
                code={promo.code}
                variant="ticket"
                copyLabel={ui.profile.promoBannerCopyCode}
                copiedLabel={ui.profile.promoBannerCopied}
              />
            </div>
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
              {ui.profile.promoBannerWhenYouBook(promo.code, ariaDiscount)}
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
