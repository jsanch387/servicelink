import { ROUTES } from '@/constants/routes';
import { HeroCtaButton } from '@/features/landing-page/components/HeroCtaButton';
import { siteSignupPath } from '@/features/marketing-attribution';
import Link from 'next/link';
import type { IndustryLandingContent } from '../types';

export function IndustryFaqCta({
  content,
}: {
  content: IndustryLandingContent;
}) {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-2xl font-bold tracking-tight text-white">
          FAQ
        </h2>
        <div className="mt-8 space-y-2">
          {content.faqs.map(faq => (
            <details
              key={faq.question}
              className="group overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] open:bg-white/[0.03]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left marker:content-none hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
                <span className="pr-2 text-sm font-medium text-white sm:text-base">
                  {faq.question}
                </span>
                <span
                  className="shrink-0 text-gray-500 transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-400">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href={ROUTES.FAQ} className="cursor-pointer hover:text-white">
            More questions
          </Link>
        </p>

        <div className="mt-14 border-t border-white/[0.08] pt-12 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {content.cta.heading}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-zinc-400">
            {content.cta.line}
          </p>
          <div className="mt-7 flex justify-center">
            <HeroCtaButton href={siteSignupPath('auto-detailing', 'footer')}>
              Start free
            </HeroCtaButton>
          </div>
        </div>
      </div>
    </section>
  );
}
