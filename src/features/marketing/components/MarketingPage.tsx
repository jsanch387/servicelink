'use client';

import React from 'react';

export const MarketingPage: React.FC = () => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Marketing</h1>
            <p className="mt-2 text-gray-400">
              Manage promotions, sales, and discount codes for your business
            </p>
          </div>

          <div className="rounded-lg border border-[var(--dashboard-border)] bg-[var(--dashboard-card)] p-8 text-center">
            <div className="mx-auto max-w-md">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-emerald-500/10 p-4">
                  <svg
                    className="h-12 w-12 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-white">
                Marketing Tools Coming Soon
              </h2>
              <p className="text-gray-400">
                Create promotional codes, run sales campaigns, and offer
                discounts to attract and retain customers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
