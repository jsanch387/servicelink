'use client';

import { ROUTES } from '@/constants/routes';
import { AffiliateReferralWidget } from '@/features/affiliates/components/AffiliateReferralWidget';
import { isOwnerEmailAllowedForTeamRollout } from '@/features/team/config/teamRolloutAllowlist';
import { CompleteBusinessProfile } from '@/features/business-profile/types/businessProfile';
import { ProWelcomeModal } from '@/features/pricing';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { useSettingsUrlEffects } from '../hooks/useSettingsUrlEffects';
import type { SettingsPageData } from '../types/settingsPageData';
import { SettingsAccountSection } from './SettingsAccountSection';
import { SettingsBillingSection } from './SettingsBillingSection';
import { SettingsDangerZone } from './SettingsDangerZone';
import { SettingsLogoutButton } from './SettingsLogoutButton';
import { SettingsPageShell } from './SettingsPageShell';
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
  const router = useRouter();

  const { showProWelcomeModal, setShowProWelcomeModal } =
    useSettingsUrlEffects(checkoutSuccessProp);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== '#team') return;
    if (!isOwnerEmailAllowedForTeamRollout(settingsData.accountEmail)) return;
    router.replace(ROUTES.DASHBOARD.TEAM);
  }, [router, settingsData.accountEmail]);

  return (
    <SettingsPageShell>
      <ProWelcomeModal
        isOpen={showProWelcomeModal}
        onClose={() => setShowProWelcomeModal(false)}
      />

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
        subscriptionMonthlyPrice={settingsData.subscriptionMonthlyPrice ?? null}
        subscriptionBillingInterval={
          settingsData.subscriptionBillingInterval ?? null
        }
        billingAction={settingsData.billingAction ?? 'checkout'}
      />

      <AffiliateReferralWidget />

      <SettingsLogoutButton />

      {settingsData.accountEmail ? (
        <SettingsDangerZone
          accountEmail={settingsData.accountEmail}
          key={settingsData.accountEmail}
        />
      ) : null}
    </SettingsPageShell>
  );
};
