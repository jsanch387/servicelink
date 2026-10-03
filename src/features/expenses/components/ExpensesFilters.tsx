'use client';

import { FilterMenu } from '@/components/shared';
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { EXPENSE_CATEGORIES } from '../constants';
import type { ExpenseListFilters } from '../utils/expenseTotals';
import { formatExpenseMonth } from '../utils/parseExpense';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function maxExpenseMonth(now = new Date()): string {
  const max = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  return `${max.getFullYear()}-${String(max.getMonth() + 1).padStart(2, '0')}`;
}

const CATEGORIES: { id: ExpenseListFilters['category']; label: string }[] = [
  { id: 'all', label: 'All categories' },
  ...EXPENSE_CATEGORIES.map(category => ({
    id: category.id,
    label: category.label,
  })),
];

function panelStyle(trigger: HTMLElement, width: number): React.CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const left = Math.min(
    Math.max(12, rect.left),
    window.innerWidth - width - 12
  );
  return {
    position: 'fixed',
    top: rect.bottom + 8,
    left,
    width,
    zIndex: 80,
  };
}

export const ExpensesFilters: React.FC<{
  filters: ExpenseListFilters;
  onChange: (filters: ExpenseListFilters) => void;
}> = ({ filters, onChange }) => {
  const [open, setOpen] = useState<'date' | 'filter' | null>(null);
  const dateRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [year, setYear] = useState(() => new Date().getFullYear());
  const category = filters.category;
  const monthLabel = filters.month
    ? formatExpenseMonth(filters.month)
    : 'All months';
  const latestMonth = maxExpenseMonth();

  useEffect(() => {
    if (open !== 'date') return;
    const selectedYear = filters.month?.slice(0, 4);
    setYear(selectedYear ? Number(selectedYear) : new Date().getFullYear());
  }, [open, filters.month]);

  useLayoutEffect(() => {
    if (open !== 'date') return;
    const trigger = dateRef.current;
    if (!trigger) return;
    const place = () => setStyle(panelStyle(trigger, 260));
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  useEffect(() => {
    if (open !== 'date') return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dateRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const datePanel =
    open === 'date' ? (
      <div
        ref={panelRef}
        style={style}
        role="dialog"
        aria-label="Choose month"
        className="rounded-[10px] border border-white/10 bg-[#1a1a1a] p-3 shadow-lg"
      >
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous year"
            disabled={year <= 2000}
            onClick={() => setYear(current => current - 1)}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[10px] text-gray-300 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:text-gray-600 disabled:hover:bg-transparent"
          >
            <ChevronLeftIcon className="h-4 w-4" aria-hidden />
          </button>
          <span className="text-sm font-medium text-white">{year}</span>
          <button
            type="button"
            aria-label="Next year"
            disabled={year >= Number(latestMonth.slice(0, 4))}
            onClick={() => setYear(current => current + 1)}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[10px] text-gray-300 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:text-gray-600 disabled:hover:bg-transparent"
          >
            <ChevronRightIcon className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange({ ...filters, month: null });
            setOpen(null);
          }}
          className={`mb-2 w-full cursor-pointer rounded-[10px] px-3 py-2 text-left text-sm ${
            filters.month
              ? 'text-gray-300 hover:bg-white/5 hover:text-white'
              : 'bg-white/10 font-medium text-white'
          }`}
        >
          All months
        </button>
        <div className="grid grid-cols-3 gap-1.5">
          {MONTHS.map((label, index) => {
            const value = `${year}-${String(index + 1).padStart(2, '0')}`;
            const selected = filters.month === value;
            const disabled = value < '2000-01' || value > latestMonth;
            return (
              <button
                key={value}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onChange({ ...filters, month: value });
                  setOpen(null);
                }}
                className={`h-9 cursor-pointer rounded-[10px] text-sm ${
                  selected
                    ? 'bg-white/10 font-medium text-white'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                } disabled:cursor-not-allowed disabled:text-gray-600 disabled:hover:bg-transparent`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  const panel = datePanel;

  return (
    <div className="mb-4 flex items-center justify-end gap-2">
      <button
        ref={dateRef}
        type="button"
        aria-expanded={open === 'date'}
        aria-haspopup="dialog"
        onClick={() => setOpen(current => (current === 'date' ? null : 'date'))}
        className="inline-flex h-10 min-w-0 cursor-pointer items-center gap-2 rounded-[10px] border border-white/15 px-3.5 text-sm text-gray-200 transition-colors hover:border-white/30 hover:bg-white/[0.04]"
      >
        <span className="truncate text-left">{monthLabel}</span>
        <CalendarDaysIcon
          className="h-4 w-4 shrink-0 text-gray-400"
          aria-hidden
        />
      </button>

      <FilterMenu
        options={CATEGORIES}
        value={category}
        menuLabel="Category"
        expanded={open === 'filter'}
        onExpandedChange={next => setOpen(next ? 'filter' : null)}
        onChange={next => onChange({ ...filters, category: next })}
      />

      {panel && typeof document !== 'undefined'
        ? createPortal(panel, document.body)
        : null}
    </div>
  );
};
