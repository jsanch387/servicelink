'use client';

import { CalendarIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import React from 'react';

interface ServiceBookingCTAProps {
  serviceId: string;
  businessSlug: string;
  /** Optional label for the button (e.g. service name) */
  serviceName?: string;
  variant?: 'button' | 'link';
  className?: string;
}

export const ServiceBookingCTA: React.FC<ServiceBookingCTAProps> = ({
  serviceId,
  businessSlug,
  variant = 'button',
  className = '',
}) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/${businessSlug}/book?serviceId=${serviceId}`);
  };

  if (variant === 'link') {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-2 text-white hover:text-gray-200 font-semibold text-sm transition-colors ${className}`}
      >
        <CalendarIcon className="h-4 w-4" />
        Book Now
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-100 text-black font-bold rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${className}`}
    >
      <CalendarIcon className="h-5 w-5" />
      Book This Service
    </button>
  );
};
