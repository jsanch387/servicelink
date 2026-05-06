'use client';

import { Button, Modal } from '@/components/shared';
import type { WeeklySchedule } from '@/features/availability/types/availability';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
  UserCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';
import { DateSelector } from '../components/DateSelector';
import { TimeSlotGrid } from '../components/TimeSlotGrid';
import type { ExistingBooking, TimeOffInterval } from '../types';
import { formatDurationMinutes } from '../utils/formatDuration';
import { localDateKey } from './dayPlannerUtils';
import type { AvailabilityBookingDisplay } from './types';

interface AvailabilityBookingDetailPanelProps {
  booking: AvailabilityBookingDisplay;
  onClose: () => void;
  onMarkCompleted: (id: string) => void;
  onCancel: (id: string) => void;
  /** Confirmed booking only: PATCH reschedule with calendar validation. */
  onReschedule?: (
    id: string,
    scheduledDate: string,
    startTime: string
  ) => Promise<{ success: boolean; error?: string }>;
  isUpdating?: boolean;
  isRescheduling?: boolean;
  updateError?: string | null;
  weeklySchedule: WeeklySchedule;
  timeOffBlocks: TimeOffInterval[];
  /** Confirmed/completed bookings except the one being rescheduled (for slot blocking). */
  existingBookingsForSlotGrid: ExistingBooking[];
}

function formatFullAddress(
  address: AvailabilityBookingDisplay['address']
): string {
  const parts = [
    address.street,
    address.unitApt || null,
    [address.city, address.state, address.zip].filter(Boolean).join(', '),
  ].filter(Boolean);
  return parts.join(', ');
}

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(0, 10);
  if (digits.length < 10) return phone;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatVehicle(booking: AvailabilityBookingDisplay): string | null {
  const parts = [
    booking.customerVehicleYear?.trim(),
    booking.customerVehicleMake?.trim(),
    booking.customerVehicleModel?.trim(),
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(' ');
}

function formatCurrencyAmount(cents: number, currency: string): string {
  const normalized = (currency || 'usd').toUpperCase();
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: normalized,
  }).format(Math.max(0, cents) / 100);
}

