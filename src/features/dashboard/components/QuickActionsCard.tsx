/**
 * QuickActionsCard - Shortcuts related to your booking link
 */

'use client';

import { ROUTES } from '@/constants/routes';
import { useNewAppointmentAction } from '@/features/availability/booking/dashboard/hooks/useNewAppointmentAction';
import { copyTextToClipboardSync } from '@/lib/copyTextToClipboard';
import {
  ChevronRightIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon, LinkIcon, PlusIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { DashboardGlassCard } from './DashboardGlassCard';

interface QuickActionsCardProps {
  hasPublicPageSlug: boolean;
  atFreeBookingCap: boolean;
  bookingLink?: string;
}

const rowClassName =
  'group flex cursor-pointer items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3.5 text-left transition-colors hover:border-white/15 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20';

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  hasPublicPageSlug,
  atFreeBookingCap,
  bookingLink,
}) => {
  const newAppointment = useNewAppointmentAction({
    hasPublicPageSlug,
    atFreeBookingCap,
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const bookingUrl = normalizeBookingLink(bookingLink);
  const bookingUrlLabel = bookingUrl
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');

  const copyBookingLink = () => {
    if (!bookingUrl) return;
    if (!copyTextToClipboardSync(bookingUrl)) return;
    setCopied(true);
  };

  return (
    <DashboardGlassCard className="h-full">
      <p className="text-base font-semibold text-white">Shortcuts</p>
      <div className="mt-4 flex flex-col gap-3">
        <ShortcutRow
          href={newAppointment.enabled ? newAppointment.href : undefined}
          onClick={
            newAppointment.enabled ? undefined : newAppointment.onBlockedClick
          }
          icon={<PlusIcon className="h-5 w-5" aria-hidden />}
          label="New appointment"
          hint="Add a job to the calendar"
          title={newAppointment.title}
          aria-label={newAppointment.ariaLabel}
        />
        <ShortcutRow
          onClick={copyBookingLink}
          icon={
            copied ? (
              <CheckIcon className="h-5 w-5" aria-hidden />
            ) : (
              <LinkIcon className="h-5 w-5" aria-hidden />
            )
          }
          label={copied ? 'Copied' : 'Copy booking link'}
          hint={bookingUrlLabel}
          title={bookingUrl || undefined}
          aria-label={copied ? 'Booking link copied' : 'Copy booking link'}
          trailing={
            copied ? (
              <CheckIcon
                className="h-4 w-4 shrink-0 text-emerald-400"
                aria-hidden
              />
            ) : (
              <ClipboardDocumentIcon
                className="h-4 w-4 shrink-0 text-zinc-400 transition-colors group-hover:text-white"
                aria-hidden
              />
            )
          }
        />
      </div>
      {newAppointment.notice ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-3 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-xs leading-relaxed text-zinc-300"
        >
          <p>{newAppointment.notice}</p>
          {atFreeBookingCap ? (
            <a
              href={ROUTES.DASHBOARD.UPGRADE}
              className="mt-1.5 inline-flex cursor-pointer text-xs font-semibold text-white underline-offset-2 hover:underline"
            >
              Upgrade to Pro
            </a>
          ) : null}
        </div>
      ) : null}
    </DashboardGlassCard>
  );
};

function ShortcutRow({
  href,
  onClick,
  icon,
  label,
  hint,
  title,
  trailing,
  'aria-label': ariaLabel,
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  hint: string;
  title?: string;
  trailing?: React.ReactNode;
  'aria-label'?: string;
}) {
  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white text-zinc-950">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium leading-5 text-white">
          {label}
        </span>
        {hint ? (
          <span className="mt-1 block truncate text-xs leading-4 text-zinc-400">
            {hint}
          </span>
        ) : null}
      </span>
      {trailing ?? (
        <ChevronRightIcon
          className="h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-300"
          aria-hidden
        />
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={rowClassName}
        title={title}
        aria-label={ariaLabel}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={rowClassName}
      title={title}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
}

function normalizeBookingLink(raw?: string) {
  const trimmed = raw?.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
}

export default QuickActionsCard;
