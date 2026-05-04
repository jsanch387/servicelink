'use client';

import {
  Button,
  NativeScheduleDateRow,
  NativeScheduleTimeRow,
  PriceInput,
  Select,
  TimeSelect,
} from '@/components/shared';
import { serviceDurationHHmmToMinutes } from '@/features/availability/utils/timeOptions';
import { createMaintenanceEnrollment } from '@/features/maintenance/api/createMaintenanceEnrollment';
import { useState } from 'react';

const FREQUENCY_OPTIONS = [
  { value: '2', label: 'Every 2 weeks' },
  { value: '3', label: 'Every 3 weeks' },
  { value: '4', label: 'Every 4 weeks' },
  { value: '6', label: 'Every 6 weeks' },
  { value: '8', label: 'Every 8 weeks' },
] as const;

interface EnrollMaintenanceModalBodyProps {
  customerId: string;
  customerName: string;
  onClose: () => void;
}

/**
 * CRM enrollment UI: saves `maintenance_enrollments` and emails a customer link when possible.
 */
export function EnrollMaintenanceModalBody({
  customerId,
  customerName,
  onClose,
}: EnrollMaintenanceModalBodyProps) {
  const [priceDigits, setPriceDigits] = useState('');
  const [frequencyWeeks, setFrequencyWeeks] = useState('');
  const [visitDurationHHmm, setVisitDurationHHmm] = useState('');
  const [anchorDate, setAnchorDate] = useState('');
  const [anchorTime, setAnchorTime] = useState('10:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copyDone, setCopyDone] = useState(false);
  const [successPayload, setSuccessPayload] = useState<{
    customerViewUrl: string;
    emailSent: boolean;
    notifiedEmail?: string;
    emailError?: string;
  } | null>(null);

  const canSubmitEnroll =
    !isSubmitting &&
    priceDigits.trim() !== '' &&
    frequencyWeeks.trim() !== '' &&
    visitDurationHHmm.trim() !== '';

  const handleEnroll = async () => {
    if (!canSubmitEnroll) return;

    setSubmitError(null);
    setIsSubmitting(true);
    const priceDollars = parseInt(priceDigits, 10);
    const frequency = parseInt(frequencyWeeks, 10);
    const durationMinutes = serviceDurationHHmmToMinutes(visitDurationHHmm);

    const result = await createMaintenanceEnrollment({
      customerId,
      serviceNameSnapshot: 'Maintenance',
      priceCents: Number.isFinite(priceDollars) ? priceDollars * 100 : 0,
      frequencyWeeks: Number.isFinite(frequency) ? frequency : 0,
      durationMinutes,
      ...(anchorDate.trim()
        ? {
            anchorDate: anchorDate.trim(),
            anchorTime: anchorTime.trim().slice(0, 5) || '10:00',
          }
        : {}),
    });

    setIsSubmitting(false);

    if (!result.success) {
      setSubmitError(result.error);
      return;
    }

    setSuccessPayload({
      customerViewUrl: result.customerViewUrl,
      emailSent: result.emailSent,
      notifiedEmail: result.notifiedEmail,
      emailError: result.emailError,
    });
  };

  const handleCopyLink = async () => {
    if (!successPayload?.customerViewUrl) return;
    try {
      await navigator.clipboard.writeText(successPayload.customerViewUrl);
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setCopyDone(false);
    }
  };

  if (successPayload) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <div className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3">
          <p className="text-sm font-semibold text-white">
            {successPayload.emailSent ? 'Invite sent' : 'Detail saved'}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {successPayload.emailSent
              ? successPayload.notifiedEmail
                ? `Emailed ${successPayload.notifiedEmail} a link to accept and pay.`
                : 'Emailed them a link to accept and pay.'
              : successPayload.emailError
                ? `Email didn’t send (${successPayload.emailError}). Copy the link below.`
                : 'Copy the link below and send it yourself.'}
          </p>
        </div>

        <div>
          <label className="mb-2.5 block text-left text-sm font-semibold text-gray-200">
            Customer link
          </label>
          <div className="break-all rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 text-xs text-gray-300">
            {successPayload.customerViewUrl}
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="inverse"
              size="sm"
              onClick={() => void handleCopyLink()}
              className="text-sm font-semibold"
            >
              {copyDone ? 'Copied' : 'Copy link'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <p className="text-sm text-gray-400">
        Fill in the details for this customer&apos;s maintenance detail below.
      </p>

      <div className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-5 lg:space-y-0">
        <div className="lg:col-span-2">
          <label className="mb-2.5 block text-left text-sm font-semibold text-gray-200">
            Customer
          </label>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 lg:rounded-2xl lg:border-white/[0.1] lg:bg-gradient-to-b lg:from-white/[0.06] lg:to-white/[0.02] lg:px-4 lg:py-3.5">
            <p className="text-sm font-semibold text-white">{customerName}</p>
          </div>
        </div>

        <div className="min-w-0">
          <PriceInput
            label="Price per visit"
            placeholder="e.g. 100"
            value={priceDigits}
            onChange={setPriceDigits}
          />
        </div>

        <div className="min-w-0">
          <Select
            label="Frequency"
            placeholder="How often"
            value={frequencyWeeks}
            onChange={setFrequencyWeeks}
            options={[...FREQUENCY_OPTIONS]}
          />
        </div>

        <div className="min-w-0 lg:col-span-2">
          <label className="mb-2.5 block text-left text-sm font-semibold text-gray-200">
            Visit duration
          </label>
          <TimeSelect
            variant="duration"
            value={visitDurationHHmm}
            onChange={setVisitDurationHHmm}
            durationPlaceholder="Select duration"
            aria-label="Select visit duration"
          />
        </div>

        <div className="lg:col-span-2">
          <p className="mb-2 text-sm font-semibold text-gray-200">
            Maintenance date (optional)
          </p>
          <p className="mb-3 text-xs text-gray-500">
            Optional—if you skip this, they pick a date from the link.
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8">
            <div className="min-w-0">
              <label
                htmlFor="enroll-maint-preferred-date"
                className="mb-2.5 block text-left text-sm font-semibold text-gray-200"
              >
                Preferred date
              </label>
              <NativeScheduleDateRow
                id="enroll-maint-preferred-date"
                value={anchorDate}
                onChange={setAnchorDate}
                aria-label="Preferred first visit date"
              />
            </div>
            <div className="min-w-0">
              <label
                htmlFor="enroll-maint-preferred-time"
                className="mb-2.5 block text-left text-sm font-semibold text-gray-200"
              >
                Preferred time
              </label>
              <NativeScheduleTimeRow
                id="enroll-maint-preferred-time"
                value={anchorTime}
                onChange={setAnchorTime}
                aria-label="Preferred first visit time"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 lg:border-t lg:border-white/10 lg:pt-6">
        <div className="space-y-1.5 text-xs text-gray-500 lg:text-[13px]">
          <p>
            Send invite saves this detail and emails a link. They accept and pay
            with your payment settings, then the visit shows on your calendar.
          </p>
          <p>No customer email? Copy the link on the next screen.</p>
        </div>
        {submitError ? (
          <p className="text-xs text-red-300">{submitError}</p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end lg:gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="inverse"
            onClick={() => void handleEnroll()}
            disabled={!canSubmitEnroll}
            loading={isSubmitting}
            className="text-sm font-semibold lg:min-w-[160px]"
          >
            Send invite
          </Button>
        </div>
      </div>
    </div>
  );
}
