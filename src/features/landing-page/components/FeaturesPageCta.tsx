import { FramedCtaButton } from '@/components/shared';
import { siteSignupPath } from '@/features/marketing-attribution';

export function FeaturesPageCta() {
  return (
    <section
      className="mt-12 sm:mt-16 flex justify-center"
      aria-label="Get started with ServiceLink"
    >
      <FramedCtaButton href={siteSignupPath('features')}>
        Get Started
      </FramedCtaButton>
    </section>
  );
}
