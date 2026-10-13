'use client';

import { Button } from '@/components/shared';
import { siteSignupPath } from '@/features/marketing-attribution';
import React, { useState } from 'react';
import {
  PUBLIC_PRICING_FREE_PLAN_FEATURES,
  PUBLIC_PRICING_PRO_PLAN_FEATURES,
  PUBLIC_PRICING_TEAM_PLAN_FEATURES,
} from '../marketingPlanFeatures';
import type { BillingInterval } from '../types';
import { PLANS, PRO_YEARLY_SAVINGS_LABEL } from '../types';
import {
  getProBillingDisplay,
  getTeamBillingDisplay,
} from '../utils/proBillingDisplay';
import { BillingIntervalToggle } from './BillingIntervalToggle';
import { PricingPlanCard } from './PricingPlanCard';

export interface PublicPricingPlansProps {
  className?: string;
}

/**
 * Free, Pro, and Team plan cards with a monthly/yearly toggle for marketing pages.
 */
export const PublicPricingPlans: React.FC<PublicPricingPlansProps> = ({
  className = '',
}) => {
  const free = PLANS.free;
  const pro = PLANS.pro;
  const team = PLANS.team;
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>('month');
  const proBilling = getProBillingDisplay(billingInterval);
  const teamBilling = getTeamBillingDisplay(billingInterval);

  return (
    <div className={className}>
      <div className="mb-8 flex justify-center sm:mb-10">
        <BillingIntervalToggle
          value={billingInterval}
          onChange={setBillingInterval}
        />
      </div>

      <div className="mx-auto grid max-w-6xl items-stretch gap-6 lg:grid-cols-3 lg:gap-5">
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
              href={siteSignupPath('pricing')}
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
              href={siteSignupPath('pricing')}
              variant="inverse"
              className="w-full"
            >
              Get Pro
            </Button>
          }
        />
        <PricingPlanCard
          variant="team"
          title={team.name}
          description={team.description}
          price={teamBilling.price}
          priceSuffix={teamBilling.priceSuffix}
          priceSubline={teamBilling.subline}
          features={PUBLIC_PRICING_TEAM_PLAN_FEATURES}
          badgeLabel={
            billingInterval === 'year' ? PRO_YEARLY_SAVINGS_LABEL : undefined
          }
          footer={
            <Button
              href={siteSignupPath('pricing')}
              variant="secondary"
              className="w-full"
            >
              Get Team
            </Button>
          }
        />
      </div>
    </div>
  );
};
