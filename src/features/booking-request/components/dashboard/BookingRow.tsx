'use client';

import { GlassCard } from '@/components/shared';
import { BookingRequest } from '@/features/booking-request/types/bookingRequest';
import {
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  PhoneIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

interface BookingRowProps {
  booking: BookingRequest;
  // eslint-disable-next-line no-unused-vars
  onAction?: (_id: string, _action: 'approved' | 'declined') => void;
  isUpdating?: boolean;
}

export function BookingRow({
  booking,
  onAction,
  isUpdating = false,
}: BookingRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Format short date (e.g., "Oct 12")
  const formatShortDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Format time window
  const formatTimeWindow = (window: string) => {
    return window.charAt(0).toUpperCase() + window.slice(1);
  };

  // Format price
  const formatPrice = (cents: number | null) => {
    if (!cents || cents === 0) return 'Contact for quote';
    return `$${(cents / 100).toFixed(0)}`;
  };

  // Get clean phone number for tel: and sms: links
  const getCleanPhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, '');
  };

  // Status dot colors
  const statusDotColors = {
    pending: 'bg-orange-500',
    approved: 'bg-emerald-500',
    declined: 'bg-rose-500',
    cancelled: 'bg-zinc-500',
  };

  // Get blur color based on status
  const statusBlurColor =
    booking.status === 'pending'
      ? 'bg-orange-500'
      : booking.status === 'approved'
        ? 'bg-emerald-500'
        : booking.status === 'declined'
          ? 'bg-rose-500'
          : 'bg-zinc-500';

  const handleAction = (action: 'approved' | 'declined') => {
    if (onAction) {
      onAction(booking.id, action);
    }
  };

  const cleanPhone = getCleanPhoneNumber(booking.customer_phone);
  const phoneLink = cleanPhone ? `tel:${cleanPhone}` : '#';
  const smsLink = cleanPhone ? `sms:${cleanPhone}` : '#';

  return (
    <GlassCard
      blurColor={statusBlurColor}
      rounded="rounded-2xl"
      className={`mb-3 transition-all duration-300 ${
        isExpanded
          ? 'bg-white/[0.04] border-white/[0.1] shadow-2xl'
          : 'bg-white/[0.02] border-white/[0.06]'
      }`}
      padding="none"
    >
      {/* Primary Row - Always Visible */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 lg:p-6 cursor-pointer flex items-center gap-3 sm:gap-4"
      >
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-bold text-base sm:text-lg truncate">
              {booking.customer_name}
            </h3>
            <div
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                statusDotColors[
                  booking.status as keyof typeof statusDotColors
                ] || statusDotColors.pending
              }`}
            />
          </div>
          <p className="text-zinc-500 text-xs sm:text-sm font-medium truncate">
            {booking.service_name} • {formatPrice(booking.service_price_cents)}
          </p>
        </div>

        {/* Right: Date/Time */}
        <div className="text-right shrink-0">
          <p className="text-white font-bold text-xs sm:text-sm">
            {formatShortDate(booking.preferred_date)}
          </p>
          <p className="text-zinc-500 text-[10px] sm:text-xs font-black uppercase tracking-widest">
            {formatTimeWindow(booking.preferred_time_window)}
          </p>
        </div>

        {/* Chevron */}
        <ChevronRightIcon
          className={`w-5 h-5 sm:w-6 sm:h-6 text-zinc-500 transition-transform duration-300 shrink-0 ${
            isExpanded ? 'rotate-90 text-zinc-300' : ''
          }`}
        />
      </div>

      {/* Expanded Content - Action Center */}
      {isExpanded && (
        <div className="px-4 sm:px-5 lg:px-6 pb-5 sm:pb-6">
          {/* Message Block - Commented out for now, might need later */}
          {/* {booking.message && (
            <div className="bg-white/[0.05] rounded-2xl p-4 sm:p-5 mb-5 sm:mb-6">
              <div className="flex items-center gap-2 mb-2 opacity-50">
                <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-400">
                  Client Instructions
                </span>
              </div>
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed break-words">
                {booking.message}
              </p>
            </div>
          )} */}

          <div className="space-y-3 sm:space-y-4">
            {/* Primary Action Group */}
            <div className="flex flex-col gap-2 sm:gap-3">
              {booking.status !== 'approved' && (
                <button
                  onClick={() => handleAction('approved')}
                  disabled={isUpdating}
                  className="w-full h-14 sm:h-16 bg-white text-black rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer touch-manipulation"
                >
                  <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>
                    {isUpdating ? 'Updating...' : 'Confirm Appointment'}
                  </span>
                </button>
              )}

              {/* Call & Text Buttons */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <a
                  href={phoneLink}
                  className="h-14 sm:h-16 flex items-center justify-center gap-2 rounded-2xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] text-zinc-300 text-[10px] sm:text-xs font-black uppercase tracking-widest active:scale-95 transition-all touch-manipulation"
                >
                  <PhoneIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  <span>Call</span>
                </a>
                <a
                  href={smsLink}
                  className="h-14 sm:h-16 flex items-center justify-center gap-2 rounded-2xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] text-zinc-300 text-[10px] sm:text-xs font-black uppercase tracking-widest active:scale-95 transition-all touch-manipulation"
                >
                  <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  <span>Text</span>
                </a>
              </div>
            </div>

            {/* Negative Action Group */}
            {booking.status !== 'cancelled' &&
              booking.status !== 'declined' && (
                <div className="pt-2 sm:pt-3 border-t border-white/[0.05]">
                  <button
                    onClick={() => handleAction('declined')}
                    disabled={isUpdating}
                    className="w-full py-3 sm:py-3.5 flex items-center justify-center gap-2 text-zinc-500 hover:text-rose-500 transition-colors text-[10px] sm:text-xs font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer touch-manipulation"
                  >
                    <XCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>
                      {isUpdating ? 'Updating...' : 'Decline Request'}
                    </span>
                  </button>
                </div>
              )}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
