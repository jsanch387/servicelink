import { HeroCtaButton } from '@/features/landing-page/components/HeroCtaButton';
import { ROUTES } from '@/constants/routes';
import Link from 'next/link';

export function ResourcesBottomCta() {
  return (
    <section
      className="relative mt-8 sm:mt-12 overflow-hidden border-t border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-white/[0.02]"
      aria-labelledby="resources-cta-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0.08), transparent 55%)',
        }}
        aria-hidden
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16 md:py-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-3">
          Start free
        </p>
        <h2
          id="resources-cta-heading"
          className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold text-white tracking-tight leading-[1.1] max-w-xl mx-auto"
        >
          One link. Customers book. You detail.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-gray-400 leading-relaxed max-w-lg mx-auto">
          Stop answering the same DMs. Put your ServiceLink in your bio and let
          people book while you’re on a job.
        </p>

        <div className="mt-8 sm:mt-10 flex flex-col items-center gap-4">
          <HeroCtaButton href={ROUTES.AUTH.SIGNUP}>
            Create your booking link
          </HeroCtaButton>
          <Link
            href={ROUTES.FEATURES_PAGE}
            className="cursor-pointer text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            See what’s included →
          </Link>
        </div>
      </div>
    </section>
  );
}
