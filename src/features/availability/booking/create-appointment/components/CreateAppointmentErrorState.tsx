'use client';

import { Button } from '@/components/shared';
import React from 'react';

export interface CreateAppointmentErrorStateProps {
  message?: string;
  onTryAgain?: () => void;
}

export function CreateAppointmentErrorState({
  message = 'Could not create the appointment. Please try again.',
  onTryAgain,
}: CreateAppointmentErrorStateProps) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-4 text-center animate-in fade-in duration-300">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-400/25">
        <span className="text-2xl font-semibold text-red-300" aria-hidden>
          !
        </span>
      </div>
      <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
        {message}
      </p>
      {onTryAgain ? (
        <Button
          type="button"
          variant="primary"
          onClick={onTryAgain}
          className="mt-8 min-w-[160px] cursor-pointer"
        >
          Try again
        </Button>
      ) : null}
    </div>
  );
}
