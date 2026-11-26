import { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import type { IndustryLandingContent } from '../types';

export function IndustryComparisonStrip({
  content,
}: {
  content: IndustryLandingContent;
}) {
  const { comparison } = content;
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24 md:py-28">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {comparison.heading}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-[15px] leading-relaxed text-zinc-400">
          {comparison.sub}
        </p>
        <div className="mt-10 overflow-hidden rounded-2xl border border-white/[0.08]">
          <div className="grid grid-cols-[1fr_5.5rem_6.5rem] bg-white/[0.03] px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:grid-cols-[1fr_7rem_8rem] sm:px-6">
            <span>Job</span>
            <span className="text-white">ServiceLink</span>
            <span>Generic tools</span>
          </div>
          {comparison.rows.map((row, index) => (
            <div
              key={row.feature}
              className={`grid grid-cols-[1fr_5.5rem_6.5rem] items-center px-5 py-3.5 text-sm sm:grid-cols-[1fr_7rem_8rem] sm:px-6 ${
                index % 2 ? 'bg-white/[0.015]' : ''
              } border-t border-white/[0.08]`}
            >
              <span className="text-zinc-200">{row.feature}</span>
              <CheckMark on={row.servicelink} />
              <CheckMark on={row.generic} />
            </div>
          ))}
        </div>
        <p className="mt-8 flex flex-col gap-2 text-center text-sm text-zinc-500 sm:flex-row sm:justify-center sm:gap-6">
          {comparison.links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="cursor-pointer text-zinc-300 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </p>
      </div>
    </section>
  );
}

function CheckMark({ on }: { on: boolean }) {
  return on ? (
    <CheckIcon className="h-5 w-5 text-white" aria-label="Yes" />
  ) : (
    <XMarkIcon className="h-5 w-5 text-zinc-600" aria-label="No" />
  );
}
