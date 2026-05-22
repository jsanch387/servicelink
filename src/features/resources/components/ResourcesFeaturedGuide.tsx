import {
  ArrowRightIcon,
  BookOpenIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { ROUTES } from '@/constants/routes';
import type { GuideMeta } from '../data/guides';
import Link from 'next/link';

function getGuideYearBadge(guide: GuideMeta): string | null {
  const fromTitle = guide.title.match(/\((\d{4})\s*Guide\)/i)?.[1];
  if (fromTitle) return fromTitle;
  if (guide.datePublished) return guide.datePublished.slice(0, 4);
  return null;
}

export function ResourcesFeaturedGuide({ guide }: { guide: GuideMeta }) {
  const href = ROUTES.RESOURCE_GUIDE(guide.slug);
  const year = getGuideYearBadge(guide);

  return (
    <section className="mb-12 sm:mb-16" aria-labelledby="guides-heading">
      <h2
        id="guides-heading"
        className="text-xl sm:text-2xl font-bold text-white mb-6 tracking-tight"
      >
        Latest guide
      </h2>

      <Link
        href={href}
        className="group block relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-[#141414] transition-all hover:border-white/30"
      >
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_1.4fr]">
          <div className="relative flex flex-col justify-between gap-6 p-6 sm:p-8 md:min-h-[220px] border-b md:border-b-0 md:border-r border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%)',
              }}
              aria-hidden
            />
            <div className="relative">
              {year ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-neutral-900 mb-4">
                  <CalendarDaysIcon className="h-3.5 w-3.5" aria-hidden />
                  {year} Guide
                </span>
              ) : null}
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/5">
                <BookOpenIcon
                  className="h-6 w-6 text-white/80"
                  strokeWidth={1.5}
                />
              </div>
            </div>
            <p className="relative text-xs font-medium text-gray-500">
              Long-form playbook
            </p>
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10">
            <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug mb-3 group-hover:text-white/95">
              {guide.title}
            </h3>
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed mb-6">
              {guide.subheading}
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              Read the full guide
              <ArrowRightIcon
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}
