'use client';

import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/shared';
import React from 'react';

interface BookingRequestSuccessProps {
  businessName: string;
  onDone: () => void;
}

export const BookingRequestSuccess: React.FC<BookingRequestSuccessProps> = ({
  businessName,
  onDone,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-in fade-in duration-300">
      {/* Card Container */}
      <div className="w-full max-w-md bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl p-8 sm:p-10 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          {/* Green Checkmark */}
          <div className="mb-6">
            <div className="bg-green-500/10 rounded-full p-4">
              <CheckCircleIcon className="h-16 w-16 text-green-500" />
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-4 mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Request Sent!
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Your booking request has been sent to{' '}
              <span className="font-bold text-white">{businessName}</span>. They&apos;ll get back to you soon!
            </p>
          </div>

          {/* Done Button */}
          <Button
            onClick={onDone}
            variant="primary"
            fullWidth
            className="py-3.5 font-black"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
