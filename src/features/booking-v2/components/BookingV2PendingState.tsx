'use client';

import { EchoBarsLoader } from '@/components/shared/EchoBarsLoader';

/** Full-screen wait while an appointment is submitted or requested. */
export function BookingV2PendingState({ message }: { message: string }) {
  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-[#0F0F0F] px-6 text-center"
      aria-busy
      aria-live="polite"
    >
      <EchoBarsLoader size="xl" color="#a3a3a3" accessibilityLabel={message} />
      <p className="mt-6 max-w-[280px] text-[15px] leading-6 text-[#A3A3A3]">
        {message}
      </p>
    </div>
  );
}
