'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import type { PublicBookingServiceLocation } from '@/features/business-profile/utils/publicServiceLocation';
import type { QuoteCatalogService } from '@/features/quotes/server/loadQuoteServiceCatalog';
import type { ServiceCategoryRow } from '@/features/services/categories/types/serviceCategories';
import React from 'react';
import {
  CREATE_APPOINTMENT_MAX_JOBS,
  CREATE_APPOINTMENT_STEP,
} from './constants';
import { AddAnotherJobCard } from './components/AddAnotherJobCard';
import { CreateAppointmentHeader } from './components/CreateAppointmentHeader';
import { CreateFlowFooter } from './components/CreateFlowFooter';
import { SelectionSummaryCard } from './components/SelectionSummaryCard';
import { useCreateAppointmentController } from './hooks/useCreateAppointmentController';
import { AddressStep } from './steps/AddressStep';
import { CatalogAddonsStep } from './steps/CatalogAddonsStep';
import { CatalogPricingStep } from './steps/CatalogPricingStep';
import { CustomerStep } from './steps/CustomerStep';
import { LocationStep } from './steps/LocationStep';
import { ReviewStep } from './steps/ReviewStep';
import { ScheduleStep } from './steps/ScheduleStep';
import { ServiceCatalogListStep } from './steps/ServiceCatalogListStep';
import { ServicePathChooser } from './steps/ServicePathChooser';
import { VehicleStep } from './steps/VehicleStep';
import { canAddAnotherJob } from './utils/createAppointmentJobs';

export interface CreateAppointmentWizardProps {
  businessId: string;
  businessSlug: string | null;
  businessName: string;
  serviceCatalog: QuoteCatalogService[];
  serviceCategories: ServiceCategoryRow[];
  serviceLocation: PublicBookingServiceLocation;
}

