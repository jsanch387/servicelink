'use client';

import { Button } from '@/components/shared';
import {
  CalendarDaysIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import React, { useCallback, useMemo, useState } from 'react';
import type { BlockTimeEntry } from '../types/blockTime';
import { formatTimeOffDateRange } from '../utils/formatTimeOffDateRange';
import { AddBlockTimeModal } from './AddBlockTimeModal';

function formatCompactTime(hhmm: string): string {
  const [hStr = '0', mStr = '00'] = hhmm.split(':');
  const hour24 = parseInt(hStr, 10) || 0;
  const minute = parseInt(mStr, 10) || 0;
  const hour12 = hour24 % 12 || 12;
  const ampm = hour24 < 12 ? 'AM' : 'PM';
  if (minute === 0) return `${hour12}${ampm}`;
  return `${hour12}:${String(minute).padStart(2, '0')}${ampm}`;
}

function formatRangeLabel(entry: BlockTimeEntry): string {
  return formatTimeOffDateRange(entry.startDate, entry.endDate);
}

function formatMeta(entry: BlockTimeEntry): string {
  if (entry.allDay) return 'All day';
  return `${formatCompactTime(entry.startTime)} – ${formatCompactTime(entry.endTime)}`;
}

function dateTileParts(iso: string): { month: string; day: string } {
  const [y, mo, d] = iso.split('-').map(Number);
  if (!y || !mo || !d) return { month: '—', day: '—' };
  const date = new Date(y, mo - 1, d);
  return {
    month: date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
    day: String(d),
  };
}

interface BlockTimeSectionProps {
  entries: BlockTimeEntry[];
  onEntriesChange: (entries: BlockTimeEntry[]) => void;
  disabled?: boolean;
}

export const BlockTimeSection: React.FC<BlockTimeSectionProps> = ({
  entries,
  onEntriesChange,
  disabled = false,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort((a, b) => {
        const dc = a.startDate.localeCompare(b.startDate);
        if (dc !== 0) return dc;
        const ec = a.endDate.localeCompare(b.endDate);
        if (ec !== 0) return ec;
        return a.startTime.localeCompare(b.startTime);
      }),
    [entries]
  );

  const handleAdd = useCallback(
    (row: Omit<BlockTimeEntry, 'id'>) => {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `block-${Date.now()}`;
      onEntriesChange([...entries, { ...row, id }]);
    },
    [entries, onEntriesChange]
  );

  const handleRemove = useCallback(
    (entry: BlockTimeEntry) => {
      const label = entry.title.trim() || formatRangeLabel(entry);
      const ok =
        typeof window !== 'undefined'
          ? window.confirm(`Remove time off “${label}”?`)
          : true;
      if (!ok) return;
      onEntriesChange(entries.filter(e => e.id !== entry.id));
    },
    [entries, onEntriesChange]
  );

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <section
          className={`p-4 sm:p-6${sortedEntries.length > 0 ? ' border-b border-white/10' : ''}`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDaysIcon
                  className="h-5 w-5 text-gray-400 shrink-0"
                  aria-hidden
                />
                <h2 className="font-semibold text-lg text-white">Time off</h2>
              </div>
              <p className="text-sm text-gray-400">
                Block days or times when you can&apos;t take bookings.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(true)}
              disabled={disabled}
              className="shrink-0 w-full sm:w-auto"
              icon={<PlusIcon className="h-4 w-4" aria-hidden />}
            >
              Add
            </Button>
          </div>
        </section>

        {sortedEntries.length > 0 && (
          <section className="px-4 py-2 sm:px-6 sm:py-3">
            <ul className="divide-y divide-white/10 -mx-4 sm:-mx-6">
              {sortedEntries.map(entry => {
                const tile = dateTileParts(entry.startDate);
                return (
                  <li
                    key={entry.id}
                    className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-3.5"
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]"
                      aria-hidden
                    >
                      <span className="text-[10px] font-semibold tracking-wide text-gray-400 leading-none">
                        {tile.month}
                      </span>
                      <span className="mt-0.5 text-base font-semibold text-white leading-none tabular-nums">
                        {tile.day}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {entry.title.trim() || formatRangeLabel(entry)}
                      </p>
                      <p className="text-sm text-gray-400 mt-0.5 truncate">
                        {entry.title.trim()
                          ? formatRangeLabel(entry)
                          : formatMeta(entry)}
                        {entry.title.trim() ? (
                          <span className="text-gray-500">
                            {' '}
                            · {formatMeta(entry)}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(entry)}
                      disabled={disabled}
                      className="p-2 rounded-lg text-gray-500 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                      aria-label={`Remove time off starting ${entry.startDate}`}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>

      <AddBlockTimeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAdd}
        disabled={disabled}
      />
    </>
  );
};
