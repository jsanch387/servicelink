'use client';

import React from 'react';
import {
  FREE_PAYMENTS_UPSELL_DESCRIPTION_MAIN,
  FREE_PAYMENTS_UPSELL_DESCRIPTION_RESTORE,
  FREE_PAYMENTS_UPSELL_TITLE,
  FREE_PAYMENTS_UPSELL_TITLE_RESTORE,
  FreePaymentPreview,
} from '../free-payment-preview';
import {
  PAYMENTS_PAGE_DESCRIPTION_FINISH_SETUP,
  PAYMENTS_PAGE_DESCRIPTION_SETUP_PENDING,
  PAYMENTS_PAGE_DESCRIPTION_STRIPE_READY,
  ProPaymentsSetupExperience,
  ProServicelinkPaymentsGate,
} from '../payments-setup';
import type { PaymentSettingsDashboardInitial } from '../types/paymentSettingsDashboard';
import { PaymentsAcceptPaymentsCard } from './PaymentsAcceptPaymentsCard';
import { PaymentsBalanceAndStripeSection } from './PaymentsBalanceAndStripeSection';
import { PaymentsCheckoutOptionsCard } from './PaymentsCheckoutOptionsCard';
import { PaymentsDepositSettingsCard } from './PaymentsDepositSettingsCard';
import { PaymentsPageHeader } from './PaymentsPageHeader';

export interface PaymentsPageProps {
  hasProAccess: boolean;
  /** Stripe Connect onboarding finished and account can charge. */
  stripeConnectReady?: boolean;
  /** Owner turned on ServiceLink checkout (`payment_settings.payments_enabled`). */
  servicelinkPaymentsEnabled?: boolean;
  /**
   * When true, primary CTA should read “continue” (saved `acct_…`, onboarding incomplete).
   */
  stripeConnectResume?: boolean;
  /** Stripe flagged the Connect account (e.g. outstanding requirements). */
  stripeConnectRestricted?: boolean;
  /** Loaded from `payment_settings` when the Pro payments dashboard is shown. */
  paymentSettings?: PaymentSettingsDashboardInitial | null;
  /** Connected Stripe account id (`acct_…`) for Express Dashboard login link. */
  stripeExpressAccountId?: string | null;
  /** Had Connect and/or `payment_settings` before losing Pro (churned / downgraded). */
  priorPaymentsSetup?: boolean;
}

export const PaymentsPage: React.FC<PaymentsPageProps> = ({
  hasProAccess,
  stripeConnectReady = false,
  servicelinkPaymentsEnabled = false,
  stripeConnectResume = false,
  stripeConnectRestricted = false,
  paymentSettings = null,
  stripeExpressAccountId = null,
  priorPaymentsSetup = false,
}) => {
  const showProPaymentsDashboard =
    hasProAccess && stripeConnectReady && paymentSettings != null;
  const showServicelinkGate =
    hasProAccess && stripeConnectReady && paymentSettings == null;
  const showStripeConnectSetup = hasProAccess && !stripeConnectReady;

  const pageDescription = showProPaymentsDashboard
    ? servicelinkPaymentsEnabled
      ? undefined
      : PAYMENTS_PAGE_DESCRIPTION_STRIPE_READY
    : showServicelinkGate
      ? PAYMENTS_PAGE_DESCRIPTION_STRIPE_READY
      : showStripeConnectSetup
        ? stripeConnectResume
          ? PAYMENTS_PAGE_DESCRIPTION_FINISH_SETUP
          : PAYMENTS_PAGE_DESCRIPTION_SETUP_PENDING
        : undefined;

  const dashboardSettings: PaymentSettingsDashboardInitial =
    paymentSettings ?? {
      checkoutMode: null,
      depositsEnabled: false,
      depositType: 'percent',
      depositValue: 0,
      currency: 'usd',
    };

  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-6xl mx-auto w-full min-w-0">
        <PaymentsPageHeader
          showProUpsellLabel={!hasProAccess}
          description={pageDescription}
        />
        {showProPaymentsDashboard ? (
          <>
            <div className="space-y-4 sm:space-y-6">
              <PaymentsAcceptPaymentsCard
                paymentsEnabled={servicelinkPaymentsEnabled}
              />
              <PaymentsBalanceAndStripeSection
                stripeExpressAccountId={stripeExpressAccountId}
              />
            </div>
            <div
              className={`mt-8 sm:mt-10 space-y-8 sm:space-y-10 transition-opacity duration-200 ${
                servicelinkPaymentsEnabled
                  ? 'opacity-100'
                  : 'opacity-40 sm:opacity-[0.44]'
              }`}
            >
              {!servicelinkPaymentsEnabled ? (
                <p className="text-xs text-gray-500 mb-4 max-w-xl">
                  Card checkout is off on your booking page. You can still edit
                  below; changes apply when payments are on.
                </p>
              ) : null}
              <PaymentsCheckoutOptionsCard
                initialCheckoutMode={dashboardSettings.checkoutMode}
              />
              <PaymentsDepositSettingsCard
                initialDepositsEnabled={dashboardSettings.depositsEnabled}
                initialDepositType={dashboardSettings.depositType}
                initialDepositValue={dashboardSettings.depositValue}
              />
            </div>
          </>
        ) : showServicelinkGate ? (
          <ProServicelinkPaymentsGate />
        ) : showStripeConnectSetup ? (
          <ProPaymentsSetupExperience
            resumeConnect={stripeConnectResume}
            stripeRestricted={stripeConnectRestricted}
          />
        ) : (
          <FreePaymentPreview
            upsellTitle={
              priorPaymentsSetup
                ? FREE_PAYMENTS_UPSELL_TITLE_RESTORE
                : FREE_PAYMENTS_UPSELL_TITLE
            }
            upsellDescription={
              priorPaymentsSetup
                ? FREE_PAYMENTS_UPSELL_DESCRIPTION_RESTORE
                : FREE_PAYMENTS_UPSELL_DESCRIPTION_MAIN
            }
          />
        )}
      </div>
    </main>
  );
};