export function AvailabilityBookingDetailPanel({
  booking,
  onClose,
  onMarkCompleted,
  onCancel,
  onReschedule,
  isUpdating = false,
  isRescheduling = false,
  updateError = null,
  weeklySchedule,
  timeOffBlocks,
  existingBookingsForSlotGrid,
}: AvailabilityBookingDetailPanelProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);

  /**
   * Reset picker when opening the modal or switching bookings.
   * Intentionally omits `booking.date` / `startTimeHHmm` so a successful reschedule
   * (same id, new slot) does not reset the form and dismiss the confirmation step.
   */
  useEffect(() => {
    if (!showRescheduleModal) return;
    setRescheduleSuccess(false);
    setRescheduleError(null);
    setSelectedDate(new Date(`${booking.date}T12:00:00`));
    setSelectedTime(booking.startTimeHHmm);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init from latest booking only when modal opens or booking row changes
  }, [showRescheduleModal, booking.id]);

  const closeRescheduleModal = () => {
    setShowRescheduleModal(false);
    setRescheduleSuccess(false);
  };

  const fullAddress = formatFullAddress(booking.address);
  const phoneFormatted = formatPhoneDisplay(booking.customerPhone);
  const telHref = `tel:${booking.customerPhone.replace(/\D/g, '')}`;
  const isConfirmed = booking.status === 'confirmed';
  const isCancelled = booking.status === 'cancelled';
  const payment = booking.payment ?? null;
  const showPaymentSection = Boolean(payment);

  const paymentDetailVariant = payment
    ? (() => {
        const paid = payment.paidOnlineAmountCents;
        const rem = payment.remainingAmountCents;
        const method = payment.paymentMethodSelected?.trim().toLowerCase();
        if (method === 'pay_in_person' && paid <= 0) {
          return 'pay_in_person' as const;
        }
        if (paid > 0 && rem > 0) {
          return 'deposit' as const;
        }
        if (paid > 0 && rem <= 0) {
          return 'paid_full' as const;
        }
        return 'other' as const;
      })()
    : null;

  const navigationUrl = (() => {
    const destination = fullAddress.trim();
    if (!destination) return null;

    const encoded = encodeURIComponent(destination);
    const ua =
      typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      // iPadOS Safari reports as MacIntel with touch points.
      (typeof navigator !== 'undefined' &&
        /Macintosh/.test(ua) &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (navigator as any).maxTouchPoints > 1);

    return isIOS
      ? `https://maps.apple.com/?daddr=${encoded}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
  })();

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = () => {
    onCancel(booking.id);
    setShowCancelConfirm(false);
    // Panel closes when parent's handleCancel succeeds (setSelectedBooking(null))
  };

  const handleMarkCompletedClick = () => {
    onMarkCompleted(booking.id);
    // Panel closes when parent's handleMarkCompleted succeeds (setSelectedBooking(null))
  };

  const handleRescheduleSave = async () => {
    setRescheduleError(null);
    if (!onReschedule) {
      closeRescheduleModal();
      return;
    }
    if (!selectedDate || !selectedTime?.trim()) {
      setRescheduleError('Choose a date and an available time.');
      return;
    }
    const scheduledDate = localDateKey(selectedDate);
    const result = await onReschedule(
      booking.id,
      scheduledDate,
      selectedTime.trim()
    );
    if (!result.success) {
      setRescheduleError(result.error ?? 'Could not save the new time.');
      return;
    }
    setRescheduleSuccess(true);
  };

  const bookingActionTileClass =
    'group flex min-h-[4.5rem] w-full min-w-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-1 py-3.5 text-gray-400 transition-colors hover:border-white/16 hover:bg-white/[0.1] hover:text-gray-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-[4.75rem] sm:py-4';

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 md:bg-black/40 md:backdrop-blur-sm"
        aria-hidden
      />
      <div
        className="fixed inset-0 z-50 flex min-h-0 min-w-0 flex-col overscroll-none bg-[#0f0f0f] animate-in slide-in-from-right duration-200 md:inset-y-0 md:left-auto md:right-0 md:w-full md:max-w-md md:border-l md:border-white/5 md:shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-detail-title"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Back to list"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h2
            id="booking-detail-title"
            className="text-lg font-bold text-white truncate flex-1"
          >
            Booking details
          </h2>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-4 sm:p-5 [-webkit-overflow-scrolling:touch]">
          {isCancelled && (
            <div
              className="rounded-xl border border-rose-500/35 bg-rose-500/[0.09] px-4 py-3"
              role="status"
            >
              <p className="text-sm font-semibold text-rose-400">Cancelled</p>
              <p className="mt-1 text-sm leading-snug text-rose-100/85">
                This appointment was cancelled. It stays on your schedule for
                reference only.
              </p>
            </div>
          )}

          {/* Schedule & service */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-3 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Schedule
            </h3>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
              {/* When & what */}
              <div className="p-4 space-y-3">
                <p className="font-semibold text-white">
                  {booking.serviceName}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-gray-300">
                  <span>
                    {new Date(booking.date + 'T12:00:00').toLocaleDateString(
                      'en-US',
                      {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      }
                    )}
                  </span>
                  <span>
                    {booking.time} ·{' '}
                    {formatDurationMinutes(booking.serviceDurationMinutes)}
                  </span>
                </div>
              </div>

              {/* Price breakdown – only if there is any price to show */}
              {((booking.servicePriceCents != null &&
                booking.servicePriceCents > 0) ||
                (booking.addonDetails?.length ?? 0) > 0) && (
                <div className="border-t border-white/[0.06] px-4 py-3 bg-white/[0.02]">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
                    Price breakdown
                  </p>
                  <div className="space-y-1.5 text-sm">
                    {booking.servicePriceCents != null &&
                      booking.servicePriceCents > 0 && (
                        <div className="flex justify-between items-baseline gap-3">
                          <span className="text-gray-300">Service</span>
                          <span className="text-gray-200 tabular-nums">
                            ${(booking.servicePriceCents / 100).toFixed(2)}
                          </span>
                        </div>
                      )}
                    {booking.addonDetails?.map(a => (
                      <div
                        key={a.id}
                        className="flex justify-between items-baseline gap-3"
                      >
                        <span className="text-gray-300">{a.name}</span>
                        <span className="text-gray-200 tabular-nums">
                          +${(a.priceCents / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-baseline gap-3 pt-2 mt-2 border-t border-white/[0.06]">
                      <span className="font-medium text-white">Total</span>
                      <span className="font-semibold text-white tabular-nums">
                        $
                        {(
                          ((booking.servicePriceCents ?? 0) +
                            (booking.addonDetails ?? []).reduce(
                              (s, a) => s + a.priceCents,
                              0
                            )) /
                          100
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Payment */}
          {showPaymentSection && payment && paymentDetailVariant && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-3">
                Payment
              </h3>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-2.5">
                {paymentDetailVariant === 'pay_in_person' && (
                  <>
                    <p className="text-sm font-semibold text-white">
                      Pay in person
                    </p>
                    {payment.totalAmountCents > 0 ? (
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-gray-300">Amount due</span>
                        <span className="font-semibold text-white tabular-nums">
                          {formatCurrencyAmount(
                            payment.remainingAmountCents,
                            payment.currency
                          )}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">
                        No amount due for this appointment.
                      </p>
                    )}
                  </>
                )}

                {paymentDetailVariant === 'deposit' && (
                  <>
                    <p className="text-sm font-semibold text-white">
                      Deposit paid
                    </p>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-gray-300">Amount paid</span>
                      <span className="font-semibold text-emerald-300 tabular-nums">
                        {formatCurrencyAmount(
                          payment.paidOnlineAmountCents,
                          payment.currency
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-gray-300">Amount due</span>
                      <span className="font-semibold text-white tabular-nums">
                        {formatCurrencyAmount(
                          payment.remainingAmountCents,
                          payment.currency
                        )}
                      </span>
                    </div>
                  </>
                )}

                {paymentDetailVariant === 'paid_full' && (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <CheckCircleSolidIcon
                        className="h-5 w-5 shrink-0 text-emerald-400"
                        aria-hidden
                      />
                      <span className="text-sm font-semibold text-white">
                        Paid
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-emerald-300 tabular-nums">
                      {formatCurrencyAmount(
                        payment.paidOnlineAmountCents,
                        payment.currency
                      )}
                    </span>
                  </div>
                )}

                {paymentDetailVariant === 'other' && (
                  <p className="text-sm text-gray-400 leading-snug">
                    No card payment through the app for this booking.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Customer */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-3 flex items-center gap-2">
              <UserCircleIcon className="h-4 w-4" />
              Customer
            </h3>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-2">
              <p className="font-semibold text-white">{booking.customerName}</p>
              <a
                href={telHref}
                aria-label="Call customer"
                className="flex items-center gap-2 text-blue-300 hover:text-blue-100 transition-colors hover:bg-blue-500/10"
              >
                <PhoneIcon className="h-4 w-4" />
                {phoneFormatted}
              </a>
              <a
                href={`mailto:${booking.customerEmail}`}
                aria-label="Email customer"
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors hover:bg-white/[0.06]"
              >
                <EnvelopeIcon className="h-4 w-4" />
                {booking.customerEmail}
              </a>
            </div>
          </section>

          {/* Location */}
          <section>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-xs font-semibold text-gray-500 tracking-wider flex items-center gap-2">
                <MapPinIcon className="h-4 w-4" />
                Location
              </h3>

              {navigationUrl && (
                <a
                  href={navigationUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Navigate to booking location"
                  className="inline-flex items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/[0.06] text-blue-300 hover:text-blue-100 hover:border-blue-500/60 hover:bg-blue-500/10 transition-colors w-10 h-10"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 text-blue-400" />
                </a>
              )}
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <p className="text-gray-300 whitespace-pre-line">{fullAddress}</p>
            </div>
          </section>

          {/* Vehicle */}
          {formatVehicle(booking) && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-3">
                Vehicle
              </h3>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <p className="text-gray-300 whitespace-pre-line">
                  {formatVehicle(booking)}
                </p>
              </div>
            </section>
          )}

          {/* Notes */}
          {booking.notes.trim() && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-3">
                Notes
              </h3>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <p className="text-gray-300 whitespace-pre-line">
                  {booking.notes}
                </p>
              </div>
            </section>
          )}

          {/* Actions – control panel (confirmed only) */}
          {isConfirmed && (
            <section className="pt-2">
              <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-2">
                Actions
              </h3>
              {updateError && (
                <p className="text-sm text-rose-400 mb-2.5" role="alert">
                  {updateError}
                </p>
              )}
              <div
                className="grid w-full grid-cols-3 gap-1.5 sm:gap-2"
                role="group"
                aria-label="Booking actions"
                aria-busy={isUpdating}
              >
                <button
                  type="button"
                  disabled={isUpdating || isRescheduling}
                  onClick={() => setShowRescheduleModal(true)}
                  className={bookingActionTileClass}
                >
                  <ArrowPathIcon
                    className="h-5 w-5 shrink-0 text-gray-500 group-hover:text-gray-300 sm:h-[22px] sm:w-[22px]"
                    aria-hidden
                  />
                  <span className="max-w-full text-center text-[11px] font-semibold leading-snug text-inherit sm:text-xs">
                    Reschedule
                  </span>
                </button>
                <button
                  type="button"
                  disabled={isUpdating || isRescheduling}
                  onClick={handleCancelClick}
                  aria-label="Cancel booking"
                  className={bookingActionTileClass}
                >
                  <XCircleIcon
                    className="h-5 w-5 shrink-0 text-rose-500 group-hover:text-rose-400 sm:h-[22px] sm:w-[22px]"
                    aria-hidden
                  />
                  <span className="max-w-full text-center text-[11px] font-semibold leading-snug text-inherit sm:text-xs">
                    Cancel
                  </span>
                </button>
                <button
                  type="button"
                  disabled={isUpdating || isRescheduling}
                  onClick={handleMarkCompletedClick}
                  aria-label="Mark booking as completed"
                  className={bookingActionTileClass}
                >
                  <CheckCircleIcon
                    className="h-5 w-5 shrink-0 text-emerald-500 group-hover:text-emerald-400 sm:h-[22px] sm:w-[22px]"
                    aria-hidden
                  />
                  <span className="max-w-full text-center text-[11px] font-semibold leading-snug text-inherit sm:text-xs">
                    Complete
                  </span>
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      <Modal
        isOpen={showRescheduleModal}
        onClose={closeRescheduleModal}
        title="Reschedule appointment"
        maxWidth="xl"
        uniformHorizontalPadding16
        titleClassName="font-bold"
        contentClassName="scrollbar-hide !pt-4 sm:!pt-5 !pb-4 sm:!pb-5"
      >
        {rescheduleSuccess ? (
          <>
            <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-4 backdrop-blur-sm sm:rounded-2xl sm:px-5 sm:py-5">
              <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:gap-4 sm:text-left">
                <CheckCircleSolidIcon
                  className="h-11 w-11 shrink-0 text-emerald-400"
                  aria-hidden
                />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-base font-semibold text-white">
                    Appointment updated
                  </p>
                  <p className="text-sm font-medium text-gray-200">
                    {booking.serviceName}
                  </p>
                  <p className="text-sm leading-relaxed text-gray-400">
                    {new Date(booking.date + 'T12:00:00').toLocaleDateString(
                      'en-US',
                      {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      }
                    )}
                    <span className="text-gray-600"> · </span>
                    {booking.time}
                    <span className="text-gray-600"> · </span>
                    {formatDurationMinutes(booking.serviceDurationMinutes)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end border-t border-white/[0.06] pt-6">
              <Button
                type="button"
                variant="inverse"
                fullWidth
                className="sm:w-auto sm:min-w-[10rem]"
                onClick={closeRescheduleModal}
              >
                Done
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-400">Pick a new date and time.</p>

            {rescheduleError ? (
              <p className="mt-3 text-sm text-rose-400" role="alert">
                {rescheduleError}
              </p>
            ) : null}

            <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 sm:rounded-2xl sm:px-4 sm:py-3.5">
              <p className="text-sm font-medium text-white">
                {booking.serviceName}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {new Date(booking.date + 'T12:00:00').toLocaleDateString(
                  'en-US',
                  {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }
                )}{' '}
                · {booking.time} ·{' '}
                {formatDurationMinutes(booking.serviceDurationMinutes)}
              </p>
            </div>

            <div className="mt-5 space-y-6 sm:mt-6 lg:mt-6">
              <div className="lg:grid lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start lg:gap-8">
                <div className="min-w-0">
                  <DateSelector
                    weeklySchedule={weeklySchedule}
                    serviceDurationMinutes={booking.serviceDurationMinutes}
                    existingBookings={existingBookingsForSlotGrid}
                    timeOffBlocks={timeOffBlocks}
                    selectedDate={selectedDate}
                    onSelectDate={date => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                    }}
                  />
                </div>
                <div className="min-w-0 pt-6 lg:pt-0">
                  <TimeSlotGrid
                    selectedDate={selectedDate}
                    serviceDurationMinutes={booking.serviceDurationMinutes}
                    weeklySchedule={weeklySchedule}
                    existingBookings={existingBookingsForSlotGrid}
                    timeOffBlocks={timeOffBlocks}
                    selectedTime={selectedTime}
                    onSelectTime={setSelectedTime}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-white/[0.06] pt-6 sm:flex-row sm:justify-end sm:gap-3 lg:mt-7">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                className="sm:w-auto sm:min-w-[7rem]"
                disabled={isRescheduling}
                onClick={closeRescheduleModal}
              >
                Close
              </Button>
              <Button
                type="button"
                variant="inverse"
                fullWidth
                className="sm:w-auto sm:min-w-[10rem] min-h-[48px]"
                disabled={isRescheduling || !onReschedule}
                loading={isRescheduling}
                onClick={() => void handleRescheduleSave()}
                aria-label={
                  isRescheduling ? 'Updating appointment' : 'Save new time'
                }
              >
                {isRescheduling ? 'Updating' : 'Save new time'}
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Cancel confirmation dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-xl"
            role="alertdialog"
            aria-labelledby="cancel-dialog-title"
            aria-describedby="cancel-dialog-desc"
          >
            <h3
              id="cancel-dialog-title"
              className="text-lg font-bold text-white mb-2"
            >
              Cancel booking?
            </h3>
            <p id="cancel-dialog-desc" className="text-gray-400 text-sm mb-6">
              This will mark the booking as cancelled.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                disabled={isUpdating}
                onClick={() => setShowCancelConfirm(false)}
              >
                Keep
              </Button>
              <Button
                variant="danger"
                fullWidth
                disabled={isUpdating}
                onClick={handleCancelConfirm}
              >
                {isUpdating ? 'Cancelling…' : 'Cancel booking'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
