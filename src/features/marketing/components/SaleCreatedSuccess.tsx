'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';
import type { Sale } from '../types';
import { formatPromoDiscount } from '../utils/formatPromoDiscount';
import { formatSaleDateRange } from '../utils/formatSaleDateRange';

interface SaleCreatedSuccessProps {
  sale: Sale;
  onCreateAnother: () => void;
}

export const SaleCreatedSuccess: React.FC<SaleCreatedSuccessProps> = ({
  sale,
  onCreateAnother,
}) => {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-10 text-center sm:max-w-2xl sm:px-6 sm:py-14 lg:max-w-3xl">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/25">
        <CheckCircleIcon
          className="h-8 w-8 text-emerald-400"
          strokeWidth={1.75}
          aria-hidden
        />
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Sale created
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-400">
        {sale.startsAt && sale.endsAt
          ? 'Customers who book during this period will automatically get the discount. No code needed.'
          : 'Turn this sale on whenever you want the discount to apply. No code needed.'}
      </p>

      <div className="mt-8 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:max-w-lg lg:max-w-xl">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Your sale
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
          {sale.name}
        </p>
        <p className="mt-1 text-sm font-medium text-emerald-400">
          {formatPromoDiscount(sale.discountType, sale.discountValue)}
        </p>
        <p className="mt-3 text-sm text-gray-300">
          {formatSaleDateRange(sale.startsAt, sale.endsAt)}
        </p>
        <p className="mt-4 text-xs text-gray-500">
          Applies to all your services
        </p>
      </div>

      <p className="mt-6 text-sm text-gray-500">
        {sale.isActive
          ? 'This sale is live — discounts apply automatically at checkout.'
          : 'Turn it on from Marketing when you want it live.'}
      </p>

      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          href={ROUTES.DASHBOARD.MARKETING}
          variant="primary"
          size="md"
          className="sm:min-w-[160px]"
        >
          Back to Marketing
        </Button>
        <Button
          onClick={onCreateAnother}
          variant="outline"
          size="md"
          className="sm:min-w-[160px]"
        >
          Create another
        </Button>
      </div>

      <Link
        href={ROUTES.DASHBOARD.MARKETING}
        className="mt-6 cursor-pointer text-sm text-gray-500 transition-colors hover:text-gray-300"
      >
        View all sales
      </Link>
    </div>
  );
};
