'use client';

import { Button } from '@/components/shared';
import { getBusinessBookPath } from '@/constants/routes';
import { useOwnerTestGuidePhase } from '@/features/onboarding-v3/ownerTestGuide';
import { readBookingFlowLocaleFromDocument } from '@/libs/bookingFlowLocale';
import { CalendarIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import React from 'react';

interface BookingRequestButtonProps {
  businessName: string;
  businessId?: string;
  businessSlug?: string;
}

export const BookingRequestButton: React.FC<BookingRequestButtonProps> = ({
  businessSlug,
}) => {
  const router = useRouter();
  const guided = useOwnerTestGuidePhase() === 'public';

  const handleClick = () => {
    if (businessSlug) {
      const lang = readBookingFlowLocaleFromDocument() ?? 'en';
      const path = getBusinessBookPath(businessSlug, { lang });
      router.push(
        guided ? `${path}${path.includes('?') ? '&' : '?'}guide=1` : path
      );
    }
  };

  return (
    <div
      className="min-w-0 flex-[3]"
      data-owner-test-guide={guided ? 'step' : undefined}
      data-owner-test-copy={
        guided
          ? 'Tap Request Booking. This is what your customer sees.'
          : undefined
      }
    >
      <Button
        onClick={handleClick}
        variant="inverse"
        className="w-full py-3.5 !font-black text-base tracking-tight "
        icon={<CalendarIcon className="h-5 w-5" />}
        iconPosition="left"
      >
        Request Booking
      </Button>
    </div>
  );
};
