import { ROUTES } from '@/constants/routes';
import { HeroCtaButton } from '@/features/landing-page/components/HeroCtaButton';
import { siteSignupPath } from '@/features/marketing-attribution';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { IndustryLandingContent } from '../types';

export function IndustryFaqCta({
  content,
}: {
  content: IndustryLandingContent;
}) {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24 md:py-28">
      <div className="mx-auto max-w-3xl">
        <header className="mb-12 text-center sm:mb-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            FAQ
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Common questions
          </h2>
        </header>
        <div className="space-y-2">
          {content.faqs.map(faq => (
            <details
              key={faq.question}
              className="group overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] open:bg-white/[0.03]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left marker:content-none hover:bg-white/[0.03] sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
                <span className="pr-2 text-sm font-medium text-white sm:text-base">
                  {faq.question}
                </span>
                <ChevronDownIcon
                  className="h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="px-5 pb-4 text-sm leading-relaxed text-zinc-400 sm:px-6 sm:pb-5">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
        <p className="mt-5 text-center text-sm text-zinc-500">
          <Link
            href={ROUTES.FAQ}
            className="cursor-pointer underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            More questions
          </Link>
        </p>

        <div className="mt-20 border-t border-white/[0.08] pt-16 text-center sm:mt-24 sm:pt-20">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {content.cta.heading}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-zinc-400">
            {content.cta.line}
          </p>
          <div className="mt-8 flex justify-center">
            <HeroCtaButton href={siteSignupPath('auto-detailing', 'footer')}>
              Start free
            </HeroCtaButton>
          </div>
        </div>
      </div>
    </section>
  );
}
