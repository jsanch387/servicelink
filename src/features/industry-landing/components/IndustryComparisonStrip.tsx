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
    <section className="px-4 py-14 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {comparison.heading}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-zinc-400">
          {comparison.sub}
        </p>
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
          <div className="grid grid-cols-[1fr_5.5rem_6.5rem] bg-white/[0.04] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 sm:grid-cols-[1fr_7rem_8rem] sm:px-5">
            <span>Job</span>
            <span className="text-white">ServiceLink</span>
            <span>Generic tools</span>
          </div>
          {comparison.rows.map((row, index) => (
            <div
              key={row.feature}
              className={`grid grid-cols-[1fr_5.5rem_6.5rem] items-center px-4 py-3 text-sm sm:grid-cols-[1fr_7rem_8rem] sm:px-5 ${
                index % 2 ? 'bg-white/[0.02]' : ''
              } border-t border-white/10`}
            >
              <span className="text-zinc-200">{row.feature}</span>
              <CheckMark on={row.servicelink} />
              <CheckMark on={row.generic} />
            </div>
          ))}
        </div>
        <p className="mt-6 flex flex-col gap-2 text-center text-sm text-zinc-500 sm:flex-row sm:justify-center sm:gap-5">
          {comparison.links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="cursor-pointer text-zinc-300 underline-offset-2 hover:text-white hover:underline"
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
