'use client';

import { GlassCard, formatUsPhoneDigits } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { formatQuoteRequestVehicleLine } from '@/features/quotes/public-request/buildQuoteRequestNote';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React, { useMemo } from 'react';
import type { PublicQuoteRequestFormData } from '../types';

export type PublicQuoteRequestSummaryEdits = {
  onEditContact?: () => void;
  onEditVehicle?: () => void;
  onEditRequest?: () => void;
};

interface PublicQuoteRequestSummaryCardProps {
  form: PublicQuoteRequestFormData;
  showVehicleFields: boolean;
  showSecondVehicle?: boolean;
  bookingFlowLocale?: PublicBookingFlowLocale;
  header?: string;
  blurColor?: string;
  className?: string;
  edits?: PublicQuoteRequestSummaryEdits;
}

function SummaryBlock({
  label,
  editLabel,
  onEdit,
  children,
}: {
  label: string;
  editLabel?: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">{label}</p>
        {onEdit && editLabel ? (
          <button
            type="button"
            onClick={onEdit}
            className="cursor-pointer text-xs font-semibold text-white/70 transition-colors hover:text-white"
            aria-label={`${editLabel}: ${label}`}
          >
            {editLabel}
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function PublicQuoteRequestSummaryCard({
  form,
  showVehicleFields,
  showSecondVehicle = false,
  bookingFlowLocale = 'en',
  header,
  blurColor = 'bg-zinc-500',
  className = '',
  edits,
}: PublicQuoteRequestSummaryCardProps) {
  const ui = useMemo(
    () => publicBookingUi(bookingFlowLocale),
    [bookingFlowLocale]
  );
  const qf = ui.quoteForm;
  const firstVehicle = formatQuoteRequestVehicleLine(
    form.vehicleYear,
    form.vehicleMake,
    form.vehicleModel
  );
  const secondVehicle = showSecondVehicle
    ? formatQuoteRequestVehicleLine(
        form.vehicle2Year,
        form.vehicle2Make,
        form.vehicle2Model
      )
    : null;
  const timelineLabel = useMemo(() => {
    const raw = form.timeline.trim();
    if (!raw) return null;
    const labels: Record<string, string> = {
      ASAP: qf.timelineAsap,
      'This week': qf.timelineThisWeek,
      'Next 2 weeks': qf.timelineNextTwoWeeks,
      'This month': qf.timelineThisMonth,
      Flexible: qf.timelineFlexible,
    };
    return labels[raw] ?? raw;
  }, [form.timeline, qf]);

  return (
    <GlassCard
      padding="none"
      rounded="rounded-2xl"
      blurColor={blurColor}
      showBlur
      className={className}
    >
      {header ? (
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-sm font-semibold text-gray-300">{header}</p>
        </div>
      ) : null}
      <div className="space-y-4 p-4 sm:p-6">
        <SummaryBlock
          label={ui.common.customer}
          editLabel={qf.edit}
          onEdit={edits?.onEditContact}
        >
          <p className="font-medium text-white">{form.customerName}</p>
          <p className="break-words text-sm text-gray-400">
            {form.customerEmail}
          </p>
          <p className="mt-0.5 text-sm text-gray-400 tabular-nums">
            {formatUsPhoneDigits(form.customerPhone)}
          </p>
        </SummaryBlock>
        {showVehicleFields && firstVehicle ? (
          <>
            <div className="h-px bg-white/10" />
            <SummaryBlock
              label={ui.common.vehicle}
              editLabel={qf.edit}
              onEdit={edits?.onEditVehicle}
            >
              <p className="font-medium text-white">{firstVehicle}</p>
              {secondVehicle ? (
                <>
                  <p className="mt-3 mb-0.5 text-xs text-gray-500">
                    {qf.secondVehicle}
                  </p>
                  <p className="font-medium text-white">{secondVehicle}</p>
                </>
              ) : null}
            </SummaryBlock>
          </>
        ) : null}
        {timelineLabel ? (
          <>
            <div className="h-px bg-white/10" />
            <SummaryBlock
              label={qf.whenLabel}
              editLabel={qf.edit}
              onEdit={edits?.onEditRequest}
            >
              <p className="font-medium text-white">{timelineLabel}</p>
            </SummaryBlock>
          </>
        ) : null}
        <div className="h-px bg-white/10" />
        <SummaryBlock
          label={qf.successDetailsLabel}
          editLabel={qf.edit}
          onEdit={edits?.onEditRequest}
        >
          <p className="whitespace-pre-wrap text-sm text-gray-400">
            {form.details}
          </p>
        </SummaryBlock>
      </div>
    </GlassCard>
  );
}
