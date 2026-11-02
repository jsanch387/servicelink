'use client';

import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import React from 'react';
import {
  useDashboardSchedule,
  type DashboardScheduleVisit,
} from '../hooks/useDashboardSchedule';
import { DashboardGlassCard } from './DashboardGlassCard';

interface DashboardScheduleCardProps {
  calendarHref?: string;
}

export function DashboardScheduleCard({
  calendarHref = ROUTES.DASHBOARD.BOOKINGS,
}: DashboardScheduleCardProps) {
  const { visits, loading, error, reload } = useDashboardSchedule();

  return (
    <DashboardGlassCard className="h-full">
      <div className="flex items-center justify-between gap-3">
        <p className="text-base font-semibold text-white">Up next</p>
        <Link
          href={calendarHref}
          className="cursor-pointer text-xs font-medium text-zinc-400 hover:text-white"
        >
          Calendar
        </Link>
      </div>
      {loading ? (
        <div className="mt-5 animate-pulse space-y-3" aria-busy="true">
          <div className="h-3 w-16 rounded bg-white/10" />
          <div className="h-12 rounded-lg bg-white/[0.04]" />
          <div className="h-12 rounded-lg bg-white/[0.04]" />
        </div>
      ) : error ? (
        <div className="mt-5">
          <p className="text-sm text-zinc-400">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-3 cursor-pointer text-sm font-medium text-white hover:underline"
          >
            Try again
          </button>
        </div>
      ) : visits.length === 0 ? (
        <p className="flex min-h-28 flex-1 items-center justify-center px-4 text-center text-sm text-zinc-500">
          No appointments coming up
        </p>
      ) : (
        <div className="mt-5 space-y-5">
          {groupVisits(visits).map(group => (
            <section key={group.day}>
              <p className="text-xs font-medium text-zinc-300">{group.day}</p>
              <ul className="mt-2.5 border-t border-white/[0.06] pt-1.5">
                {group.visits.map(visit => (
                  <li key={visit.id}>
                    <VisitRow visit={visit} href={calendarHref} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </DashboardGlassCard>
  );
}

function groupVisits(visits: DashboardScheduleVisit[]) {
  const groups: { day: string; visits: DashboardScheduleVisit[] }[] = [];
  for (const visit of visits) {
    const current = groups[groups.length - 1];
    if (current?.day === visit.day) current.visits.push(visit);
    else groups.push({ day: visit.day, visits: [visit] });
  }
  return groups;
}

function VisitRow({
  visit,
  href,
}: {
  visit: DashboardScheduleVisit;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="-mx-2 flex cursor-pointer items-start gap-4 rounded-lg px-2 py-2 hover:bg-white/[0.04]"
    >
      <span className="w-[4.75rem] shrink-0 text-sm tabular-nums text-zinc-400">
        {visit.time}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-white">
          {visit.customer}
        </span>
        <span className="mt-0.5 block truncate text-xs text-zinc-500">
          {visit.service}
        </span>
      </span>
    </Link>
  );
}
