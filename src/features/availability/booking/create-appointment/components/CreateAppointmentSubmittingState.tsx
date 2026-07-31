'use client';

import { EchoBarsLoader } from '@/components/shared/EchoBarsLoader';
import React, { useEffect, useState } from 'react';
import {
  CREATE_APPOINTMENT_SUBMIT_MESSAGES,
  CREATE_APPOINTMENT_SUBMIT_MESSAGE_MS,
} from '../constants/submitStatus';

export function CreateAppointmentSubmittingState() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setMessageIndex(i => (i + 1) % CREATE_APPOINTMENT_SUBMIT_MESSAGES.length);
    }, CREATE_APPOINTMENT_SUBMIT_MESSAGE_MS);
    return () => window.clearInterval(id);
  }, []);

  const message = CREATE_APPOINTMENT_SUBMIT_MESSAGES[messageIndex];

  return (
    <div
      className="flex min-h-[55vh] flex-col items-center justify-center px-4 text-center"
      aria-busy
      aria-live="polite"
    >
      {/* Same slot as success check; bars sit low so they’re closer to the status line */}
      <div className="mb-4 flex h-20 w-20 items-end justify-center pb-1">
        <EchoBarsLoader
          size="large"
          color="#a3a3a3"
          accessibilityLabel="Creating appointment"
        />
      </div>
      <p
        key={message}
        className="max-w-xs text-sm font-medium leading-relaxed text-zinc-300 animate-in fade-in duration-500"
      >
        {message}
      </p>
      {/* Reserve space similar to success title + subtitle + Done button */}
      <div className="mt-2 h-[7.5rem] w-full max-w-sm" aria-hidden />
    </div>
  );
}
