'use client';

import { Button } from '@/components/shared';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  SERVICE_DURATION_MAX_MINUTES,
  SERVICE_DURATION_MIN_MINUTES,
  compareTime,
  formatServiceDurationSelectLabel,
  from24h,
  normalizeServiceDurationHHmm,
  to24h,
} from '../utils/timeOptions';
import { ScrollDial } from './ScrollDial';

const HOUR_12_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const n = i + 1;
  return { value: String(n), label: String(n) };
});

const MINUTE_OPTIONS = [
  { value: '00', label: '00' },
  { value: '30', label: '30' },
];

const AMPM_OPTIONS = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
];

const DURATION_HOUR_OPTIONS = Array.from({ length: 11 }, (_, i) => ({
  value: String(i),
  label: String(i),
}));

function valueToLabel(value: string): string {
  const [h = '', m = '00'] = value.split(':');
  const hour24 = parseInt(h, 10) || 9;
  const hour12 = hour24 % 12 || 12;
  const ampm = hour24 < 12 ? 'AM' : 'PM';
  return `${hour12}${m === '30' ? ':30' : ''} ${ampm}`;
}

interface TimeSelectProps {
  value: string;

  onChange: (value: string) => void;
  disabled?: boolean;
  minTime?: string;
  /** `duration` = service length (0–10 hr, :00 / :30), same dial UX as availability times. */
  variant?: 'clock' | 'duration';
  /** When `variant="duration"` and `value` is empty, shown on the closed trigger. */
  durationPlaceholder?: string;
  'aria-label'?: string;
  className?: string;
}

