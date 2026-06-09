import { FramedCtaButton } from '@/components/shared';
import { ROUTES } from '@/constants/routes';

export function FeaturesPageCta() {
  return (
    <section
      className="mt-12 sm:mt-16 flex justify-center"
      aria-label="Get started with ServiceLink"
    >
      <FramedCtaButton href={ROUTES.AUTH.SIGNUP}>Get Started</FramedCtaButton>
    </section>
  );
}
