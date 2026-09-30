import { PaymentsProTeaserBanner } from '@/features/payments/free-payment-preview';
import React from 'react';

export const InvoicesNotProGate: React.FC = () => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold leading-none text-white">
              Invoices
            </h1>
            <p className="mt-1 text-gray-400">
              Create and send invoices to your customers.
            </p>
          </header>
          <PaymentsProTeaserBanner
            title="Invoices are a Pro feature"
            description="Create a bill, send it by email or text, and get paid from the same link."
          />
        </div>
      </div>
    </div>
  );
};
