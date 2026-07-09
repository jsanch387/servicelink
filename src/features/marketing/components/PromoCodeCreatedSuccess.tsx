'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import {
  CheckCircleIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useState } from 'react';
import type { PromoCode } from '../types';
import { formatPromoDiscount } from '../utils/formatPromoDiscount';

interface PromoCodeCreatedSuccessProps {
  promoCode: PromoCode;
  onCreateAnother: () => void;
}

export const PromoCodeCreatedSuccess: React.FC<PromoCodeCreatedSuccessProps> = ({
  promoCode,
  onCreateAnother,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promoCode.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

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
        Code created
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-400">
        Share this code with your customers so they can use it at checkout.
      </p>

      <div className="mt-8 w-full max-w-md sm:max-w-lg rounded-2xl border border-white/10 bg-white/[0.04] p-6 lg:max-w-xl">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Your promo code
        </p>
        <p className="mt-2 font-mono text-3xl font-bold tracking-wide text-white">
          {promoCode.code}
        </p>
        <p className="mt-1 text-sm font-medium text-emerald-400">
          {formatPromoDiscount(
            promoCode.discountType,
            promoCode.discountValue
          )}
        </p>
        <Button
          onClick={() => void handleCopy()}
          variant="secondary"
          size="sm"
          fullWidth
          className="mt-5"
          icon={<ClipboardDocumentIcon className="h-4 w-4" />}
        >
          {copied ? 'Copied!' : 'Copy code'}
        </Button>
      </div>

      <p className="mt-6 text-sm text-gray-500">
        {promoCode.isActive
          ? 'This code is live and ready to use.'
          : 'Turn it on from Marketing when you are ready.'}
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
        View all promo codes
      </Link>
    </div>
  );
};
