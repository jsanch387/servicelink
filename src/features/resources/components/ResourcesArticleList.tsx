import { ROUTES } from '@/constants/routes';
import { GlassCard } from '@/components/shared/GlassCard';
import Image from 'next/image';
import Link from 'next/link';

import { GUIDES, type GuideMeta } from '../data/guides';

function sortGuidesNewestFirst(guides: GuideMeta[]): GuideMeta[] {
  return [...guides].sort((a, b) => {
    const aTime = a.datePublished ? Date.parse(a.datePublished) : 0;
    const bTime = b.datePublished ? Date.parse(b.datePublished) : 0;
    return bTime - aTime;
  });
}

function formatGuideDate(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function ResourcesArticleList() {
  const guides = sortGuidesNewestFirst(GUIDES);

  return (
    <section aria-labelledby="articles-heading">
      <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
        <h2
          id="articles-heading"
          className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
        >
          Latest articles
        </h2>
        <p className="hidden sm:block text-sm text-gray-500 shrink-0">
          {guides.length} {guides.length === 1 ? 'guide' : 'guides'}
        </p>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {guides.map(guide => {
          const href = ROUTES.RESOURCE_GUIDE(guide.slug);
          const publishedLabel = formatGuideDate(guide.datePublished);

          return (
            <li key={guide.slug}>
              <article className="h-full">
                <Link
                  href={href}
                  className="group block h-full cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f]"
                >
                  <GlassCard
                    padding="none"
                    rounded="rounded-2xl"
                    className="flex flex-col border-white/[0.08] bg-white/[0.03] transition-[border-color,background-color,transform] duration-300 ease-out group-hover:border-white/[0.14] group-hover:bg-white/[0.045] group-hover:-translate-y-0.5"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden border-b border-white/[0.06] bg-white/[0.04]">
                      <Image
                        src={guide.coverImage}
                        alt={guide.coverImageAlt}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      />
                    </div>

                    <div className="flex flex-1 flex-col gap-2 px-4 py-4 sm:px-5 sm:py-5">
                      {publishedLabel ? (
                        <time
                          dateTime={guide.datePublished}
                          className="text-xs font-medium uppercase tracking-wide text-gray-500"
                        >
                          {publishedLabel}
                        </time>
                      ) : null}

                      <h3 className="text-base sm:text-lg font-semibold text-white leading-snug tracking-tight transition-colors group-hover:text-white/95">
                        {guide.title}
                      </h3>
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
