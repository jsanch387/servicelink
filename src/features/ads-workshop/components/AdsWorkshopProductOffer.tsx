import { AdsWorkshopSignupButton } from './AdsWorkshopSignupButton';
import {
  WORKSHOP_OFFER,
  WORKSHOP_PRODUCT_BENEFITS,
} from '../data/workshopWatchContent';

export function AdsWorkshopProductOffer() {
  return (
    <section
      aria-labelledby="workshop-offer-heading"
      className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-b from-white/[0.1] via-white/[0.04] to-transparent p-5 sm:p-7"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.14)_0%,_transparent_60%)]"
        aria-hidden
      />

      <div className="relative space-y-5">
        <header className="text-center">
          <h2
            id="workshop-offer-heading"
            className="text-xl sm:text-2xl font-bold text-white text-balance"
          >
            {WORKSHOP_OFFER.title}
          </h2>
          <p className="mt-2 text-sm sm:text-[0.9375rem] text-gray-400 leading-relaxed max-w-lg mx-auto text-pretty">
            {WORKSHOP_OFFER.description}
          </p>
        </header>

        <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {WORKSHOP_PRODUCT_BENEFITS.map(benefit => {
            const Icon = benefit.icon;
            return (
              <li
                key={benefit.id}
                className="rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 bg-white/[0.05] text-gray-200">
                  <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  {benefit.title}
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-gray-400 leading-relaxed">
                  {benefit.description}
                </p>
              </li>
            );
          })}
        </ul>

        <AdsWorkshopSignupButton
          variant="inverse"
          size="lg"
          fullWidth
          className="font-semibold"
        >
          {WORKSHOP_OFFER.primaryCta}
        </AdsWorkshopSignupButton>
      </div>
    </section>
  );
}
