'use client';

import { Button } from '@/components/shared';
import type { WeeklySchedule } from '@/features/availability/types/availability';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  CheckCircleIcon,
  MapPinIcon,
  TrashIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';
import type { ExistingBooking, TimeOffInterval } from '../types';
import { formatDurationMinutes } from '../utils/formatDuration';
import { BookingDetailCustomerSection } from './BookingDetailCustomerSection';
import { BookingDetailServiceSection } from './BookingDetailServiceSection';
import {
  CompleteAppointmentModal,
  type CompleteAppointmentConfirmArgs,
} from './CompleteAppointmentModal';
import { RescheduleAppointmentModal } from './RescheduleAppointmentModal';
import type { AvailabilityBookingDisplay } from './types';

interface AvailabilityBookingDetailPanelProps {
  booking: AvailabilityBookingDisplay;
  onClose: () => void;
  onMarkCompleted: (
    id: string,
    args?: CompleteAppointmentConfirmArgs
  ) => void | Promise<void>;
  onCancel: (id: string) => void;
  /** Permanently remove the booking (any status). */
  onDelete: (id: string) => void | Promise<void>;
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
  onDelete,
  onReschedule,
  isUpdating = false,
  isRescheduling = false,
  updateError = null,
  weeklySchedule,
  timeOffBlocks,
  existingBookingsForSlotGrid,
}: AvailabilityBookingDetailPanelProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  const closeRescheduleModal = () => {
    setShowRescheduleModal(false);
  };

  const fullAddress = formatFullAddress(booking.address);
  const isConfirmed = booking.status === 'confirmed';
  const isCancelled = booking.status === 'cancelled';
  const payment = booking.payment ?? null;
  const showPaymentSection = Boolean(payment);
  const jobs = booking.jobs ?? [];
  const topLevelVehicle = formatVehicle(booking);
  // Per-job vehicles live on job_details; only fall back to booking-level columns
  // for legacy rows without jobs.
  const showTopLevelVehicle = jobs.length === 0 && Boolean(topLevelVehicle);

  const paymentDetailVariant = payment
    ? (() => {
        const paid = payment.paidOnlineAmountCents;
        const rem = payment.remainingAmountCents;
        const method = payment.paymentMethodSelected?.trim().toLowerCase();
        // Membership / subscription visit — covered by plan.
        if (method === 'membership') {
          return 'membership' as const;
        }
        // Owner-created (`none`) and customer pay-in-person: collect offline.
        // $0 with none/pay_in_person is usually a free or legacy membership row.
        if (
          (method === 'pay_in_person' || method === 'none') &&
          paid <= 0 &&
          payment.totalAmountCents <= 0 &&
          rem <= 0
        ) {
          return 'no_charge' as const;
        }
        if ((method === 'pay_in_person' || method === 'none') && paid <= 0) {
          return 'collect_offline' as const;
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

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    // Keep dialog open with pending UI until parent finishes (closes panel on
    // success, or leaves dialog up with isUpdating false on failure).
    void onDelete(booking.id);
  };

  const closeDeleteConfirm = () => {
    if (isUpdating) return;
    setShowDeleteConfirm(false);
  };

  const closeCompleteConfirm = () => {
    if (isUpdating) return;
    setShowCompleteConfirm(false);
  };

  const handleMarkCompletedClick = () => {
    setShowCompleteConfirm(true);
  };

  const handleCompleteConfirm = (args: CompleteAppointmentConfirmArgs) => {
    void onMarkCompleted(booking.id, args);
    // Panel closes when parent's handleMarkCompleted succeeds (setSelectedBooking(null))
  };

  const handleRescheduleSave = (
    scheduledDate: string,
    startTime: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!onReschedule) {
      return Promise.resolve({
        success: false,
        error: 'Reschedule unavailable.',
      });
    }
    return onReschedule(booking.id, scheduledDate, startTime);
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
        className="fixed inset-0 z-50 flex min-h-0 min-w-0 flex-col overscroll-none bg-[#0f0f0f] animate-in slide-in-from-right duration-200 md:inset-y-0 md:left-auto md:right-0 md:w-full md:max-w-lg md:border-l md:border-white/5 md:shadow-2xl"
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

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain scrollbar-dark p-4 sm:p-5 [-webkit-overflow-scrolling:touch]">
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

          {/* Schedule — when only */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-3 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Schedule
            </h3>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <p className="font-semibold text-white leading-snug">
                {new Date(booking.date + 'T12:00:00').toLocaleDateString(
                  'en-US',
                  {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }
                )}
              </p>
              <p className="mt-1 text-sm text-gray-300">
                {booking.time}
                <span className="text-gray-600" aria-hidden>
                  {' '}
                  ·{' '}
                </span>
                <span className="text-gray-400 tabular-nums">
                  {formatDurationMinutes(booking.serviceDurationMinutes)}
                </span>
              </p>
            </div>
          </section>

          {/* Service — what + pricing (multi-job when job_details present) */}
          <BookingDetailServiceSection booking={booking} />

          {/* Payment */}
          {showPaymentSection && payment && paymentDetailVariant && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-3">
                Payment
              </h3>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-2.5">
                {paymentDetailVariant === 'membership' && (
                  <p className="text-sm font-semibold text-white">
                    Subscription
                  </p>
                )}

                {paymentDetailVariant === 'no_charge' && (
                  <>
                    <p className="text-sm font-semibold text-white">
                      No charge
                    </p>
                    <p className="text-xs text-gray-400">
                      Nothing to collect for this appointment.
                    </p>
                  </>
                )}

                {paymentDetailVariant === 'collect_offline' && (
                  <>
                    <p className="text-sm font-semibold text-white">
                      Collect in person
                    </p>
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

          <BookingDetailCustomerSection
            customerName={booking.customerName}
            customerPhone={booking.customerPhone ?? ''}
            customerEmail={booking.customerEmail ?? ''}
            isMembershipVisit={paymentDetailVariant === 'membership'}
          />

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

          {/* Vehicle — legacy single-job rows only; multi-job vehicles sit under each service */}
          {showTopLevelVehicle && topLevelVehicle ? (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-3">
                Vehicle
              </h3>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <p className="text-gray-300 whitespace-pre-line">
                  {topLevelVehicle}
                </p>
              </div>
            </section>
          ) : null}

          {/* Notes */}
          {(booking.notes ?? '').trim() && (
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

          {/* Actions – confirmed: full set; completed/cancelled: delete only */}
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
              className={
                isConfirmed
                  ? 'grid w-full grid-cols-2 gap-1.5 sm:gap-2'
                  : 'grid w-full grid-cols-1 gap-1.5 sm:gap-2'
              }
              role="group"
              aria-label="Booking actions"
              aria-busy={isUpdating}
            >
              {isConfirmed ? (
                <>
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
                </>
              ) : null}
              <button
                type="button"
                disabled={isUpdating || isRescheduling}
                onClick={handleDeleteClick}
                aria-label="Delete booking"
                className={bookingActionTileClass}
              >
                <TrashIcon
                  className="h-5 w-5 shrink-0 text-rose-500 group-hover:text-rose-400 sm:h-[22px] sm:w-[22px]"
                  aria-hidden
                />
                <span className="max-w-full text-center text-[11px] font-semibold leading-snug text-inherit sm:text-xs">
                  Delete
                </span>
              </button>
            </div>
          </section>
        </div>
      </div>

      <RescheduleAppointmentModal
        isOpen={showRescheduleModal}
        booking={booking}
        weeklySchedule={weeklySchedule}
        timeOffBlocks={timeOffBlocks}
        existingBookingsForSlotGrid={existingBookingsForSlotGrid}
        isRescheduling={isRescheduling}
        onClose={closeRescheduleModal}
        onSave={handleRescheduleSave}
      />

      <CompleteAppointmentModal
        isOpen={showCompleteConfirm}
        booking={booking}
        isUpdating={isUpdating}
        error={showCompleteConfirm ? updateError : null}
        onClose={closeCompleteConfirm}
        onConfirm={handleCompleteConfirm}
      />

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

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-xl"
            role="alertdialog"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-desc"
            aria-busy={isUpdating}
          >
            <h3
              id="delete-dialog-title"
              className="text-lg font-bold text-white mb-2"
            >
              Delete booking?
            </h3>
            <p id="delete-dialog-desc" className="text-gray-400 text-sm mb-4">
              This permanently removes the appointment from your schedule. It
              cannot be undone.
            </p>
            {updateError ? (
              <p className="mb-4 text-sm text-rose-400" role="alert">
                {updateError}
              </p>
            ) : null}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                disabled={isUpdating}
                onClick={closeDeleteConfirm}
              >
                Keep
              </Button>
              <Button
                variant="danger"
                fullWidth
                disabled={isUpdating}
                loading={isUpdating}
                onClick={handleDeleteConfirm}
                aria-label={isUpdating ? 'Deleting booking' : 'Delete booking'}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
