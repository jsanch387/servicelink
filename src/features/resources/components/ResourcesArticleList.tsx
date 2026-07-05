import { GlassCard } from '@/components/shared';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { ROUTES } from '@/constants/routes';
import Link from 'next/link';

import { GUIDES, type GuideMeta } from '../data/guides';

function formatGuideDate(datePublished?: string): string | null {
  if (!datePublished) return null;

  return new Date(datePublished).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function sortGuidesNewestFirst(guides: GuideMeta[]): GuideMeta[] {
  return [...guides].sort((a, b) => {
    const aTime = a.datePublished ? Date.parse(a.datePublished) : 0;
    const bTime = b.datePublished ? Date.parse(b.datePublished) : 0;
    return bTime - aTime;
  });
}

export function ResourcesArticleList() {
  const guides = sortGuidesNewestFirst(GUIDES);

  return (
    <section aria-labelledby="articles-heading">
      <h2
        id="articles-heading"
        className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4"
      >
        All guides
      </h2>

      <ul className="flex flex-col gap-4">
        {guides.map(guide => {
          const href = ROUTES.RESOURCE_GUIDE(guide.slug);
          const dateLabel = formatGuideDate(guide.datePublished);

          return (
            <li key={guide.slug}>
              <article>
                <Link href={href} className="group block">
                  <GlassCard
                    padding="lg"
                    rounded="rounded-2xl"
                    className="transition-colors group-hover:border-white/20"
                  >
                    <div className="flex items-start justify-between gap-4 sm:gap-6">
                      <div className="min-w-0 flex-1">
                        {dateLabel ? (
                          <time
                            dateTime={guide.datePublished}
                            className="block text-xs font-medium text-gray-500 mb-2"
                          >
                            {dateLabel}
                          </time>
                        ) : null}
                        <h3 className="text-lg sm:text-xl font-semibold text-white leading-snug group-hover:text-white/90">
                          {guide.title}
                        </h3>
                        <p className="mt-2 text-sm sm:text-base text-gray-400 leading-relaxed line-clamp-2">
                          {guide.subheading}
                        </p>
                      </div>
                      <ArrowRightIcon
                        className="h-5 w-5 shrink-0 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-white mt-1"
                        aria-hidden
                      />
                    </div>
                  </GlassCard>
                </Link>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
