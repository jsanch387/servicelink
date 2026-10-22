import { StatusPill, type StatusPillTone } from '@/components/shared';
import { StarIcon, UserIcon } from '@heroicons/react/24/outline';
import React from 'react';

import type { ActivityEntry } from '../types';

function rowStatus(entry: ActivityEntry): {
  status: string;
  tone: StatusPillTone;
} {
  if (entry.label.endsWith('sent')) {
    return { status: 'Sent', tone: 'success' };
  }
  if (entry.label.endsWith('skipped')) {
    return { status: 'Skipped', tone: 'warning' };
  }
  if (entry.label.endsWith('restored')) {
    return { status: 'Restored', tone: 'neutral' };
  }
  return { status: 'Done', tone: 'info' };
}

function RowIcon({ topic }: { topic: ActivityEntry['topic'] }) {
  const Icon = topic === 'review' ? StarIcon : UserIcon;

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-200">
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  );
}

export function RecentActivity({
  entries,
  onViewAll,
}: {
  entries: readonly ActivityEntry[];
  onViewAll: () => void;
}) {
  const rows = entries.slice(0, 4);

  return (
    <section className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] px-4 py-4">
      <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.06] pb-4">
        <h3 className="text-base font-semibold tracking-tight text-white">
          Recent activity
        </h3>
        <button
          type="button"
          onClick={onViewAll}
          className="cursor-pointer text-sm text-white/60 transition-colors hover:text-white"
        >
          View all
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="pt-4 text-sm text-white/60">
          When you skip or send, it shows up here.
        </p>
      ) : (
        <ul className="mt-3">
          {rows.map(row => {
            const status = rowStatus(row);
            return (
              <li
                key={row.id}
                className="flex items-center gap-4 border-t border-white/[0.06] py-4 first:border-t-0 last:pb-0"
              >
                <RowIcon topic={row.topic} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {row.label}
                  </p>
                  <p className="mt-0.5 text-sm text-white/60">{row.detail}</p>
                </div>
                <p className="w-28 shrink-0 text-right text-sm text-white/60">
                  {row.time}
                </p>
                <span className="flex w-24 shrink-0 justify-end">
                  <StatusPill tone={status.tone}>{status.status}</StatusPill>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
