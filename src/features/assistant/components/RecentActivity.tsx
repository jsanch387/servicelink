'use client';

import React from 'react';

import type { ActivityEntry } from '../types';

const PREVIEW_LIMIT = 5;

export function RecentActivity({
  entries,
  onViewAll,
}: {
  entries: readonly ActivityEntry[];
  onViewAll: () => void;
}) {
  const rows = entries.slice(0, PREVIEW_LIMIT);

  return (
    <section className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.03]">
      <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.06] px-4 pt-4 pb-3 sm:px-5">
        <h3 className="text-sm font-semibold tracking-tight text-white sm:text-base">
          Activity
        </h3>
        <button
          type="button"
          onClick={onViewAll}
          className="cursor-pointer text-sm text-white/55 transition-colors hover:text-white"
        >
          View all
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-4 text-sm text-white/55 sm:px-5">
          When you send a follow-up, it shows up here.
        </p>
      ) : (
        <ul>
          {rows.map((row, index) => (
            <li
              key={row.id}
              className={`flex items-baseline gap-3 px-4 py-3 sm:px-5 ${
                index > 0 ? 'border-t border-white/[0.06]' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white">{row.label}</p>
                {row.customerName ? (
                  <p className="mt-0.5 truncate text-sm text-white/55">
                    {row.customerName}
                  </p>
                ) : null}
              </div>
              <p className="shrink-0 text-xs text-white/40 tabular-nums">
                {row.time}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
