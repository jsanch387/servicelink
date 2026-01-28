'use client';

import { Button } from '@/components/shared';
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

  const handleClick = () => {
    if (businessSlug) {
      router.push(`/${businessSlug}/book`);
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant="primary"
      className="flex-[3] py-3.5 !font-black text-base tracking-tight "
      icon={<CalendarIcon className="h-5 w-5" />}
      iconPosition="left"
    >
      Request Booking
    </Button>
  );
};
