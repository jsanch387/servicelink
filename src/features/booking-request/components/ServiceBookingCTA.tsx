'use client';

import { CalendarIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import React from 'react';

interface ServiceBookingCTAProps {
  serviceName: string;
  businessSlug: string;
  variant?: 'button' | 'link';
  className?: string;
}

export const ServiceBookingCTA: React.FC<ServiceBookingCTAProps> = ({
  serviceName,
  businessSlug,
  variant = 'button',
  className = '',
}) => {
  const router = useRouter();

  const handleClick = () => {
    // Navigate to booking page with service name as query parameter
    router.push(
      `/${businessSlug}/book?service=${encodeURIComponent(serviceName)}`
    );
  };

  if (variant === 'link') {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-2 text-orange-500 hover:text-orange-400 font-semibold text-sm transition-colors ${className}`}
      >
        <CalendarIcon className="h-4 w-4" />
        Book Now
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${className}`}
    >
      <CalendarIcon className="h-5 w-5" />
      Book This Service
    </button>
  );
};
