'use client';

import { ROUTES } from '@/constants/routes';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';

export interface PaymentsViewTransactionsLinkProps {
  /** Use inside a teaser stack where outer spacing already applies. */
  noTopMargin?: boolean;
}

export const PaymentsViewTransactionsLink: React.FC<
  PaymentsViewTransactionsLinkProps
> = ({ noTopMargin = false }) => {
  return (
    <Link
      href={ROUTES.DASHBOARD.PAYMENTS_TRANSACTIONS}
      className={`group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 sm:px-5 transition-colors hover:border-white/15 hover:bg-white/[0.04] ${
        noTopMargin ? 'mt-0' : 'mt-8 sm:mt-10'
      }`}
    >
      <span className="text-sm font-semibold text-white">
        Recent transactions
      </span>
      <ChevronRightIcon
        className="h-5 w-5 shrink-0 text-gray-500 transition-colors group-hover:text-gray-300"
        aria-hidden
      />
    </Link>
  );
};
