'use client';

import { ServiceDescriptionFormatted } from '@/features/business-profile/components/ServiceDescriptionFormatted';
import { useServiceDescriptionClamp } from '@/features/business-profile/hooks/useServiceDescriptionClamp';
import { flattenServiceDescriptionForCardPreview } from '@/features/business-profile/utils/serviceDescriptionDisplay';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React, { useState } from 'react';

export function ServiceSetupIntro({
  name,
  description,
  bookingFlowLocale,
}: {
  name: string;
  description: string | null;
  bookingFlowLocale: PublicBookingFlowLocale;
}) {
  const ui = publicBookingUi(bookingFlowLocale).bookingV2;
  const copy = description?.trim() ?? '';
  const preview = flattenServiceDescriptionForCardPreview(copy);
  const [expanded, setExpanded] = useState(false);
  const { ref, isTruncatable } = useServiceDescriptionClamp(preview, expanded);
  const showToggle = isTruncatable || expanded;

  return (
    <div>
      <h1 className="text-[26px] font-bold tracking-[-0.6px] text-white">
        {name}
      </h1>
      {copy ? (
        <div className="mt-1">
          {expanded ? (
            <ServiceDescriptionFormatted
              description={copy}
              className="text-[15px] font-normal leading-[1.5] text-[#A3A3A3]"
            />
          ) : (
            <p
              ref={ref}
              className="line-clamp-3 text-[15px] font-normal leading-[1.5] text-[#A3A3A3]"
            >
              {preview}
            </p>
          )}
          {showToggle ? (
            <button
              type="button"
              onClick={() => setExpanded(prev => !prev)}
              className="mt-1 cursor-pointer text-[14px] font-semibold text-white"
              aria-expanded={expanded}
            >
              {expanded ? ui.showLess : ui.readMore}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
