'use client';

import { getBusinessBookV2SetupUrl } from '@/constants/routes';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import Link from 'next/link';
import React from 'react';
import type { BookingV2CartItem } from '../types';
import { bookingV2ItemDetail } from '../utils/bookingV2ItemDetail';
import { formatCartDollars } from '../utils/formatCartMoney';

export function BookingCartItemCard({
  item,
  editIndex,
  businessSlug,
  bookingFlowLocale,
  onRemove,
}: {
  item: BookingV2CartItem;
  editIndex: number;
  businessSlug: string;
  bookingFlowLocale: PublicBookingFlowLocale;
  onRemove: () => void;
}) {
  const ui = publicBookingUi(bookingFlowLocale).bookingV2;
  const detail = bookingV2ItemDetail(item);
  const addOnTotal = item.addOns.reduce(
    (sum, addOn) => sum + addOn.priceCents,
    0
  );
  const hasAddOns = item.addOns.length > 0;
  const serviceCents = hasAddOns
    ? Math.max(0, item.originalCents - addOnTotal)
    : item.dueCents;
  const struckCents =
    !hasAddOns && item.originalCents > item.dueCents
      ? item.originalCents
      : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-[#262626] bg-[#181818]">
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[16px] font-semibold leading-5 text-white">
              {item.serviceName}
            </p>
            {detail ? (
              <p className="mt-1 text-[14px] font-normal leading-5 text-[#A3A3A3]">
                {detail}
              </p>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[16px] font-semibold leading-5 tabular-nums text-white">
              {formatCartDollars(serviceCents)}
            </p>
            {struckCents != null ? (
              <p className="mt-1 text-[13px] font-normal leading-5 tabular-nums text-[#8F8F8F] line-through">
                {formatCartDollars(struckCents)}
              </p>
            ) : null}
          </div>
        </div>
        {item.addOns.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {item.addOns.map(addOn => (
              <li
                key={addOn.id}
                className="flex items-start justify-between gap-3 text-[15px] leading-5 text-white"
              >
                <span className="min-w-0">{addOn.name}</span>
                <span className="shrink-0 tabular-nums">
                  {formatCartDollars(addOn.priceCents)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="grid grid-cols-2 border-t border-[#262626]">
        <Link
          href={getBusinessBookV2SetupUrl(businessSlug, {
            serviceId: item.serviceId,
            lang: bookingFlowLocale,
            editIndex,
          })}
          className="inline-flex h-12 cursor-pointer items-center justify-center border-r border-[#262626] text-[15px] font-semibold text-white hover:bg-[#202020]"
        >
          {ui.edit}
        </Link>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-12 cursor-pointer items-center justify-center text-[15px] font-semibold text-[#FF5A5A] hover:bg-[#202020]"
        >
          {ui.remove}
        </button>
      </div>
    </article>
  );
}
