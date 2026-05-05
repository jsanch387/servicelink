'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import {
  getPublicBusinessProfilePath,
  PUBLIC_BOOKING_FLOW_LOCALE_SHORT_LABEL,
  PUBLIC_BOOKING_FLOW_LOCALES,
} from '@/constants/routes';
import { writeBookingFlowLocaleCookie } from '@/libs/bookingFlowLocale';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

/** @deprecated use PublicBookingFlowLocale from @/constants/routes */
export type PublicBookingLocale = PublicBookingFlowLocale;

function localeLabel(loc: PublicBookingFlowLocale): string {
  return PUBLIC_BOOKING_FLOW_LOCALE_SHORT_LABEL[loc];
}

export interface PublicBookingLanguageToggleProps {
  offeredLocales?: PublicBookingFlowLocale[];
  className?: string;
  /** From server: `?lang=` then cookie, default `en`. */
  initialLocale: PublicBookingFlowLocale;
  /** Public profile slug (path segment) for syncing `?lang=` on the landing URL. */
  publicProfileSlug: string;
}

const DEFAULT_OFFERED: PublicBookingFlowLocale[] = [
  ...PUBLIC_BOOKING_FLOW_LOCALES,
];

/** EN/ES control on the public business profile (`/{slug}`). Persists cookie + URL for the booking funnel. */
export function PublicBookingLanguageToggle({
  offeredLocales = DEFAULT_OFFERED,
  className = '',
  initialLocale,
  publicProfileSlug,
}: PublicBookingLanguageToggleProps) {
  const router = useRouter();
  const [active, setActive] = useState<PublicBookingFlowLocale>(initialLocale);

  useEffect(() => {
    setActive(initialLocale);
  }, [initialLocale]);

  const onPick = useCallback(
    (loc: PublicBookingFlowLocale) => {
      setActive(loc);
      writeBookingFlowLocaleCookie(loc);
      const path = getPublicBusinessProfilePath(publicProfileSlug, {
        lang: loc === 'es' ? 'es' : null,
      });
      router.replace(path, { scroll: false });
    },
    [publicProfileSlug, router]
  );

  if (offeredLocales.length < 2) {
    return null;
  }

  const base =
    'min-w-[2.25rem] px-2.5 py-1.5 text-xs font-semibold tracking-wide rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40';

  return (
    <div
      role="group"
      aria-label="Page language"
      className={`inline-flex items-center rounded-full border border-white/20 bg-black/50 p-0.5 shadow-lg backdrop-blur-md ${className}`}
    >
      {offeredLocales.map(loc => {
        const isOn = active === loc;
        return (
          <button
            key={loc}
            type="button"
            aria-pressed={isOn}
            onClick={() => onPick(loc)}
            className={`${base} ${
              isOn
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            {localeLabel(loc)}
          </button>
        );
      })}
    </div>
  );
}