export const TimeSelect: React.FC<TimeSelectProps> = ({
  value,
  onChange,
  disabled = false,
  minTime,
  variant = 'clock',
  durationPlaceholder = 'Select duration',
  'aria-label': ariaLabel,
  className = '',
}) => {
  const resolvedAriaLabel =
    ariaLabel ??
    (variant === 'duration' ? 'Select service duration' : 'Select time');

  const normalized = useMemo(() => {
    if (variant === 'duration') {
      const trimmed = value.trim();
      if (!trimmed) return '01:00';
      return normalizeServiceDurationHHmm(trimmed) || '01:00';
    }
    const [h, m] = value.split(':');
    return `${h?.padStart(2, '0') ?? '09'}:${m === '30' ? '30' : '00'}`;
  }, [value, variant]);

  const { hour12, minute, ampm } = useMemo(
    () => from24h(normalized),
    [normalized]
  );

  const durationParts = useMemo(() => {
    if (variant !== 'duration') return { hour0to10: 1, minute: '00' as const };
    const [hs = '01', ms = '00'] = normalized.split(':');
    const h = Math.min(10, Math.max(0, parseInt(hs, 10) || 0));
    const m: '00' | '30' = ms === '30' ? '30' : '00';
    return { hour0to10: h, minute: m };
  }, [normalized, variant]);

  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Draft time while picker is open; committed on "Update time" (same for mobile and desktop).
  const [draftHour12, setDraftHour12] = useState(String(hour12));
  const [draftMinute, setDraftMinute] = useState<'00' | '30'>(minute);
  const [draftAmpm, setDraftAmpm] = useState<'AM' | 'PM'>(ampm);
  const [draftHour0to10, setDraftHour0to10] = useState(
    String(durationParts.hour0to10)
  );
  // Only sync dial scroll from value when sheet just opened; avoids dial jumping when user scrolls
  const [syncDialFromValue, setSyncDialFromValue] = useState(false);

  // When picker opens (mobile or desktop), init draft from current value and allow dials to sync scroll once
  useEffect(() => {
    if (open) {
      if (variant === 'duration') {
        const base =
          value.trim() === ''
            ? '01:00'
            : normalizeServiceDurationHHmm(value) || '01:00';
        const [hs = '01', ms = '00'] = base.split(':');
        const hParsed = parseInt(hs, 10);
        const hClamped = Number.isFinite(hParsed)
          ? Math.min(10, Math.max(0, hParsed))
          : 1;
        setDraftHour0to10(String(hClamped));
        setDraftMinute(ms === '30' ? '30' : '00');
      } else {
        const p = from24h(normalized);
        setDraftHour12(String(p.hour12));
        setDraftMinute(p.minute);
        setDraftAmpm(p.ampm);
      }
      setSyncDialFromValue(true);
      const t = setTimeout(() => setSyncDialFromValue(false), 250);
      return () => clearTimeout(t);
    } else {
      setSyncDialFromValue(false);
    }
  }, [open, normalized, variant, value]);

  const handleUpdateTime = useCallback(() => {
    if (variant === 'duration') {
      const h = Math.min(10, Math.max(0, parseInt(draftHour0to10, 10) || 0));
      const mm = draftMinute;
      let totalMins = h * 60 + (mm === '30' ? 30 : 0);
      if (totalMins < SERVICE_DURATION_MIN_MINUTES) {
        totalMins = SERVICE_DURATION_MIN_MINUTES;
      }
      if (totalMins > SERVICE_DURATION_MAX_MINUTES) {
        totalMins = SERVICE_DURATION_MAX_MINUTES;
      }
      const nh = Math.floor(totalMins / 60);
      const nrem = totalMins % 60;
      onChange(
        `${nh.toString().padStart(2, '0')}:${nrem === 30 ? '30' : '00'}`
      );
      setOpen(false);
      return;
    }
    let next = to24h(parseInt(draftHour12, 10) || 9, draftMinute, draftAmpm);
    if (minTime && compareTime(next, minTime) < 0) next = minTime;
    onChange(next);
    setOpen(false);
  }, [
    variant,
    draftHour0to10,
    draftMinute,
    draftHour12,
    draftAmpm,
    minTime,
    onChange,
  ]);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    setOpen(true);
  }, [disabled]);

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

  const displayLabel =
    variant === 'duration'
      ? value.trim() === ''
        ? durationPlaceholder
        : formatServiceDurationSelectLabel(
            normalizeServiceDurationHHmm(value) || value
          )
      : valueToLabel(normalized);

  const timeDialContent =
    variant === 'duration' ? (
      <>
        <div className="flex items-stretch justify-center gap-1 py-4">
          <div className="flex-1 max-w-[80px]" aria-label="Hours">
            <ScrollDial
              options={DURATION_HOUR_OPTIONS}
              value={draftHour0to10}
              onChange={setDraftHour0to10}
              syncFromValue={syncDialFromValue}
              aria-label="Hours"
            />
          </div>
          <span className="flex items-center justify-center text-gray-500 text-xl font-medium w-4 shrink-0">
            :
          </span>
          <div className="flex-1 max-w-[72px]" aria-label="Minutes">
            <ScrollDial
              options={MINUTE_OPTIONS}
              value={draftMinute}
              onChange={m => setDraftMinute(m as '00' | '30')}
              syncFromValue={syncDialFromValue}
              aria-label="Minutes"
            />
          </div>
        </div>
        <div
          className="px-4 pb-4"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <Button
            type="button"
            onClick={handleUpdateTime}
            variant="inverse"
            fullWidth
            className="font-semibold"
          >
            Set duration
          </Button>
        </div>
      </>
    ) : (
      <>
        <div className="flex items-stretch justify-center gap-1 py-4">
          <div className="flex-1 max-w-[80px]" aria-label="Hour">
            <ScrollDial
              options={HOUR_12_OPTIONS}
              value={draftHour12}
              onChange={setDraftHour12}
              syncFromValue={syncDialFromValue}
              aria-label="Hour"
            />
          </div>
          <span className="flex items-center justify-center text-gray-500 text-xl font-medium w-4 shrink-0">
            :
          </span>
          <div className="flex-1 max-w-[72px]" aria-label="Minute">
            <ScrollDial
              options={MINUTE_OPTIONS}
              value={draftMinute}
              onChange={m => setDraftMinute(m as '00' | '30')}
              syncFromValue={syncDialFromValue}
              aria-label="Minute"
            />
          </div>
          <div className="flex-1 max-w-[64px]" aria-label="AM/PM">
            <ScrollDial
              options={AMPM_OPTIONS}
              value={draftAmpm}
              onChange={a => setDraftAmpm(a as 'AM' | 'PM')}
              syncFromValue={syncDialFromValue}
              aria-label="AM or PM"
            />
          </div>
        </div>
        <div
          className="px-4 pb-4"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <Button
            type="button"
            onClick={handleUpdateTime}
            variant="inverse"
            fullWidth
            className="font-semibold"
          >
            Update time
          </Button>
        </div>
      </>
    );

  const dialogHeader = (
    <div
      className={`flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#141414] shrink-0 ${isMobile ? 'rounded-t-2xl' : 'rounded-t-xl'}`}
    >
      <span className="text-sm font-medium text-gray-400">
        {variant === 'duration' ? 'Select duration' : 'Select time'}
      </span>
      <button
        type="button"
        onClick={handleClose}
        className="p-2 -m-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
        aria-label="Close"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );

  const portalContent =
    open && typeof document !== 'undefined'
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[100] bg-black/60"
              aria-hidden
              onClick={handleClose}
            />
            {isMobile ? (
              <div
                className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-2xl border-t border-white/10 bg-[#141414] shadow-2xl"
                role="dialog"
                aria-label={resolvedAriaLabel}
                aria-modal="true"
              >
                {dialogHeader}
                <div
                  className="max-h-[65vh] overflow-y-auto"
                  style={{
                    paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                  }}
                >
                  {timeDialContent}
                </div>
              </div>
            ) : (
              <div
                className="fixed inset-0 z-[101] flex items-center justify-center p-4"
                role="dialog"
                aria-label={resolvedAriaLabel}
                aria-modal="true"
                onClick={handleClose}
              >
                <div
                  className="w-full max-w-sm rounded-xl border border-white/10 bg-[#141414] shadow-2xl overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  {dialogHeader}
                  <div className="p-4">{timeDialContent}</div>
                </div>
              </div>
            )}
          </>,
          document.body
        )
      : null;

  return (
    <>
      <div className={className}>
        <button
          ref={triggerRef}
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          aria-label={resolvedAriaLabel}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={`
            w-full min-w-0 flex items-center justify-between gap-2
            h-12 px-4 rounded-xl
            border border-white/10 bg-white/5
            text-left text-base font-medium ${
              variant === 'duration' && value.trim() === ''
                ? 'text-gray-500'
                : 'text-white'
            }
            transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40
            disabled:opacity-50 disabled:cursor-not-allowed
            ${open ? 'border-emerald-500/40 ring-2 ring-emerald-500/20' : ''}
            ${!disabled && !open ? 'hover:border-white/15' : ''}
          `}
        >
          <span className="min-w-0 flex-1 truncate">{displayLabel}</span>
          <ChevronDownIcon
            className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      </div>
      {portalContent}
    </>
  );
};
