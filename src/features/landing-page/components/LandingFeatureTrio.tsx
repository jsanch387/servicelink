import { ROUTES } from '@/constants/routes';
import {
  CalendarDaysIcon,
  DevicePhoneMobileIcon,
  WindowIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/20/solid';
import { ArrowUpRightIcon } from '@heroicons/react/16/solid';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import {
  LANDING_FEATURE_TRIO,
  type LandingFeatureTrioCard,
} from '../data/landingFeatureTrio';

function FeatureCta({ cta }: { cta: LandingFeatureTrioCard['cta'] }) {
  const className =
    'mt-auto inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border border-white/20 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/40 hover:bg-white/[0.04]';

  if (cta.external) {
    return (
      <a
        href={cta.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {cta.label}
        <ArrowUpRightIcon className="h-3.5 w-3.5" aria-hidden />
      </a>
    );
  }

  return (
    <Link href={cta.href} className={className}>
      {cta.label}
      <ArrowUpRightIcon className="h-3.5 w-3.5" aria-hidden />
    </Link>
  );
}

function Checklist({ bullets }: { bullets: string[] }) {
  return (
    <ul className="mx-auto grid w-max grid-cols-2 gap-x-12 gap-y-2.5 text-[13px] leading-none text-zinc-300">
      {bullets.map(bullet => (
        <li key={bullet} className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckIcon className="h-3 w-3 text-emerald-400" aria-hidden />
          </span>
          <span>{bullet}</span>
        </li>
      ))}
    </ul>
  );
}

function PhoneCardBody({ card }: { card: LandingFeatureTrioCard }) {
  return (
    <div className="relative mx-auto h-[320px] w-[240px] overflow-hidden sm:h-[360px] sm:w-[260px]">
      <Image
        src={card.image ?? ''}
        alt={card.imageAlt}
        width={390}
        height={844}
        className="absolute -top-8 left-1/2 h-auto w-[124%] max-w-none -translate-x-1/2"
        sizes="320px"
      />
    </div>
  );
}

const DASHBOARD_NAV = [
  { key: 'calendar', Icon: CalendarDaysIcon },
  { key: 'window', Icon: WindowIcon },
  { key: 'phone', Icon: DevicePhoneMobileIcon },
] as const;

function DashboardPreview() {
  return (
    <div className="flex h-full w-full items-start justify-center">
      <div className="flex w-full overflow-hidden rounded-xl border border-white/10 bg-[#111113] shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
        <div
          className="flex w-8 shrink-0 flex-col items-center gap-3 border-r border-white/[0.06] py-3"
          aria-hidden
        >
          {DASHBOARD_NAV.map(({ key, Icon }) => (
            <Icon key={key} className="h-3.5 w-3.5 text-zinc-500" />
          ))}
        </div>
        <div className="min-w-0 flex-1 p-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              ['Appointments', '4'],
              ['Revenue', '$860'],
              ['Quotes', '2'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-2"
              >
                <p className="text-[10px] leading-none text-zinc-500">
                  {label}
                </p>
                <p className="mt-1.5 text-sm font-semibold leading-none text-white">
                  {value}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] font-medium leading-none text-zinc-500">
            Upcoming appointments
          </p>
          <div className="mt-2 space-y-1.5">
            {[
              ['9:00', 'Sarah M.', 'Full interior', 'Confirmed'],
              ['11:30', 'James R.', 'Ceramic boost', 'Confirmed'],
              ['2:00', 'Mike A.', 'SUV detail', 'Pending'],
            ].map(([time, name, job, status]) => (
              <div
                key={time}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-white">
                    {name}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                    {job}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] tabular-nums text-zinc-400">
                    {time}
                  </p>
                  <p
                    className={`mt-0.5 text-[10px] ${
                      status === 'Confirmed'
                        ? 'text-emerald-400'
                        : 'text-zinc-400'
                    }`}
                  >
                    {status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingFeatureTrio() {
  return (
    <section
      id={ROUTES.FEATURES.slice(1)}
      className="scroll-mt-24 px-4 py-12 sm:px-6 sm:py-14"
      aria-label="What you get"
    >
      <div className="mx-auto grid max-w-[1320px] items-stretch gap-10 lg:grid-cols-3 lg:gap-5">
        {LANDING_FEATURE_TRIO.map(card => {
          return (
            <div key={card.id} className="flex h-full flex-col">
              <article className="flex flex-1 flex-col rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5">
                <h2 className="text-2xl font-semibold leading-tight tracking-tight text-white">
                  {card.title}
                </h2>
                <p className="mt-2 text-sm leading-snug text-zinc-400">
                  {card.line}
                </p>
                <div className="mt-2 mb-4 flex flex-1 items-start justify-center">
                  {card.layout === 'dashboard' ? (
                    <div className="w-full min-h-[320px] sm:min-h-[360px] pt-8 sm:pt-10">
                      <DashboardPreview />
                    </div>
                  ) : (
                    <PhoneCardBody card={card} />
                  )}
                </div>
                <FeatureCta cta={card.cta} />
              </article>
              <div className="mt-4">
                <Checklist bullets={card.shortBullets} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
