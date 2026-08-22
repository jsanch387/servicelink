'use client';

import { Button, Modal } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import type { PublicBookingServiceLocation } from '@/features/business-profile/utils/publicServiceLocation';
import type { PublicActiveSale } from '@/features/marketing/types/publicActiveSale';
import type { QuoteCatalogService } from '@/features/quotes/server/loadQuoteServiceCatalog';
import type { ServiceCategoryRow } from '@/features/services/categories/types/serviceCategories';
import { useRouter } from 'next/navigation';
import React from 'react';
import {
  CREATE_APPOINTMENT_MAX_JOBS,
  CREATE_APPOINTMENT_STEP,
} from './constants';
import { AddAnotherJobCard } from './components/AddAnotherJobCard';
import { CreateAppointmentErrorState } from './components/CreateAppointmentErrorState';
import { CreateAppointmentHeader } from './components/CreateAppointmentHeader';
import { CreateAppointmentSubmittingState } from './components/CreateAppointmentSubmittingState';
import { CreateAppointmentSuccessState } from './components/CreateAppointmentSuccessState';
import { CreateFlowFooter } from './components/CreateFlowFooter';
import { SelectionSummaryCard } from './components/SelectionSummaryCard';
import { useCreateAppointmentController } from './hooks/useCreateAppointmentController';
import { AddressStep } from './steps/AddressStep';
import { CatalogAddonsStep } from './steps/CatalogAddonsStep';
import { CatalogPricingStep } from './steps/CatalogPricingStep';
import { CustomJobStep } from './steps/CustomJobStep';
import { CustomerStep } from './steps/CustomerStep';
import { LocationStep } from './steps/LocationStep';
import { ReviewStep } from './steps/ReviewStep';
import { ScheduleStep } from './steps/ScheduleStep';
import { ServiceCatalogListStep } from './steps/ServiceCatalogListStep';
import { ServicePathChooser } from './steps/ServicePathChooser';
import { VehicleStep } from './steps/VehicleStep';
import { canAddAnotherJob } from './utils/createAppointmentJobs';
import type { MembershipVisitPrefill } from './types/membershipVisitPrefill';

export interface CreateAppointmentWizardProps {
  businessId: string;
  businessSlug: string | null;
  businessName: string;
  businessType?: string | null;
  serviceCatalog: QuoteCatalogService[];
  serviceCategories: ServiceCategoryRow[];
  serviceLocation: PublicBookingServiceLocation;
  activeSale?: PublicActiveSale | null;
  membershipVisit?: MembershipVisitPrefill | null;
}

