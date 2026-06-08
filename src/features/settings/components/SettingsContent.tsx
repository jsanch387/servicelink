'use client';

import { CompleteBusinessProfile } from '@/features/business-profile/types/businessProfile';
import { ProWelcomeModal } from '@/features/pricing';
import React from 'react';
import { SettingsAccountSection } from './SettingsAccountSection';
import { SettingsBillingSection } from './SettingsBillingSection';
import { SettingsDangerZone } from './SettingsDangerZone';
import { SettingsPageShell } from './SettingsPageShell';
import { SettingsYourLinkSection } from './SettingsYourLinkSection';
import { useSettingsUrlEffects } from '../hooks/useSettingsUrlEffects';
import type { SettingsPageData } from '../types/settingsPageData';

export interface SettingsContentProps {
  businessProfile: CompleteBusinessProfile;
  settingsData: SettingsPageData;
  /** True when redirected from Stripe with ?checkout=success (show Pro welcome once). */
  checkoutSuccess?: boolean;
}

export const SettingsContent: React.FC<SettingsContentProps> = ({
  businessProfile,
  settingsData,
  checkoutSuccess: checkoutSuccessProp = false,
}) => {
  const planId = settingsData.planId ?? 'free';
  const hasSlug = settingsData.slugData?.hasSlug || false;

  const { showProWelcomeModal, setShowProWelcomeModal } =
    useSettingsUrlEffects(checkoutSuccessProp);

  return (
    <SettingsPageShell>
      <ProWelcomeModal
        isOpen={showProWelcomeModal}
        onClose={() => setShowProWelcomeModal(false)}
      />

      <SettingsYourLinkSection
        businessProfileId={businessProfile.id}
        hasSlug={hasSlug}
        existingSlug={settingsData.slugData?.slug}
        existingFullLink={settingsData.slugData?.fullLink}
      />

      <SettingsBillingSection
        planId={planId}
        subscriptionStatus={settingsData.subscriptionStatus ?? null}
        subscriptionCurrentPeriodEnd={
          settingsData.subscriptionCurrentPeriodEnd ?? null
        }
        subscriptionCancelAtPeriodEnd={
          settingsData.subscriptionCancelAtPeriodEnd === true
        }
      />

      <SettingsAccountSection
        accountEmail={settingsData.accountEmail}
        signedInWithGoogle={settingsData.signedInWithGoogle ?? false}
      />

      {settingsData.accountEmail ? (
        <SettingsDangerZone
          accountEmail={settingsData.accountEmail}
          key={settingsData.accountEmail}
        />
      ) : null}
    </SettingsPageShell>
  );
};
