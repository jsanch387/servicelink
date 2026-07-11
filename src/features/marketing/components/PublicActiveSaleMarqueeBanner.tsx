'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import type { PublicActiveSale } from '../types/publicActiveSale';
import { formatPublicSaleDiscountHighlight } from '../utils/formatPublicSaleDiscountHighlight';

interface PublicActiveSaleMarqueeBannerProps {
  sale: PublicActiveSale;
  bookingFlowLocale?: PublicBookingFlowLocale;
}

const MARQUEE_SEGMENT_COUNT = 6;

function MarqueeAnnouncement({
  saleName,
  discountEmphasis,
}: {
  saleName: string;
  discountEmphasis: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-black sm:gap-2.5">
      <span className="text-xs font-semibold sm:text-[13px]">{saleName}</span>
      <span className="text-black/30" aria-hidden>
        ·
      </span>
      <span className="text-base font-black uppercase tracking-[0.08em] sm:text-lg">
        {discountEmphasis}
      </span>
    </span>
  );
}

function MarqueeSegmentSeparator() {
  return (
    <span
      className="inline-flex shrink-0 items-center px-4 text-[10px] text-black/40 sm:px-5 sm:text-[10px]"
      aria-hidden
    >
      ✦
    </span>
  );
}

export const PublicActiveSaleMarqueeBanner: React.FC<
  PublicActiveSaleMarqueeBannerProps
> = ({ sale, bookingFlowLocale = 'en' }) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const highlight = formatPublicSaleDiscountHighlight(
    sale.discountType,
    sale.discountValue
  );

  if (!highlight) return null;

  const ariaDiscount = `${highlight.main} ${ui.profile.saleBannerOffLabel}`;
  const discountEmphasis =
    `${highlight.main} ${ui.profile.saleBannerOffLabel}`.toUpperCase();
  const segments = Array.from(
    { length: MARQUEE_SEGMENT_COUNT },
    (_, index) => index
  );
  const marqueeItems = [...segments, ...segments];

  return (
    <div
      className="sticky top-0 z-30 overflow-hidden border-b border-zinc-300/40 bg-zinc-50 py-3 shadow-[0_1px_0_rgba(0,0,0,0.06)] sm:zoom-[0.85] sm:py-2.5"
      role="status"
      aria-label={ui.profile.saleBannerAriaLabel(sale.name, ariaDiscount)}
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-zinc-100/80 via-zinc-50/95 to-zinc-100/80"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] animate-strip-sheen motion-reduce:hidden"
        style={{
          background:
            'linear-gradient(110deg, transparent 0%, transparent 42%, rgba(0,0,0,0.045) 50%, transparent 58%, transparent 100%)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-10 bg-gradient-to-r from-zinc-50 to-transparent sm:w-16"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-10 bg-gradient-to-l from-zinc-50 to-transparent sm:w-16"
        aria-hidden
      />

      <p className="hidden px-4 text-center text-xs font-semibold tracking-wide text-black motion-reduce:block sm:text-sm">
        <MarqueeAnnouncement
          saleName={sale.name}
          discountEmphasis={discountEmphasis}
        />
      </p>

      <div className="flex w-max items-center motion-reduce:hidden animate-marquee-premium motion-reduce:animate-none">
        {marqueeItems.map((segmentIndex, arrayIndex) => (
          <React.Fragment
            key={`${sale.name}-${discountEmphasis}-${arrayIndex}-${segmentIndex}`}
          >
            <MarqueeAnnouncement
              saleName={sale.name}
              discountEmphasis={discountEmphasis}
            />
            <MarqueeSegmentSeparator />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
