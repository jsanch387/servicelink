import { ROUTES } from '@/constants/routes';
import { siteSignupPath } from '@/features/marketing-attribution';
import React from 'react';
import { HeroCtaButton } from './HeroCtaButton';

type LandingSignupCtaProps = {
  label?: string;
  line?: string;
  showPricing?: boolean;
};

export function LandingSignupCta({
  label = 'Start free',
  line,
  showPricing = false,
}: LandingSignupCtaProps) {
  return (
    <div className="flex flex-col items-center text-center">
      {line ? (
        <p className="mb-5 max-w-md text-base text-zinc-400 sm:text-lg">
          {line}
        </p>
      ) : null}
      <div className="flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
        <HeroCtaButton href={siteSignupPath('homepage')}>{label}</HeroCtaButton>
        {showPricing ? (
          <HeroCtaButton href={ROUTES.PRICING_PAGE} variant="ghost">
            View pricing
          </HeroCtaButton>
        ) : null}
      </div>
    </div>
  );
}
