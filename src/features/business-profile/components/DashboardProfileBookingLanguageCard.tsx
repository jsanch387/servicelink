'use client';

import { GlassCard, Switch } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';

export interface DashboardProfileBookingLanguageCardProps {
  offerSpanish: boolean;
  onOfferSpanishChange: (offer: boolean) => void;
  visitorDefaultLocale: PublicBookingFlowLocale;
  onVisitorDefaultLocaleChange: (locale: PublicBookingFlowLocale) => void;
}

export function DashboardProfileBookingLanguageCard({
  offerSpanish,
  onOfferSpanishChange,
  visitorDefaultLocale,
  onVisitorDefaultLocaleChange,
}: DashboardProfileBookingLanguageCardProps) {
  return (
    <div className="w-full max-w-full text-left">
      <p className="text-sm font-medium text-gray-200">Languages</p>
      <p className="mt-1 text-xs text-zinc-500">English is always included.</p>

      <GlassCard padding="sm" rounded="rounded-xl" className="mt-2 w-full">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-gray-200">Spanish</p>
          <Switch
            checked={offerSpanish}
            onCheckedChange={onOfferSpanishChange}
            size="md"
            aria-label="Spanish on booking link"
          />
        </div>

        {offerSpanish ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
            <p className="text-sm text-gray-200">Default language</p>
            <div className="flex flex-wrap gap-2">
              {(['en', 'es'] as const).map(code => {
                const selected = visitorDefaultLocale === code;
                const label = code === 'en' ? 'English' : 'Spanish';
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onVisitorDefaultLocaleChange(code)}
                    aria-pressed={selected}
                    className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25 ${
                      selected
                        ? 'bg-white text-black'
                        : 'bg-white/[0.06] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {label}
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