export function CreateAppointmentWizard({
  businessId: _businessId,
  businessSlug,
  businessName,
  serviceCatalog,
  serviceCategories,
  serviceLocation,
}: CreateAppointmentWizardProps) {
  const ctrl = useCreateAppointmentController({
    catalog: serviceCatalog,
    serviceLocation,
  });
  const {
    step,
    headerTitle,
    headerSubtitle,
    progress,
    canContinue,
    appointmentConfirmed,
    committedJobs,
    draft,
    visit,
    jobIndex,
    notice,
    goContinue,
    goBack,
    servicePhase,
    servicePath,
    chooseServicePath,
    selectCatalogService,
    selectPricingOption,
    toggleAddon,
    selectedService,
    shopAddressMissing,
    setLocationType,
    patchCustomer,
    patchAddress,
    patchVehicle,
    addAnotherJob,
    setSchedule,
    visitDuration,
    reviewJobs,
  } = ctrl;

  const primaryLabel =
    step === CREATE_APPOINTMENT_STEP.REVIEW ? 'Confirm' : 'Continue';
  const secondaryLabel =
    step === CREATE_APPOINTMENT_STEP.SERVICE && servicePhase === 'path'
      ? jobIndex > 0
        ? 'Cancel job'
        : undefined
      : 'Back';

  const showSummary =
    Boolean(draft.serviceName.trim() || draft.isCustomJob) &&
    step >= CREATE_APPOINTMENT_STEP.PRICING &&
    step < CREATE_APPOINTMENT_STEP.ADDRESS;

  const addJobGate = canAddAnotherJob({
    committedCount: committedJobs.length,
    draft,
  });
  const showAddAnotherJob =
    step === CREATE_APPOINTMENT_STEP.VEHICLE &&
    committedJobs.length + 1 < CREATE_APPOINTMENT_MAX_JOBS;
  const showAddAnotherOnReview =
    step === CREATE_APPOINTMENT_STEP.REVIEW &&
    committedJobs.length + 1 < CREATE_APPOINTMENT_MAX_JOBS;

  if (appointmentConfirmed) {
    return (
      <div className="min-h-screen py-8 sm:py-10">
        <CreateAppointmentHeader
          title="Appointment confirmed"
          subtitle="You’re all set—it’s on your calendar. Check Bookings for details."
        />
        <div className="mx-auto w-full max-w-xl px-4">
          <Button
            type="button"
            variant="primary"
            href={ROUTES.DASHBOARD.BOOKINGS}
            className="mt-6 cursor-pointer"
          >
            Done
          </Button>
          <p className="mt-4 text-xs text-zinc-500">
            Stub success — real POST lands in a later slice. ({businessName})
          </p>
        </div>
      </div>
    );
  }

  let body: React.ReactNode = null;

  if (step === CREATE_APPOINTMENT_STEP.SERVICE) {
    body =
      servicePhase === 'path' ? (
        <div className="space-y-4">
          {jobIndex > 0 ? (
            <p className="text-sm text-zinc-400">
              Job {jobIndex + 1} of up to {CREATE_APPOINTMENT_MAX_JOBS}. Customer
              and location stay the same.
            </p>
          ) : null}
          <ServicePathChooser
            value={servicePath}
            onChange={chooseServicePath}
          />
        </div>
      ) : (
        <ServiceCatalogListStep
          catalog={serviceCatalog}
          serviceCategories={serviceCategories}
          selectedServiceId={draft.serviceId}
          onSelect={selectCatalogService}
        />
      );
  } else if (step === CREATE_APPOINTMENT_STEP.PRICING && selectedService) {
    body = (
      <CatalogPricingStep
        service={selectedService}
        selectedOptionId={draft.pricingOption?.id ?? null}
        onSelect={selectPricingOption}
      />
    );
  } else if (step === CREATE_APPOINTMENT_STEP.ADDONS && selectedService) {
    body = (
      <CatalogAddonsStep
        service={selectedService}
        selectedAddonIds={draft.selectedAddOns.map(a => a.id)}
        onToggle={toggleAddon}
      />
    );
  } else if (step === CREATE_APPOINTMENT_STEP.CUSTOMER) {
    body = (
      <CustomerStep customer={visit.customer} onChange={patchCustomer} />
    );
  } else if (step === CREATE_APPOINTMENT_STEP.LOCATION) {
    body = (
      <LocationStep
        value={visit.locationType}
        onChange={setLocationType}
        shopAddressMissing={shopAddressMissing}
      />
    );
  } else if (step === CREATE_APPOINTMENT_STEP.ADDRESS) {
    body = (
      <AddressStep address={visit.address} onChange={patchAddress} />
    );
  } else if (step === CREATE_APPOINTMENT_STEP.VEHICLE) {
    body = (
      <div className="space-y-4">
        {committedJobs.length > 0 ? (
          <p className="text-sm text-zinc-400">
            {committedJobs.length} job
            {committedJobs.length === 1 ? '' : 's'} already on this visit
            {committedJobs.map(j => ` · ${j.serviceName}`).join('')}
          </p>
        ) : null}
        <VehicleStep vehicle={draft.vehicle} onChange={patchVehicle} />
        {showAddAnotherJob ? (
          <AddAnotherJobCard
            onPress={addAnotherJob}
            disabled={!addJobGate.ok || !canContinue}
          />
        ) : null}
      </div>
    );
  } else if (step === CREATE_APPOINTMENT_STEP.SCHEDULE) {
    body = (
      <ScheduleStep
        businessSlug={businessSlug}
        visitDurationMinutes={visitDuration}
        scheduledDate={visit.scheduledDate}
        startTime={visit.startTime}
        onChange={setSchedule}
      />
    );
  } else if (step === CREATE_APPOINTMENT_STEP.REVIEW) {
    body = (
      <ReviewStep
        jobs={reviewJobs}
        customer={visit.customer}
        locationType={visit.locationType}
        address={visit.address}
        scheduledDate={visit.scheduledDate}
        startTime={visit.startTime}
        notes={visit.notes}
        canAddAnotherJob={showAddAnotherOnReview}
        onAddAnotherJob={addAnotherJob}
        addAnotherDisabled={!addJobGate.ok}
      />
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-10">
      <CreateAppointmentHeader title={headerTitle} subtitle={headerSubtitle} />

      <div className="mx-auto w-full max-w-xl px-4">
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

        {body}

        {notice ? (
          <p className="mt-4 text-sm text-amber-300/90" role="status">
            {notice}
          </p>
        ) : null}

        {showSummary ? (
          <div className="mt-6">
            <SelectionSummaryCard draft={draft} />
          </div>
        ) : null}

        <CreateFlowFooter
          primaryLabel={primaryLabel}
          onPrimary={goContinue}
          primaryDisabled={!canContinue}
          secondaryLabel={secondaryLabel}
          onSecondary={secondaryLabel ? goBack : undefined}
        />
      </div>
    </div>
  );
}
