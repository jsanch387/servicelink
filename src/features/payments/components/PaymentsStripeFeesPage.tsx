import { GlassCard } from '@/components/shared';
import React from 'react';
import { PaymentsPageHeader } from './PaymentsPageHeader';
import { PaymentsStripeFeeNote } from './PaymentsStripeFeeNote';

export function PaymentsStripeFeesPage() {
  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-3xl mx-auto w-full min-w-0">
        <PaymentsPageHeader />
        <GlassCard padding="none" rounded="rounded-2xl" className="p-4 sm:p-6">
          <PaymentsStripeFeeNote />
        </GlassCard>
      </div>
    </main>
  );
}
