'use client';

import { formatMaintenanceSlotLabel } from '@/features/maintenance/utils/maintenanceAnchorSlots';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const triggerClass = `
  w-full min-w-0 flex items-center justify-between gap-2
  h-12 px-4 rounded-xl
  border border-white/10 bg-white/5
  text-left text-base font-medium
  transition-all duration-150
  focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40
  disabled:opacity-50 disabled:cursor-not-allowed
`;

function slotButtonClass(selected: boolean): string {
  return `
    min-h-[44px] w-full rounded-xl text-sm font-medium transition-colors
    ${
      selected
        ? 'bg-white text-black shadow-sm ring-1 ring-white/20'
        : 'border border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10 hover:text-white'
    }
  `;
}

type MaintenanceAvailableTimeSelectProps = {
  id?: string;
  value: string;
  onChange: (hhmm: string) => void;
  availableSlots: string[];
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  needsDateHint?: string;
  noSlotsHint?: string;
  'aria-label'?: string;
};

export function MaintenanceAvailableTimeSelect({
  id,
  value,
  onChange,
  availableSlots,
  loading = false,
  disabled = false,
  placeholder = 'Choose time',
  needsDateHint = 'Choose a date first to see available times.',
  noSlotsHint = 'No available times for this date. Pick another day.',
  'aria-label': ariaLabel = 'Preferred visit time',
}: MaintenanceAvailableTimeSelectProps) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const normalized = value.trim().slice(0, 5);
  const hasValue = normalized.length > 0 && availableSlots.includes(normalized);
  const displayLabel = hasValue
    ? formatMaintenanceSlotLabel(normalized)
    : loading
      ? 'Loading times…'
      : placeholder;

  const handleClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && handleClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  const pickerBody = (() => {
    if (disabled) {
      return (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-5 text-center">
          <p className="text-sm leading-relaxed text-gray-400">
            {needsDateHint}
          </p>
        </div>
      );
    }
    if (loading) {
      return (
        <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
          <p className="text-sm text-gray-500">Loading available times…</p>
        </div>
      );
    }
    if (availableSlots.length === 0) {
      return (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-5 text-center">
          <p className="text-sm leading-relaxed text-gray-400">{noSlotsHint}</p>
        </div>
      );
    }
    return (
      <div
        className="max-h-[min(320px,52vh)] overflow-y-auto overscroll-contain"
        role="listbox"
        aria-label={ariaLabel}
      >
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {availableSlots.map(slot => {
            const selected = normalized === slot;
            return (
              <button
                key={slot}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(slot);
                  handleClose();
                }}
                className={slotButtonClass(selected)}
              >
                {formatMaintenanceSlotLabel(slot)}
              </button>
            );
          })}
        </div>
      </div>
    );
  })();

  const slotCount = availableSlots.length;
  const showSlotSubtitle = !disabled && !loading && slotCount > 0;

  const dialogHeader = (
    <div
      className={`shrink-0 border-b border-white/10 bg-[#141414] px-4 pb-3 pt-2 ${isMobile ? 'rounded-t-2xl' : 'rounded-t-xl'}`}
    >
      {isMobile ? (
        <div
          className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20"
          aria-hidden
        />
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold tracking-tight text-white">
            Preferred time
          </p>
          {showSlotSubtitle ? (
            <p className="mt-0.5 text-xs text-gray-500">
              {slotCount} open {slotCount === 1 ? 'slot' : 'slots'}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="-m-1 shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const sheetBodyPadding = {
    paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
  };

  const portalContent =
    open && typeof document !== 'undefined'
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[2px]"
              aria-hidden
              onClick={handleClose}
            />
            {isMobile ? (
              <div
                className="fixed bottom-0 left-0 right-0 z-[101] max-h-[85vh] overflow-hidden rounded-t-2xl border-t border-white/10 bg-[#141414] shadow-2xl"
                role="dialog"
                aria-label={ariaLabel}
                aria-modal="true"
              >
                {dialogHeader}
                <div className="px-4 pb-1 pt-4" style={sheetBodyPadding}>
                  {pickerBody}
                </div>
              </div>
            ) : (
              <div
                className="fixed inset-0 z-[101] flex items-center justify-center p-4"
                role="dialog"
                aria-label={ariaLabel}
                aria-modal="true"
                onClick={handleClose}
              >
                <div
                  className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-2xl"
                  onClick={e => e.stopPropagation()}
                >
                  {dialogHeader}
                  <div className="px-4 pb-5 pt-4">{pickerBody}</div>
                </div>
              </div>
            )}
          </>,
          document.body
        )
      : null;

  const triggerDisabled = disabled || loading;

  return (
    <>
      <button
        id={id}
        type="button"
        onClick={() => !triggerDisabled && setOpen(true)}
        disabled={triggerDisabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`${triggerClass} ${
          !hasValue && !loading ? 'text-gray-500' : 'text-white'
        } ${open ? 'border-emerald-500/40 ring-2 ring-emerald-500/20' : ''} ${
          !triggerDisabled && !open
            ? 'hover:border-white/15 cursor-pointer'
            : ''
        }`}
      >
        <span className="min-w-0 flex-1 truncate">{displayLabel}</span>
        <ChevronDownIcon
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {portalContent}
    </>
  );
}
