'use client';

import { ROUTES } from '@/constants/routes';
import { ProFeatureLabel } from '@/features/dashboard';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';
import {
  FREE_PAYMENTS_UPSELL_DESCRIPTION_TRANSACTIONS,
  FREE_PAYMENTS_UPSELL_TITLE,
  FreePaymentTransactionsLockedPreview,
  PaymentsProTeaserBanner,
} from '../free-payment-preview';
import { PaymentsRecentTransactions } from './PaymentsRecentTransactions';

export interface PaymentsTransactionsPageProps {
  hasProAccess: boolean;
}

export const PaymentsTransactionsPage: React.FC<
  PaymentsTransactionsPageProps
> = ({ hasProAccess }) => {
  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-6xl mx-auto w-full min-w-0">
        <Link
          href={ROUTES.DASHBOARD.PAYMENTS}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden />
          Payments
        </Link>

        {!hasProAccess ? (
          <PaymentsProTeaserBanner
            className="mb-6 sm:mb-8"
            title={FREE_PAYMENTS_UPSELL_TITLE}
            description={FREE_PAYMENTS_UPSELL_DESCRIPTION_TRANSACTIONS}
          />
        ) : null}

        <header className="mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Recent transactions
            </h1>
            {!hasProAccess ? <ProFeatureLabel /> : null}
          </div>
          {hasProAccess ? (
            <p className="mt-1 text-sm text-gray-500">
              Review charges, deposits, and refunds.
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-500">
              Charges, deposits, and refunds in one view.
            </p>
          )}
        </header>

        {hasProAccess ? (
          <div>
            <PaymentsRecentTransactions hideHeading noSectionTopMargin />
          </div>
        ) : (
          <FreePaymentTransactionsLockedPreview />
        )}
      </div>
    </main>
  );
};
