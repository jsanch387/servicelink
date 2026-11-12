'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import {
  BuildingStorefrontIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import React from 'react';
import type { BookingV2ServiceLocation } from '../types';

export function BookingCartLocationChoice({
  value,
  shopDetail,
  bookingFlowLocale,
  onChange,
}: {
  value: BookingV2ServiceLocation | null;
  shopDetail: string | null;
  bookingFlowLocale: PublicBookingFlowLocale;
  onChange: (next: BookingV2ServiceLocation) => void;
}) {
  const ui = publicBookingUi(bookingFlowLocale).bookingV2;

  return (
    <div className="flex flex-col gap-3">
      <LocationCard
        selected={value === 'mobile'}
        icon={<MapPinIcon className="h-5 w-5" aria-hidden />}
        title={ui.weComeToYou}
        detail={ui.atYourHomeOrWork}
        onClick={() => onChange('mobile')}
      />
      <LocationCard
        selected={value === 'shop'}
        icon={<BuildingStorefrontIcon className="h-5 w-5" aria-hidden />}
        title={ui.atOurShop}
        detail={shopDetail}
        onClick={() => onChange('shop')}
      />
    </div>
  );
}

function LocationCard({
  selected,
  icon,
  title,
  detail,
  onClick,
}: {
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  detail: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex h-full cursor-pointer flex-col items-start rounded-2xl border-2 px-3.5 py-3.5 text-left ${
        selected
          ? 'border-white bg-[#202020]'
          : 'border-[#262626] bg-[#181818] hover:bg-[#202020]'
      }`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2A2A2A] text-white">
        {icon}
      </span>
      <span className="mt-3 text-[15px] font-semibold leading-5 text-white">
        {title}
      </span>
      {detail ? (
        <span className="mt-0.5 text-[13px] font-normal leading-[1.35] text-[#A3A3A3]">
          {detail}
        </span>
      ) : null}
    </button>
  );
}
