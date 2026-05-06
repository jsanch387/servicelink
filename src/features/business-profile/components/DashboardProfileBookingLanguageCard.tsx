'use client';

import { GlassCard } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';

const checkboxSm =
  'h-3.5 w-3.5 shrink-0 rounded border-white/20 bg-white/[0.04] text-emerald-500 focus:ring-1 focus:ring-emerald-500/30 focus:ring-offset-0 focus:ring-offset-[#0f0f0f] accent-emerald-500';

export interface DashboardProfileBookingLanguageCardProps {
  offerSpanish: boolean;
  onOfferSpanishChange: (offer: boolean) => void;
  /** Shown only when Spanish is offered. Must be `en` when Spanish is off (parent resets). */
  visitorDefaultLocale: PublicBookingFlowLocale;
  onVisitorDefaultLocaleChange: (locale: PublicBookingFlowLocale) => void;
}

/** Offered locales + visitor default when both EN and ES are offered. */
export function DashboardProfileBookingLanguageCard({
  offerSpanish,
  onOfferSpanishChange,
  visitorDefaultLocale,
  onVisitorDefaultLocaleChange,
}: DashboardProfileBookingLanguageCardProps) {
  return (
    <div className="w-full max-w-full text-left">
      <p className="mb-1.5 block text-left text-sm font-medium text-gray-200">
        Booking link languages
      </p>

      <GlassCard
        padding="sm"
        rounded="rounded-xl"
        className="w-full max-w-full"
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <label className="inline-flex cursor-default items-center gap-2">
            <input
              type="checkbox"
              checked
              disabled
              className={`${checkboxSm} cursor-not-allowed opacity-60`}
              aria-label="English always included"
            />
            <span className="text-xs text-gray-300">
              English <span className="text-zinc-600">(always on)</span>
            </span>
          </label>

          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={offerSpanish}
              onChange={e => onOfferSpanishChange(e.target.checked)}
              className={`${checkboxSm} cursor-pointer`}
              aria-label="Offer Spanish on booking link"
            />
            <span className="text-xs text-gray-300">
              Spanish <span className="text-zinc-600">(optional)</span>
            </span>
          </label>
        </div>

        {offerSpanish ? (
          <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
            <div>
              <p className="text-xs font-medium text-gray-200 leading-snug">
                Default language for your link?
              </p>
              <p className="mt-1 text-[11px] leading-snug text-zinc-500">
                Choose what languages your customers see.
              </p>
            </div>
            <div
              className="inline-flex rounded-md border border-white/10 bg-black/25 p-0.5"
              role="group"
              aria-label="Default language for your booking link"
            >
              {(['en', 'es'] as const).map(code => {
                const selected = visitorDefaultLocale === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onVisitorDefaultLocaleChange(code)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-white/25 ${
                      selected
                        ? 'bg-white/[0.15] text-gray-100'
                        : 'text-zinc-500 hover:text-zinc-400'
                    }`}
                  >
                    {code === 'en' ? 'English' : 'Spanish'}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </GlassCard>
    </div>
  );
}
