import { BetaBadge } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import React from 'react';

export const SubscriptionsBetaNotice: React.FC = () => {
  return (
    <div className="border-b border-white/[0.06] px-4 py-2.5 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <BetaBadge />
        <p className="text-sm text-zinc-500">
          Subscriptions is in beta.{' '}
          <Link
            href={ROUTES.DASHBOARD.CONTACT}
            className="cursor-pointer text-zinc-400 underline-offset-2 transition-colors hover:text-white hover:underline"
          >
            Suggest an improvement
          </Link>
        </p>
      </div>
    </div>
  );
};
