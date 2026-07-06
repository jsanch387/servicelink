'use client';

import { Button } from '@/components/shared';
import {
  CalendarDaysIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import React, { useCallback, useMemo, useState } from 'react';
import type { BlockTimeEntry } from '../types/blockTime';
import { AddBlockTimeModal } from './AddBlockTimeModal';

function formatTimeLabel(hhmm: string): string {
  const [h = '09', m = '00'] = hhmm.split(':');
  const hour24 = parseInt(h, 10) || 9;
  const hour12 = hour24 % 12 || 12;
  const ampm = hour24 < 12 ? 'AM' : 'PM';
  return `${hour12}${m === '30' ? ':30' : ''} ${ampm}`;
}

function formatDateHeading(iso: string): string {
  const [y, mo, d] = iso.split('-').map(Number);
  if (!y || !mo || !d) return iso;
  return new Date(y, mo - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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
        const dc = a.date.localeCompare(b.date);
        if (dc !== 0) return dc;
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
    (id: string) => {
      onEntriesChange(entries.filter(e => e.id !== id));
    },
    [entries, onEntriesChange]
  );

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <section className="p-4 sm:p-6 border-b border-white/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDaysIcon
                  className="h-5 w-5 text-gray-400 shrink-0"
                  aria-hidden
                />
                <h2 className="font-semibold text-lg text-white">Time off</h2>
              </div>
              <p className="text-sm text-gray-400">
                Block times when you can&apos;t take bookings.
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

        <section className="px-4 py-4 sm:px-6 sm:py-5">
          {sortedEntries.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6 sm:py-8">
              No time off scheduled.
            </p>
          ) : (
            <ul className="divide-y divide-white/10 -mx-4 sm:-mx-6">
              {sortedEntries.map(entry => (
                <li
                  key={entry.id}
                  className="flex items-start gap-3 px-4 sm:px-6 py-3 sm:py-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">
                      {formatDateHeading(entry.date)}
                    </p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {formatTimeLabel(entry.startTime)} –{' '}
                      {formatTimeLabel(entry.endTime)}
                      {entry.title ? (
                        <span className="text-gray-500"> · {entry.title}</span>
                      ) : null}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(entry.id)}
                    disabled={disabled}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    aria-label={`Remove time off on ${entry.date}`}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
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
