/* eslint-disable no-unused-vars */
'use client';

import { Button } from '@/components/shared';
import {
  ArrowLeftIcon,
  CalendarIcon,
  EnvelopeIcon,
  MapPinIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { formatDurationMinutes } from '../utils/formatDuration';
import type { AvailabilityBookingDisplay } from './types';

interface AvailabilityBookingDetailPanelProps {
  booking: AvailabilityBookingDisplay;
  onClose: () => void;
  onMarkCompleted: (id: string) => void;
  onCancel: (id: string) => void;
  isUpdating?: boolean;
  updateError?: string | null;
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

export function AvailabilityBookingDetailPanel({
  booking,
  onClose,
  onMarkCompleted,
  onCancel,
  isUpdating = false,
  updateError = null,
}: AvailabilityBookingDetailPanelProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const fullAddress = formatFullAddress(booking.address);
  const phoneFormatted = formatPhoneDisplay(booking.customerPhone);
  const telHref = `tel:${booking.customerPhone.replace(/\D/g, '')}`;
  const isConfirmed = booking.status === 'confirmed';

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

  return (
    <>
      <div
        className="fixed inset-0 z-40 md:bg-black/40 md:backdrop-blur-sm"
        aria-hidden
      />
      <div
        className="fixed inset-0 z-50 md:inset-y-0 md:left-auto md:right-0 md:w-full md:max-w-md md:shadow-2xl bg-[#0f0f0f] border-l border-white/5 flex flex-col animate-in slide-in-from-right duration-200"
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
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
                className="block text-gray-300 hover:text-white transition-colors"
              >
                {phoneFormatted}
              </a>
              <a
                href={`mailto:${booking.customerEmail}`}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <EnvelopeIcon className="h-4 w-4" />
                {booking.customerEmail}
              </a>
            </div>
          </section>

          {/* Location */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-3 flex items-center gap-2">
              <MapPinIcon className="h-4 w-4" />
              Location
            </h3>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <p className="text-gray-300 whitespace-pre-line">{fullAddress}</p>
            </div>
          </section>

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

          {/* Actions – only for confirmed */}
          {isConfirmed && (
            <section className="pt-2">
              {updateError && (
                <p className="text-sm text-rose-400 mb-3" role="alert">
                  {updateError}
                </p>
              )}
              <div className="flex flex-col gap-2">
                <Button
                  variant="inverse"
                  fullWidth
                  className="font-semibold"
                  disabled={isUpdating}
                  onClick={handleMarkCompletedClick}
                >
                  {isUpdating ? 'Saving…' : 'Mark as Completed'}
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  className="font-semibold border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
                  disabled={isUpdating}
                  onClick={handleCancelClick}
                >
                  Cancel Booking
                </Button>
              </div>
            </section>
          )}
        </div>
      </div>

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
