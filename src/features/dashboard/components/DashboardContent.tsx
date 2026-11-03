/**
 * DashboardContent - Home dashboard
 * Week revenue, the next jobs, revenue chart, and daily shortcuts
 */

'use client';

import { Button, CrownIcon } from '@/components/shared';
import { getPublicBusinessProfilePath, ROUTES } from '@/constants/routes';
import {
  FinishChecklistCard,
  OnboardingPreviewFlow,
  previewHasPhone,
  TestBookingCalendarGuide,
  useOnboardingPreview,
} from '@/features/onboarding-preview';
import { PREVIEW_DISMISS_GUIDE_EVENT } from '@/features/onboarding-preview/session';
import {
  readOwnerTestGuide,
  setOwnerTestGuide,
  startOwnerTestGuide,
} from '@/features/onboarding-v3/ownerTestGuide';
import {
  clearV3CalendarGuide,
  dismissV3Checklist,
  readV3CalendarGuide,
  readV3ChecklistDismissed,
  V3_GUIDE_EVENT,
} from '@/features/onboarding-v3/v3Guide';
import {
  DEFAULT_ANALYTICS_PERIOD,
  useAnalytics,
  type DashboardLinkViewsPeriod,
} from '@/features/analytics';
import { BusinessLocationRequiredModal } from '@/features/business-profile/components/BusinessLocationRequiredModal';
import { ShopAddressRequiredModal } from '@/features/business-profile/components/ShopAddressRequiredModal';
import {
  CreateLinkCard,
  DashboardRevenueCard,
  PendingRequestsCard,
  PerformanceCard,
  QuickActionsCard,
} from '@/features/dashboard';
import { FREE_BOOKINGS_LIMIT } from '@/features/pricing';
import { ClockIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { useDashboardAccess } from '../context/DashboardAccessContext';
import { DashboardRevenueChart } from './DashboardRevenueChart';
import { DashboardScheduleCard } from './DashboardScheduleCard';

interface DashboardData {
  businessProfile: {
    id: string;
    business_name: string;
    business_type: string | null;
    service_area: string | null;
    business_zip: string | null;
    bio: string | null;
    created_at: string;
    updated_at: string;
  };
  /** True when a primary row exists in `business_service_areas`. */
  hasConfirmedServiceArea: boolean;
  /** Shop or Both still on the old street-only shop address. */
  needsShopAddressUpdate: boolean;
  slugData: {
    hasSlug: boolean;
    slug?: string;
    fullLink?: string;
    createdAt?: string;
  } | null;
  analytics: {
    servicesCount: number;
    imagesCount: number;
    profileCompleteness: number;
  };
  nextSteps: {
    needsSlug: boolean;
    needsServices: boolean;
    needsImages: boolean;
    needsBio: boolean;
    readyToShare: boolean;
  };
  pendingRequestsCount: number;
  legacyRequestBookingEnabled: boolean;
  useAvailabilityBooking: boolean;
  upcomingBookingsCount: number;
  /** Free plan: public bookings used toward lifetime cap (shown on dashboard + from `free_bookings_count`). */
  freeBookingsUsed?: number;
  /** When true, show free-tier upgrade CTA. */
  isFreeTier?: boolean;
  locationReady: boolean;
  hasProfilePhotos: boolean;
  hasHours: boolean;
  servicesEdited: boolean;
}

interface DashboardContentProps {
  dashboardData: DashboardData;
  /** Set for owners who finished the 2-step flow. */
  v3Setup?: {
    hasPhone: boolean;
    hasTestBooking: boolean;
    slug: string;
  } | null;
}

export const DashboardContent: React.FC<DashboardContentProps> = ({
  dashboardData,
  v3Setup = null,
}) => {
  const { businessProfile, slugData } = dashboardData;
  const access = useDashboardAccess();
  const canManageShop = access.can('profile.write');
  const canSeePayments = access.can('payments.manage');
  const canReadBookings = access.can('bookings.read');
  const canWriteBookings = access.can('bookings.write');
  const showPendingRequests =
    canWriteBookings &&
    !dashboardData.useAvailabilityBooking &&
    dashboardData.legacyRequestBookingEnabled;
  const showLinkViews = canManageShop && Boolean(slugData?.hasSlug);
  const [serviceAreaPromptOpen, setServiceAreaPromptOpen] = useState(
    canManageShop && !dashboardData.hasConfirmedServiceArea
  );
  const freeBookingsUsed = dashboardData.freeBookingsUsed ?? 0;
  const atFreeBookingCap =
    dashboardData.isFreeTier === true &&
    freeBookingsUsed >= FREE_BOOKINGS_LIMIT;

  const isFreeTier = dashboardData.isFreeTier === true;

  const [linkViewsPeriod, setLinkViewsPeriod] =
    useState<DashboardLinkViewsPeriod>(DEFAULT_ANALYTICS_PERIOD);
  const onboardingPreview = useOnboardingPreview();
  const [v3ChecklistDismissed, setV3ChecklistDismissed] = useState(true);
  const [v3GuideArmed, setV3GuideArmed] = useState(false);
  const [v3Ready, setV3Ready] = useState(false);

  useEffect(() => {
    setV3ChecklistDismissed(readV3ChecklistDismissed());
    setV3Ready(true);
    const syncGuide = () => setV3GuideArmed(readV3CalendarGuide());
    syncGuide();
    window.addEventListener(V3_GUIDE_EVENT, syncGuide);
    const clearGuide = () => clearV3CalendarGuide();
    window.addEventListener(PREVIEW_DISMISS_GUIDE_EVENT, clearGuide);
    return () => {
      window.removeEventListener(V3_GUIDE_EVENT, syncGuide);
      window.removeEventListener(PREVIEW_DISMISS_GUIDE_EVENT, clearGuide);
    };
  }, []);

  useEffect(() => {
    if (v3Setup && v3GuideArmed && !v3Setup.hasTestBooking) {
      clearV3CalendarGuide();
    }
  }, [v3Setup, v3GuideArmed]);

  useEffect(() => {
    if (!v3Setup || v3Setup.hasTestBooking) return;
    if (readOwnerTestGuide()) setOwnerTestGuide(null);
  }, [v3Setup]);

  const showPreviewChecklist = onboardingPreview.showChecklist && !v3Setup;
  const showV3Checklist = Boolean(
    v3Setup && !v3ChecklistDismissed && !onboardingPreview.session.open
  );
  const showV3Guide = Boolean(
    v3Setup?.hasTestBooking && v3GuideArmed && !onboardingPreview.session.open
  );

  useEffect(() => {
    if (isFreeTier && linkViewsPeriod !== '24h') {
      setLinkViewsPeriod('24h');
    }
  }, [isFreeTier, linkViewsPeriod]);

  const { dashboardAnalytics, loading: analyticsLoading } = useAnalytics(
    businessProfile.id,
    linkViewsPeriod
  );

  return (
    <main className="flex-1 pt-5 pb-24 sm:pt-6 sm:pb-8 lg:pt-8 lg:pb-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      {canManageShop &&
      !onboardingPreview.showChecklist &&
      !showV3Checklist &&
      !(v3Setup && !v3Ready) ? (
        <>
          <BusinessLocationRequiredModal
            businessProfileId={businessProfile.id}
            hasConfirmedServiceArea={dashboardData.hasConfirmedServiceArea}
            onOpenChange={setServiceAreaPromptOpen}
          />
          <ShopAddressRequiredModal
            businessProfileId={businessProfile.id}
            needsShopAddressUpdate={dashboardData.needsShopAddressUpdate}
            serviceAreaPromptOpen={serviceAreaPromptOpen}
          />
        </>
      ) : null}
      <div className="w-full min-w-0">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6">
          <div className="min-w-0">
            <h1 className="logo-text text-xl sm:text-2xl lg:text-[1.75rem] font-extrabold text-white tracking-tight truncate">
              {businessProfile.business_name}
            </h1>
            {canManageShop && !slugData?.hasSlug ? (
              <p className="text-sm text-zinc-500 mt-1">
                Set up your booking link to get started
              </p>
            ) : null}
          </div>
          {canManageShop && dashboardData.isFreeTier ? (
            <Button
              href={ROUTES.DASHBOARD.UPGRADE}
              variant="primary"
              size="sm"
              icon={<CrownIcon className="h-4 w-4" />}
              className="shrink-0"
            >
              Upgrade to Pro
            </Button>
          ) : null}
        </div>

        {onboardingPreview.session.calendarGuide &&
        !onboardingPreview.session.open &&
        !v3Setup ? (
          <TestBookingCalendarGuide />
        ) : null}
        {showV3Guide ? <TestBookingCalendarGuide /> : null}

        {showPreviewChecklist ? (
          <FinishChecklistCard
            bookedTest={onboardingPreview.session.bookedTest}
            hasPhone={previewHasPhone(onboardingPreview.session.phone)}
            onBookTest={() => onboardingPreview.openAt('live')}
            onDismiss={onboardingPreview.dismissChecklist}
          />
        ) : null}

        {showV3Checklist && v3Setup ? (
          <FinishChecklistCard
            bookedTest={v3Setup.hasTestBooking}
            hasPhone={v3Setup.hasPhone}
            locationReady={dashboardData.locationReady}
            hasPhotos={dashboardData.hasProfilePhotos}
            hasServices={dashboardData.servicesEdited}
            hasHours={dashboardData.hasHours}
            upgraded={!dashboardData.isFreeTier}
            onBookTest={() => {
              if (!v3Setup.slug) return;
              startOwnerTestGuide();
              window.location.assign(
                getPublicBusinessProfilePath(v3Setup.slug)
              );
            }}
            onDismiss={() => {
              dismissV3Checklist();
              setV3ChecklistDismissed(true);
            }}
          />
        ) : null}

        <div className="space-y-5 sm:space-y-6 w-full min-w-0">
          {canManageShop && !slugData?.hasSlug ? (
            <CreateLinkCard businessProfileId={businessProfile.id} />
          ) : null}

          {/* Nudge: availability booking is off – set schedule so customers can book */}
          {canManageShop && !dashboardData.useAvailabilityBooking && (
            <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.05] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <ClockIcon className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200">
                    Online booking is off
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-snug">
                    Set your schedule so customers can pick a time from your
                    calendar.
                  </p>
                </div>
              </div>
              <Button
                href={ROUTES.DASHBOARD.AVAILABILITY}
                variant="inverse"
                size="sm"
                className="w-full shrink-0 sm:w-auto"
              >
                Set availability
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-4 lg:gap-5">
            <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {canSeePayments ? (
                <DashboardRevenueCard href={ROUTES.DASHBOARD.PAYMENTS} />
              ) : null}
              {showLinkViews ? (
                <PerformanceCard
                  views={dashboardAnalytics?.views ?? 0}
                  period={linkViewsPeriod}
                  onPeriodChange={setLinkViewsPeriod}
                  lastViewed={dashboardAnalytics?.lastViewedFormatted}
                  loading={analyticsLoading}
                  isFreeTier={isFreeTier}
                />
              ) : null}
              {showPendingRequests ? (
                <PendingRequestsCard
                  pendingCount={dashboardData.pendingRequestsCount}
                />
              ) : null}
              {canWriteBookings ? (
                <QuickActionsCard
                  hasPublicPageSlug={Boolean(slugData?.hasSlug)}
                  atFreeBookingCap={atFreeBookingCap}
                  bookingLink={slugData?.fullLink}
                />
              ) : null}
            </div>

            {canReadBookings || canSeePayments ? (
              <div
                className={`grid min-w-0 grid-cols-1 items-stretch gap-4 lg:gap-5 ${
                  canReadBookings && canSeePayments ? 'lg:grid-cols-2' : ''
                }`}
              >
                {canReadBookings ? (
                  <DashboardScheduleCard
                    calendarHref={ROUTES.DASHBOARD.BOOKINGS}
                  />
                ) : null}
                {canSeePayments ? <DashboardRevenueChart /> : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {onboardingPreview.session.open ? (
        <OnboardingPreviewFlow
          session={onboardingPreview.session}
          onChange={onboardingPreview.patch}
          onExit={onboardingPreview.exit}
          onStartOver={onboardingPreview.startOver}
          onFinish={onboardingPreview.finish}
        />
      ) : null}
    </main>
  );
};

export default DashboardContent;
