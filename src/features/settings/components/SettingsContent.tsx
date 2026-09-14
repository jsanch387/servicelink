'use client';

import { AffiliateReferralWidget } from '@/features/affiliates/components/AffiliateReferralWidget';
import { CompleteBusinessProfile } from '@/features/business-profile/types/businessProfile';
import { ProWelcomeModal } from '@/features/pricing';
import React from 'react';
import { useSettingsTab } from '../hooks/useSettingsTab';
import { useSettingsUrlEffects } from '../hooks/useSettingsUrlEffects';
import type { SettingsPageData } from '../types/settingsPageData';
import { SettingsAccountSection } from './SettingsAccountSection';
import { SettingsBillingSection } from './SettingsBillingSection';
import { SettingsDangerZone } from './SettingsDangerZone';
import { SettingsLogoutButton } from './SettingsLogoutButton';
import { SettingsPageShell } from './SettingsPageShell';
import { SettingsTeamSection } from './SettingsTeamSection';
import { SettingsYourLinkSection } from './SettingsYourLinkSection';

export interface SettingsContentProps {
  businessProfile: CompleteBusinessProfile;
  settingsData: SettingsPageData;
  checkoutSuccess?: boolean;
  emailNotice?: 'updated' | 'error' | null;
}

export const SettingsContent: React.FC<SettingsContentProps> = ({
  businessProfile,
  settingsData,
  checkoutSuccess: checkoutSuccessProp = false,
  emailNotice = null,
}) => {
  const planId = settingsData.planId ?? 'free';
  const hasSlug = settingsData.slugData?.hasSlug || false;
  const { tab, setTab } = useSettingsTab();

  const { showProWelcomeModal, setShowProWelcomeModal } =
    useSettingsUrlEffects(checkoutSuccessProp);

  return (
    <SettingsPageShell tab={tab} onTabChange={setTab}>
      <ProWelcomeModal
        isOpen={showProWelcomeModal}
        onClose={() => setShowProWelcomeModal(false)}
      />

      {tab === 'team' ? (
        <SettingsTeamSection />
      ) : (
        <>
          <SettingsAccountSection
            accountEmail={settingsData.accountEmail}
            signedInWithGoogle={settingsData.signedInWithGoogle ?? false}
            pendingEmail={settingsData.pendingEmail ?? null}
            emailNotice={emailNotice}
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
            subscriptionMonthlyPrice={
              settingsData.subscriptionMonthlyPrice ?? null
            }
            subscriptionBillingInterval={
              settingsData.subscriptionBillingInterval ?? null
            }
          />

          <AffiliateReferralWidget />

          <SettingsLogoutButton />

          {settingsData.accountEmail ? (
            <SettingsDangerZone
              accountEmail={settingsData.accountEmail}
              key={settingsData.accountEmail}
            />
          ) : null}
        </>
      )}
    </SettingsPageShell>
  );
};
