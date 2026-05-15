import { EmailConfirmedScreen } from '@/features/auth/components/EmailConfirmedScreen';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Email confirmed - ServiceLink',
  description: 'Your ServiceLink account email is confirmed.',
  robots: {
    index: false,
    follow: false,
  },
};

function EmailConfirmedFallback() {
  return (
    <div className="min-h-[100dvh] bg-neutral-900 flex items-center justify-center px-4">
      <p className="text-sm text-zinc-400">Loading…</p>
    </div>
  );
}

export default function EmailConfirmedPage() {
  return (
    <Suspense fallback={<EmailConfirmedFallback />}>
      <EmailConfirmedScreen />
    </Suspense>
  );
}
