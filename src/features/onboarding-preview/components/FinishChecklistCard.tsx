'use client';

import { IconButton } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState } from 'react';

interface FinishChecklistCardProps {
  bookedTest: boolean;
  hasPhone: boolean;
  onBookTest: () => void;
  onDismiss: () => void;
  locationReady?: boolean;
  hasPhotos?: boolean;
  hasServices?: boolean;
  hasHours?: boolean;
  upgraded?: boolean;
}

const RING_SIZE = 44;
const STROKE_WIDTH = 3;

function progressColor(percent: number): string {
  if (percent >= 75) return 'text-emerald-400';
  if (percent >= 40) return 'text-amber-400';
  return 'text-red-400';
}

function ProgressRing({ percent }: { percent: number }) {
  const radius = (RING_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg
      width={RING_SIZE}
      height={RING_SIZE}
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      className="-rotate-90"
      aria-hidden
    >
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        className="text-white/10"
      />
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={`motion-reduce:transition-none transition-[stroke-dashoffset] duration-300 ease-out ${progressColor(percent)}`}
      />
    </svg>
  );
}

export function FinishChecklistCard({
  bookedTest,
  hasPhone,
  onBookTest,
  onDismiss,
  locationReady = false,
  hasPhotos = false,
  hasServices = false,
  hasHours = false,
  upgraded = false,
}: FinishChecklistCardProps) {
  const [open, setOpen] = useState(false);
  const items: ChecklistItem[] = [
    {
      label: 'Book a test appointment',
      done: bookedTest,
      onClick: bookedTest ? undefined : onBookTest,
    },
    {
      label: 'Add your phone number',
      done: hasPhone,
      href: hasPhone
        ? undefined
        : `${ROUTES.DASHBOARD.BUSINESS_PROFILE}?mode=edit&tab=contact`,
    },
    {
      label: 'Add your address / service area',
      done: locationReady,
      href: locationReady
        ? undefined
        : `${ROUTES.DASHBOARD.BUSINESS_PROFILE}?mode=edit&tab=details`,
    },
    {
      label: 'Add a profile photo and cover photo',
      done: hasPhotos,
      href: hasPhotos
        ? undefined
        : `${ROUTES.DASHBOARD.BUSINESS_PROFILE}?mode=edit&tab=photos`,
    },
    {
      label: 'Edit your services and prices',
      done: hasServices,
      href: hasServices ? undefined : ROUTES.DASHBOARD.SERVICES,
    },
    {
      label: 'Set your hours',
      done: hasHours,
      href: hasHours ? undefined : ROUTES.DASHBOARD.AVAILABILITY,
    },
    {
      label: 'Upgrade to Pro',
      done: upgraded,
      href: upgraded ? undefined : ROUTES.DASHBOARD.UPGRADE,
    },
  ];
  const total = items.length;
  const completed = items.filter(item => item.done).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const remaining = total - completed;

  return (
    <section className="mb-5 rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-3 sm:mb-6">
      <div className="flex items-center gap-2 px-1">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(current => !current)}
          className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-[10px] px-1 text-left"
        >
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
            <ProgressRing percent={percent} />
            <span
              className={`absolute text-[10px] font-semibold tabular-nums ${progressColor(percent)}`}
            >
              {percent}%
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold tracking-tight text-white">
              Profile completion
            </span>
            <span className="mt-0.5 block text-sm text-white/60">
              {remaining === 0
                ? 'All set'
                : `${remaining} item${remaining === 1 ? '' : 's'} left`}
            </span>
          </span>
          <ChevronDownIcon
            className={`h-5 w-5 shrink-0 text-white/50 transition-transform duration-200 motion-reduce:transition-none ${
              open ? 'rotate-180' : ''
            }`}
            aria-hidden
          />
        </button>
        <IconButton
          icon={<XMarkIcon className="h-5 w-5" />}
          aria-label="Dismiss checklist"
          title="Dismiss checklist"
          variant="ghost"
          size="md"
          className="h-9 w-9"
          onClick={onDismiss}
        />
      </div>
      {open ? (
        <ul className="mt-2">
          {items.map(item => (
            <li key={item.label}>
              <ChecklistRow item={item} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

interface ChecklistItem {
  label: string;
  done?: boolean;
  href?: string;
  onClick?: () => void;
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const className =
    'flex min-h-11 w-full items-center gap-3 rounded-[10px] px-2 text-left text-sm';
  const body = (
    <>
      {item.done ? (
        <CheckIcon className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
      ) : (
        <span
          className="h-5 w-5 shrink-0 rounded-full border border-white/25"
          aria-hidden
        />
      )}
      <span className={item.done ? 'text-white/45' : 'text-white'}>
        {item.label}
      </span>
      {item.done ? null : (
        <ChevronRightIcon
          className="ml-auto h-4 w-4 shrink-0 text-white/40"
          aria-hidden
        />
      )}
    </>
  );

  if (item.done) {
    return <div className={className}>{body}</div>;
  }

  if (item.onClick) {
    return (
      <button
        type="button"
        onClick={item.onClick}
        className={`${className} cursor-pointer hover:bg-white/[0.04]`}
      >
        {body}
      </button>
    );
  }

  if (!item.href) {
    return <div className={className}>{body}</div>;
  }

  return (
    <Link
      href={item.href}
      className={`${className} cursor-pointer hover:bg-white/[0.04]`}
    >
      {body}
    </Link>
  );
}
