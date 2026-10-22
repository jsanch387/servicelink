import { FilterPills } from '@/components/shared';
import React from 'react';

import type { ActivityEntry, ActivityFilter } from '../types';
import { AssistantMark } from './AssistantMark';

const FILTERS: { id: ActivityFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'review', label: 'Reviews' },
  { id: 'rebook', label: 'Rebooks' },
  { id: 'outcome', label: 'Results' },
];

export function ActivityLog({
  entries,
  filter,
  onFilterChange,
}: {
  entries: readonly ActivityEntry[];
  filter: ActivityFilter;
  onFilterChange: (filter: ActivityFilter) => void;
}) {
  return (
    <section className="space-y-4">
      <FilterPills
        options={FILTERS}
        value={filter}
        onChange={onFilterChange}
        ariaLabel="Activity filters"
        size="sm"
      />
      {entries.length === 0 ? (
        <p className="py-6 text-sm text-zinc-500">
          Nothing in this view for the moment you’re on.
        </p>
      ) : (
        <ol className="mt-2 divide-y divide-white/[0.06]">
          {entries.map(entry => (
            <li key={entry.id} className="flex gap-3 py-3">
              <span className="pt-0.5">
                {entry.actor === 'Assistant' ? (
                  <AssistantMark size="sm" />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium text-white">
                    {entry.label}
                  </p>
                  <p className="shrink-0 text-xs text-zinc-500">{entry.time}</p>
                </div>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  {entry.detail}
                </p>
                <p className="mt-1 text-xs text-zinc-600">{entry.actor}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
