'use client';

import {
  Button,
  Calendar,
  Input,
  Modal,
  Switch,
  TimeSelect,
} from '@/components/shared';
import React, { useEffect, useMemo, useState } from 'react';
import {
  normalizeBlockTimeEntry,
  type BlockTimeEntry,
} from '../types/blockTime';
import { formatTimeOffDateRange } from '../utils/formatTimeOffDateRange';
import { toLocalYYYYMMDD } from '../utils/minimumNotice';
import { compareTime } from '../utils/timeOptions';

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatSelectedRangeLabel(
  rangeStart: Date | null,
  rangeEnd: Date | null
): string | null {
  if (!rangeStart) return null;
  const end = rangeEnd ?? rangeStart;
  const [lo, hi] =
    rangeStart.getTime() <= end.getTime()
      ? [rangeStart, end]
      : [end, rangeStart];
  return formatTimeOffDateRange(toLocalYYYYMMDD(lo), toLocalYYYYMMDD(hi));
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
  onAdd: (entry: Omit<BlockTimeEntry, 'id'>) => void;
  disabled?: boolean;
}

export const AddBlockTimeModal: React.FC<AddBlockTimeModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  disabled = false,
}) => {
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [title, setTitle] = useState('');
  const [minDate, setMinDate] = useState(() => startOfLocalDay(new Date()));

  useEffect(() => {
    if (!isOpen) return;
    const today = startOfLocalDay(new Date());
    setMinDate(today);
    setRangeStart(today);
    setRangeEnd(null);
    setAllDay(true);
    setStartTime('09:00');
    setEndTime('17:00');
    setTitle('');
  }, [isOpen]);

  const timeError = useMemo(() => {
    if (allDay) return null;
    if (compareTime(endTime, startTime) <= 0) {
      return 'End must be after start.';
    }
    return null;
  }, [allDay, startTime, endTime]);

  const hasRange = rangeStart != null;
  const canSubmit =
    hasRange &&
    !timeError &&
    !disabled &&
    (allDay || compareTime(endTime, startTime) > 0);

  const selectedRangeLabel = formatSelectedRangeLabel(rangeStart, rangeEnd);

  const handleDayClick = (date: Date) => {
    const day = startOfLocalDay(date);
    if (day.getTime() < minDate.getTime()) return;
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(day);
      setRangeEnd(null);
      return;
    }
    if (sameLocalDay(day, rangeStart)) {
      setRangeStart(null);
      setRangeEnd(null);
      return;
    }
    if (day.getTime() < rangeStart.getTime()) {
      setRangeEnd(rangeStart);
      setRangeStart(day);
      return;
    }
    setRangeEnd(day);
  };

  const handleClearDates = () => {
    setRangeStart(null);
    setRangeEnd(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !rangeStart) return;
    const start = rangeStart;
    const end = rangeEnd ?? rangeStart;
    const [lo, hi] =
      start.getTime() <= end.getTime() ? [start, end] : [end, start];
    onAdd(
      normalizeBlockTimeEntry({
        startDate: toLocalYYYYMMDD(lo),
        endDate: toLocalYYYYMMDD(hi),
        allDay,
        startTime,
        endTime,
        title: title.trim(),
      })
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add time off"
      maxWidth="lg"
      panelClassName="h-[95dvh] max-h-[95dvh] sm:h-auto sm:max-h-[90vh]"
    >
      <form onSubmit={handleSubmit} className="space-y-6 min-w-0 max-w-full">
        {/* Dates */}
        <section className="min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-gray-400">Dates</p>
              <p
                className={`mt-0.5 text-base font-semibold tracking-tight ${
                  selectedRangeLabel ? 'text-white' : 'text-gray-500'
                }`}
              >
                {selectedRangeLabel ?? 'Select dates'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearDates}
              disabled={disabled || (!rangeStart && !rangeEnd)}
              className="shrink-0 pt-0.5 text-sm text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Clear
            </button>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:p-4">
            <Calendar
              value={null}
              onChange={handleDayClick}
              minDate={minDate}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              plain
              wide
              showYear
              weekdayFormat="short"
            />
          </div>
        </section>

        {/* Hours */}
        <section className="min-w-0 space-y-3">
          <p className="text-sm text-gray-400">Hours</p>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <Switch
              checked={allDay}
              onCheckedChange={setAllDay}
              size="sm"
              label="All day"
              description="Unavailable the entire day"
              disabled={disabled}
            />
          </div>

          {!allDay ? (
            <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4">
              <div className="min-w-0">
                <span className="block text-sm text-gray-400 mb-2">Start</span>
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
                <span className="block text-sm text-gray-400 mb-2">End</span>
                <TimeSelect
                  value={endTime}
                  onChange={setEndTime}
                  minTime={startTime}
                  disabled={disabled}
                  aria-label="End time"
                />
              </div>
            </div>
          ) : null}

          {timeError ? (
            <p className="text-sm text-amber-200/90" role="alert">
              {timeError}
            </p>
          ) : null}
        </section>

        {/* Note */}
        <Input
          className="min-w-0 max-w-full"
          label="Note"
          placeholder="Vacation, travel, etc."
          value={title}
          onChange={setTitle}
          disabled={disabled}
          autoComplete="off"
          maxLength={500}
          inputClassName="min-h-[48px] h-12 min-w-0 max-w-full rounded-xl py-3 px-4 text-base sm:text-base"
        />

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1 sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={disabled}
            fullWidth
            className="sm:w-auto sm:flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="inverse"
            disabled={!canSubmit}
            fullWidth
            className="sm:w-auto sm:flex-1 font-semibold"
          >
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};