export function CreateAppointmentWizard({
  businessId,
  businessSlug,
  businessName: _businessName,
  businessType,
  serviceCatalog,
  serviceCategories,
  serviceLocation,
  activeSale = null,
  membershipVisit = null,
}: CreateAppointmentWizardProps) {
  const router = useRouter();
  const ctrl = useCreateAppointmentController({
    businessId,
    businessSlug: businessSlug?.trim() || '',
    businessType,
    catalog: serviceCatalog,
    serviceLocation,
    membershipVisit,
  });
  const {
    step,
    headerTitle,
    headerSubtitle,
    progress,
    canContinue,
    appointmentConfirmed,
    membershipId,
    isSubmitting,
    submitError,
    clearSubmitError,
    committedJobs,
    draft,
    visit,
    jobIndex,
    notice,
    goContinue,
    confirmScheduleDespiteConflict,
    dismissScheduleConflictModal,
    setExactStartConflict,
    showScheduleConflictModal,
    goBack,
    servicePhase,
    servicePath,
    chooseServicePath,
    selectCatalogService,
    selectPricingOption,
    toggleAddon,
    patchDraft,
    selectedService,
    shopAddressMissing,
    setLocationType,
    patchCustomer,
    patchAddress,
    patchVehicle,
    addAnotherJob,
    setSchedule,
    setApplySale,
    visitDuration,
    flexibleWeeklySchedule,
    blockedSlots,
    scheduleDataLoading,
    reviewJobs,
  } = ctrl;

  const isReview = step === CREATE_APPOINTMENT_STEP.REVIEW;
  const primaryLabel = isReview ? 'Confirm' : 'Continue';
  const secondaryLabel =
    step === CREATE_APPOINTMENT_STEP.SERVICE && servicePhase === 'path'
      ? jobIndex > 0
        ? 'Cancel job'
        : undefined
      : 'Back';

  const handleSecondary = () => {
    // Membership Book visit starts on custom job — Back returns to subscriber.
    if (membershipId && step === CREATE_APPOINTMENT_STEP.PRICING) {
      router.push(ROUTES.DASHBOARD.SUBSCRIPTIONS_SUBSCRIBER(membershipId));
      return;
    }
    goBack();
  };

  const showSummary =
    Boolean(draft.serviceName.trim()) &&
    step > CREATE_APPOINTMENT_STEP.PRICING &&
    step < CREATE_APPOINTMENT_STEP.ADDRESS;

  const addJobGate = canAddAnotherJob({
    committedCount: committedJobs.length,
    draft,
  });
  // Membership Book visit = one covered job; multi-job is for normal appointments.
  const allowAddAnotherJob = !membershipId;
  const showAddAnotherJob =
    allowAddAnotherJob &&
    step === CREATE_APPOINTMENT_STEP.VEHICLE &&
    committedJobs.length + 1 < CREATE_APPOINTMENT_MAX_JOBS;
  const showAddAnotherOnReview =
    allowAddAnotherJob &&
    isReview &&
    committedJobs.length + 1 < CREATE_APPOINTMENT_MAX_JOBS;

  const membershipBackHref = membershipId
    ? ROUTES.DASHBOARD.SUBSCRIPTIONS_SUBSCRIBER(membershipId)
    : undefined;
  const headerBackProps = membershipBackHref
    ? { backHref: membershipBackHref, backLabel: 'Subscriber' }
    : {};

  if (isSubmitting) {
    return (
      <div className="min-h-screen py-8 sm:py-10">
        <CreateAppointmentHeader compact hideBack />
        <div className="mx-auto w-full max-w-xl px-4">
          <CreateAppointmentSubmittingState />
        </div>
      </div>
    );
  }

  if (appointmentConfirmed) {
    return (
      <div className="min-h-screen py-8 sm:py-10">
        <CreateAppointmentHeader compact {...headerBackProps} />
        <div className="mx-auto w-full max-w-xl px-4">
          <CreateAppointmentSuccessState membershipId={membershipId} />
        </div>
      </div>
    );
  }

  if (submitError) {
    return (
      <div className="min-h-screen py-8 sm:py-10">
        <CreateAppointmentHeader compact {...headerBackProps} />
        <div className="mx-auto w-full max-w-xl px-4">
          <CreateAppointmentErrorState
            message={submitError}
            onTryAgain={clearSubmitError}
          />
        </div>
      </div>
    );
  }

  let body: React.ReactNode = null;

  if (step === CREATE_APPOINTMENT_STEP.SERVICE) {
    body =
      servicePhase === 'path' ? (
        <ServicePathChooser value={servicePath} onChange={chooseServicePath} />
      ) : (
        <ServiceCatalogListStep
          catalog={serviceCatalog}
          serviceCategories={serviceCategories}
          selectedServiceId={draft.serviceId}
          onSelect={selectCatalogService}
        />
      );
  } else if (step === CREATE_APPOINTMENT_STEP.PRICING) {
    body = draft.isCustomJob ? (
      <CustomJobStep
        draft={draft}
        onChange={patchDraft}
        priceIncludedWithMembership={Boolean(membershipId)}
      />
    ) : selectedService ? (
      <CatalogPricingStep
        service={selectedService}
        selectedOptionId={draft.pricingOption?.id ?? null}
        onSelect={selectPricingOption}
      />
    ) : null;
  } else if (step === CREATE_APPOINTMENT_STEP.ADDONS && selectedService) {
    body = (
      <CatalogAddonsStep
        service={selectedService}
        selectedAddonIds={draft.selectedAddOns.map(a => a.id)}
        onToggle={toggleAddon}
      />
    );
  } else if (step === CREATE_APPOINTMENT_STEP.CUSTOMER) {
    body = <CustomerStep customer={visit.customer} onChange={patchCustomer} />;
  } else if (step === CREATE_APPOINTMENT_STEP.LOCATION) {
    body = (
      <LocationStep
        value={visit.locationType}
        onChange={setLocationType}
        shopAddressMissing={shopAddressMissing}
      />
    );
  } else if (step === CREATE_APPOINTMENT_STEP.ADDRESS) {
    body = <AddressStep address={visit.address} onChange={patchAddress} />;
  } else if (step === CREATE_APPOINTMENT_STEP.VEHICLE) {
    body = (
      <div className="space-y-4">
        <VehicleStep vehicle={draft.vehicle} onChange={patchVehicle} />
        {showAddAnotherJob ? (
          <AddAnotherJobCard
            onPress={addAnotherJob}
            disabled={!addJobGate.ok || !canContinue || isSubmitting}
          />
        ) : null}
      </div>
    );
  } else if (step === CREATE_APPOINTMENT_STEP.SCHEDULE) {
    body = (
      <ScheduleStep
        visitDurationMinutes={visitDuration}
        scheduledDate={visit.scheduledDate}
        startTime={visit.startTime}
        weeklySchedule={flexibleWeeklySchedule}
        existingBookings={blockedSlots}
        scheduleLoading={scheduleDataLoading}
        onChange={setSchedule}
        onExactStartConflictChange={setExactStartConflict}
      />
    );
  } else if (isReview) {
    body = (
      <ReviewStep
        jobs={reviewJobs}
        customer={visit.customer}
        locationType={visit.locationType}
        address={visit.address}
        scheduledDate={visit.scheduledDate}
        startTime={visit.startTime}
        notes={visit.notes}
        activeSale={activeSale}
        applySale={visit.applySale}
        onApplySaleChange={setApplySale}
        canAddAnotherJob={showAddAnotherOnReview}
        onAddAnotherJob={addAnotherJob}
        addAnotherDisabled={!addJobGate.ok || isSubmitting}
        membershipCovered={Boolean(membershipId)}
      />
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-10">
      <CreateAppointmentHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        compact={isReview}
        {...headerBackProps}
      />

      <div className="mx-auto w-full max-w-xl px-4">
        {!isReview ? (
          <div
            className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-white/80 transition-[width] duration-300"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        ) : null}

        {body}

        {notice ? (
          <p className="mt-4 text-sm text-amber-300/90" role="status">
            {notice}
          </p>
        ) : null}

        {showSummary ? (
          <div className="mt-6">
            <SelectionSummaryCard
              draft={draft}
              membershipCovered={Boolean(membershipId)}
            />
          </div>
        ) : null}

        <CreateFlowFooter
          primaryLabel={primaryLabel}
          onPrimary={goContinue}
          primaryDisabled={!canContinue || isSubmitting}
          secondaryLabel={secondaryLabel}
          onSecondary={secondaryLabel ? handleSecondary : undefined}
          secondaryDisabled={isSubmitting}
        />
      </div>

      <Modal
        isOpen={showScheduleConflictModal}
        onClose={dismissScheduleConflictModal}
        title="Time already booked"
        maxWidth="sm"
        uniformHorizontalPadding16
        titleClassName="font-bold"
        contentClassName="!pt-4 sm:!pt-5 !pb-4 sm:!pb-5"
      >
        <p className="text-sm leading-relaxed text-gray-300">
          You already have an appointment at this start time. Continue anyway if
          you want to double-book it.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fullWidth
            onClick={dismissScheduleConflictModal}
          >
            Change time
          </Button>
          <Button
            type="button"
            variant="inverse"
            size="sm"
            fullWidth
            onClick={confirmScheduleDespiteConflict}
          >
            Continue
          </Button>
        </div>
      </Modal>
    </div>
  );
}
