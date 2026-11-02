import { PaymentsProTeaserBanner } from '@/features/payments/free-payment-preview';
import React from 'react';

export const ExpensesNotProGate: React.FC = () => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold leading-none text-white">
              Expenses
            </h1>
            <p className="mt-1 text-gray-400">
              Add and track what the shop spends.
            </p>
          </header>
          <PaymentsProTeaserBanner
            title="Expenses are a Pro feature"
            description="Record supplies, fuel, and other costs so you can see what the shop spends."
          />
        </div>
      </div>
    </div>
  );
};
