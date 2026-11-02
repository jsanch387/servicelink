'use client';

import { EchoBarsLoader } from '@/components/shared/EchoBarsLoader';
import { AuthScreenLayout } from '@/features/auth/components/AuthScreenLayout';
import React, { useEffect, useState } from 'react';

const JOINING_MESSAGES = [
  'Adding you to the team',
  'Getting your access ready',
] as const;

const JOINING_MESSAGE_MS = 2200;

export function TeamInviteJoiningState() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setMessageIndex(i => (i + 1) % JOINING_MESSAGES.length);
    }, JOINING_MESSAGE_MS);
    return () => window.clearInterval(id);
  }, []);

  const message = JOINING_MESSAGES[messageIndex];

  return (
    <AuthScreenLayout title="Joining the team" footer={null}>
      <div
        className="flex flex-col items-center py-6 text-center sm:py-8"
        aria-busy
        aria-live="polite"
      >
        <div className="mb-5 flex h-16 items-end justify-center">
          <EchoBarsLoader
            size="large"
            color="#a3a3a3"
            accessibilityLabel="Joining the team"
          />
        </div>
        <p
          key={message}
          className="max-w-xs text-sm font-medium leading-relaxed text-zinc-300 animate-in fade-in duration-500"
        >
          {message}
        </p>
      </div>
    </AuthScreenLayout>
  );
}
