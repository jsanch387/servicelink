'use client';

import { Button, Input, Modal, TimeSelect } from '@/components/shared';
import React, { useEffect, useMemo, useState } from 'react';
import type { BlockTimeEntry } from '../types/blockTime';
import { compareTime } from '../utils/timeOptions';

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Next 30-min slot after `start`; capped at 22:00 (matches working-hours range). */
function defaultEndAfterStart(start: string): string {
  const [hs = '09', ms = '00'] = start.split(':');
  let h = parseInt(hs, 10) || 9;
  let m = ms === '30' ? 30 : 0;
  m += 30;
  if (m >= 60) {
    h += 1;
    m = 0;
  }
  if (h > 22 || (h === 22 && m > 0)) return '22:00';
  return `${String(h).padStart(2, '0')}:${m === 0 ? '00' : '30'}`;
}

interface AddBlockTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line no-unused-vars
  onAdd: (entry: Omit<BlockTimeEntry, 'id'>) => void;
  disabled?: boolean;
}

export const AddBlockTimeModal: React.FC<AddBlockTimeModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  disabled = false,
}) => {
  const [date, setDate] = useState(todayIsoDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setDate(todayIsoDate());
    setStartTime('09:00');
    setEndTime('12:00');
    setTitle('');
  }, [isOpen]);

  const timeError = useMemo(() => {
    if (compareTime(endTime, startTime) <= 0) {
      return 'End must be after start.';
    }
    return null;
  }, [startTime, endTime]);

  const canSubmit =
    Boolean(date) &&
    !timeError &&
    !disabled &&
    compareTime(endTime, startTime) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onAdd({
      date,
      startTime,
      endTime,
      title: title.trim(),
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add time off" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-5 min-w-0 max-w-full">
        <div className="w-full min-w-0 max-w-full">
          <label
            htmlFor="block-time-date"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Date
          </label>
          {/*
            Native date inputs have a wide intrinsic min-width on WebKit; border + clip on
            the wrapper keeps the control aligned with TimeSelect / Input (same h-12 row).
          */}
          <div
            className={`
              flex h-12 w-full min-w-0 max-w-full items-center overflow-hidden rounded-xl
              border border-white/10 bg-white/5 px-4
              [color-scheme:dark]
              transition-all duration-150
              focus-within:border-white/30 focus-within:ring-2 focus-within:ring-white/20
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              id="block-time-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              disabled={disabled}
              className="
                min-h-0 min-w-0 flex-1 cursor-pointer border-0 bg-transparent py-0
                text-base font-medium text-white shadow-none outline-none ring-0
                focus:outline-none focus:ring-0
                disabled:cursor-not-allowed
                [&::-webkit-calendar-picker-indicator]:ml-1 [&::-webkit-calendar-picker-indicator]:shrink-0
                [&::-webkit-datetime-edit-fields-wrapper]:min-w-0 [&::-webkit-datetime-edit-fields-wrapper]:p-0
              "
            />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="min-w-0">
            <span className="block text-sm font-medium text-gray-300 mb-2">
              Start
            </span>
            <TimeSelect
              value={startTime}
              onChange={next => {
                setStartTime(next);
                setEndTime(prev =>
                  compareTime(prev, next) <= 0
                    ? defaultEndAfterStart(next)
                    : prev
                );
              }}
              disabled={disabled}
              aria-label="Start time"
            />
          </div>
          <div className="min-w-0">
            <span className="block text-sm font-medium text-gray-300 mb-2">
              End
            </span>
            <TimeSelect
              value={endTime}
              onChange={setEndTime}
              minTime={startTime}
              disabled={disabled}
              aria-label="End time"
            />
          </div>
        </div>

        {timeError && (
          <p className="text-sm text-amber-200/90" role="alert">
            {timeError}
          </p>
        )}

        <Input
          className="min-w-0 max-w-full"
          label="Note (optional)"
          placeholder="Appointment, travel, etc."
          value={title}
          onChange={setTitle}
          disabled={disabled}
          autoComplete="off"
          maxLength={500}
          inputClassName="min-h-[48px] h-12 min-w-0 max-w-full rounded-xl py-3 px-4 text-base sm:text-base"
        />

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={disabled}
            fullWidth
            className="sm:w-auto sm:min-w-[100px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="inverse"
            disabled={!canSubmit}
            fullWidth
            className="sm:w-auto sm:min-w-[160px] font-semibold"
          >
            Add
          </Button>
        </div>
      </form>
    </Modal>
  );
};
