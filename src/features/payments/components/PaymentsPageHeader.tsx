import React from 'react';

export const PaymentsPageHeader: React.FC = () => {
  return (
    <div className="mb-6 sm:mb-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
        Payments
      </h1>
      <p className="text-gray-400 text-sm sm:text-base mt-1">
        Balances, deposits, and payout activity powered by Stripe.
      </p>
    </div>
  );
};
