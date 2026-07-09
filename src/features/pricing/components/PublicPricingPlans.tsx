'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import React, { useState } from 'react';
import {
  PUBLIC_PRICING_FREE_PLAN_FEATURES,
  PUBLIC_PRICING_PRO_PLAN_FEATURES,
} from '../marketingPlanFeatures';
import type { BillingInterval } from '../types';
import { PLANS, PRO_YEARLY_SAVINGS_LABEL } from '../types';
import { getProBillingDisplay } from '../utils/proBillingDisplay';
import { BillingIntervalToggle } from './BillingIntervalToggle';
import { PricingPlanCard } from './PricingPlanCard';

export interface PublicPricingPlansProps {
  className?: string;
}

/**
 * Free + Pro plan cards with monthly/yearly toggle for marketing pages.
 */
export const PublicPricingPlans: React.FC<PublicPricingPlansProps> = ({
  className = '',
}) => {
  const free = PLANS.free;
  const pro = PLANS.pro;
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>('month');
  const proBilling = getProBillingDisplay(billingInterval);

  return (
    <div className={className}>
      <div className="mb-8 flex justify-center sm:mb-10">
        <BillingIntervalToggle
          value={billingInterval}
          onChange={setBillingInterval}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto items-stretch">
        <PricingPlanCard
          variant="free"
          title={free.name}
          description={free.description}
          price={free.price}
          priceSuffix=" forever"
          features={PUBLIC_PRICING_FREE_PLAN_FEATURES}
          emphasizeFeatureHighlights
          footer={
            <Button
              href={ROUTES.AUTH.SIGNUP}
              variant="secondary"
              className="w-full"
            >
              Get started free
            </Button>
          }
        />
        <PricingPlanCard
          variant="pro"
          title={pro.name}
          description={pro.description}
          price={proBilling.price}
          priceSuffix={proBilling.priceSuffix}
          priceSubline={proBilling.subline}
          features={PUBLIC_PRICING_PRO_PLAN_FEATURES}
          badgeLabel={
            billingInterval === 'year'
              ? PRO_YEARLY_SAVINGS_LABEL
              : 'Most popular'
          }
          className="md:relative md:z-10"
          footer={
            <Button
              href={ROUTES.AUTH.SIGNUP}
              variant="inverse"
              className="w-full"
            >
              Get Pro
            </Button>
          }
        />
      </div>
    </div>
  );
};
