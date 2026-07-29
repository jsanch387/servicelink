'use client';

import type { PublicBookingServiceLocation } from '@/features/business-profile/utils/publicServiceLocation';
import type { QuoteCatalogService } from '@/features/quotes/server/loadQuoteServiceCatalog';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import {
  CREATE_APPOINTMENT_STEP,
  CREATE_APPOINTMENT_STEP_META,
} from '../constants';
import type { ServicePathChoice } from '../steps/ServicePathChooser';
import {
  createEmptyJobDraft,
  createEmptyVisit,
  emptyAddress,
  type CreateAppointmentAddonSelection,
  type CreateAppointmentAddress,
  type CreateAppointmentJobDraft,
  type CreateAppointmentJobSnapshot,
  type CreateAppointmentLocationType,
  type CreateAppointmentVehicle,
  type CreateAppointmentVisitState,
} from '../types';
import {
  isCatalogAddonsSkipped,
  isCatalogPricingSkipped,
} from '../utils/catalogServiceHelpers';
import {
  canAddAnotherJob,
  reviewJobsFromState,
  snapshotJobDraft,
  visitDurationMinutes,
} from '../utils/createAppointmentJobs';
import { canContinueCreateAppointmentStep } from '../utils/createFlowContinueGate';
import {
  getCreateAppointmentProgressFraction,
  getNextStepOnContinue,
  getPreviousStepOnBack,
} from '../utils/createFlowNavigation';

export type ServiceStepPhase = 'path' | 'list';

function shopAddressFromLocation(
  loc: PublicBookingServiceLocation
): CreateAppointmentAddress {
  return {
    street: loc.shopStreet,
    unit: loc.shopUnit,
    city: loc.city,
    state: loc.state,
    zip: loc.zip,
  };
}

function newLocalId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function applyCatalogServiceToDraft(
  prev: CreateAppointmentJobDraft,
  service: QuoteCatalogService
): CreateAppointmentJobDraft {
  const pricingSkipped = isCatalogPricingSkipped(service);
  let pricingOption = null as CreateAppointmentJobDraft['pricingOption'];
  let servicePriceCents = service.priceCents;
  let durationMinutes = service.durationMinutes;

  if (service.priceOptionsEnabled && service.priceOptions.length === 1) {
    const only = service.priceOptions[0];
    pricingOption = {
      id: only.id,
      label: only.label,
      priceCents: only.priceCents,
    };
    servicePriceCents = only.priceCents;
    durationMinutes = only.durationMinutes;
  } else if (pricingSkipped) {
    pricingOption = null;
    servicePriceCents = service.priceCents;
    durationMinutes = service.durationMinutes;
  }

  return {
    ...prev,
    isCustomJob: false,
    serviceId: service.id,
    serviceName: service.name,
    pricingOption,
    servicePriceCents,
    durationMinutes,
    selectedAddOns: [],
    customPriceLabel: '',
  };
}

export interface UseCreateAppointmentControllerOptions {
  catalog: QuoteCatalogService[];
  serviceLocation: PublicBookingServiceLocation;
  /** When true, schedule/review continue gates are bypassed (tests / stubs). */
  stubAfterVehicle?: boolean;
}

export function useCreateAppointmentController(
  options: UseCreateAppointmentControllerOptions
) {
  const { catalog, serviceLocation, stubAfterVehicle = false } = options;

  const reactId = useId();
  const [step, setStep] = useState(CREATE_APPOINTMENT_STEP.SERVICE);
  const [servicePhase, setServicePhase] = useState<ServiceStepPhase>('path');
  const [servicePath, setServicePath] = useState<ServicePathChoice | null>(
    null
  );
  const [committedJobs, setCommittedJobs] = useState<
    CreateAppointmentJobSnapshot[]
  >([]);
  const [draft, setDraft] = useState<CreateAppointmentJobDraft>(() =>
    createEmptyJobDraft(`job_${reactId}_0`)
  );
  const [visit, setVisit] =
    useState<CreateAppointmentVisitState>(createEmptyVisit);
  const [appointmentConfirmed, setAppointmentConfirmed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [locationSeeded, setLocationSeeded] = useState(false);

  const jobIndex = committedJobs.length;
  const hasScheduleSlot = Boolean(visit.scheduledDate && visit.startTime);

  const visitDuration = useMemo(
    () => visitDurationMinutes(committedJobs, draft),
    [committedJobs, draft]
  );

  const reviewJobs = useMemo(
    () => reviewJobsFromState(committedJobs, draft),
    [committedJobs, draft]
  );

  useEffect(() => {
    if (locationSeeded) return;
    setLocationSeeded(true);
    if (serviceLocation.mode === 'mobile_only') {
      setVisit(v => ({ ...v, locationType: 'mobile' }));
    } else if (serviceLocation.mode === 'shop_only') {
      setVisit(v => ({
        ...v,
        locationType: 'shop',
        address: shopAddressFromLocation(serviceLocation),
      }));
    }
  }, [locationSeeded, serviceLocation]);

  const selectedService = useMemo(() => {
    if (!draft.serviceId || draft.isCustomJob) return null;
    return catalog.find(s => s.id === draft.serviceId) ?? null;
  }, [catalog, draft.serviceId, draft.isCustomJob]);

  const pricingSkipped = draft.isCustomJob
    ? false
    : isCatalogPricingSkipped(selectedService);
  const addonsSkipped = draft.isCustomJob
    ? true
    : isCatalogAddonsSkipped(selectedService);

  const locationSkipped = serviceLocation.mode !== 'both';
  const addressSkipped =
    serviceLocation.mode === 'shop_only' ||
    (serviceLocation.mode === 'both' && visit.locationType === 'shop');

  const shopAddressMissing =
    visit.locationType === 'shop' && !serviceLocation.hasCompleteShopAddress;

  const navOpts = useMemo(
    () => ({
      pricingSkipped,
      addonsSkipped,
      locationSkipped,
      addressSkipped,
      jobIndex,
    }),
    [pricingSkipped, addonsSkipped, locationSkipped, addressSkipped, jobIndex]
  );

  const progress = getCreateAppointmentProgressFraction(step, {
    ...navOpts,
    appointmentConfirmed,
  });

  const stepMeta =
    CREATE_APPOINTMENT_STEP_META[step] ?? CREATE_APPOINTMENT_STEP_META[0];

  const catalogPriceComplete = useMemo(() => {
    if (draft.isCustomJob || !selectedService) return true;
    if (pricingSkipped) return true;
    return Boolean(draft.pricingOption?.id);
  }, [
    draft.isCustomJob,
    draft.pricingOption?.id,
    pricingSkipped,
    selectedService,
  ]);

  const canContinue = canContinueCreateAppointmentStep({
    appointmentConfirmed,
    step,
    selectedServiceId: draft.serviceId,
    isCustomJob: draft.isCustomJob,
    stubMode: stubAfterVehicle && step > CREATE_APPOINTMENT_STEP.VEHICLE,
    servicePickPhase: servicePhase === 'path' ? 'chooser' : 'catalog',
    servicePath,
    pricingSkipped,
    locationSkipped,
    addressSkipped,
    catalogPriceComplete,
    customer: visit.customer,
    appointmentLocationType: visit.locationType,
    shopAddressMissing,
    address: visit.address,
    vehicle: draft.vehicle,
    selectedDateKey: visit.scheduledDate,
    selectedTime: visit.startTime,
    hasCommittedJobs: committedJobs.length > 0,
  });

  const patchCustomer = useCallback(
    (patch: Partial<CreateAppointmentVisitState['customer']>) => {
      setVisit(prev => ({
        ...prev,
        customer: { ...prev.customer, ...patch },
      }));
    },
    []
  );

  const patchAddress = useCallback(
    (patch: Partial<CreateAppointmentAddress>) => {
      setVisit(prev => ({
        ...prev,
        address: { ...prev.address, ...patch },
      }));
    },
    []
  );

  const setLocationType = useCallback(
    (locationType: CreateAppointmentLocationType) => {
      setVisit(prev => {
        if (locationType === 'shop') {
          return {
            ...prev,
            locationType,
            address: shopAddressFromLocation(serviceLocation),
          };
        }
        return {
          ...prev,
          locationType,
          address: emptyAddress(),
        };
      });
    },
    [serviceLocation]
  );

  const patchVehicle = useCallback(
    (patch: Partial<CreateAppointmentVehicle>) => {
      setDraft(prev => ({
        ...prev,
        vehicle: { ...prev.vehicle, ...patch },
      }));
    },
    []
  );

  const chooseServicePath = useCallback((path: ServicePathChoice) => {
    setServicePath(path);
    if (path === 'catalog') {
      setDraft(prev => ({
        ...createEmptyJobDraft(prev.localId),
        vehicle: prev.vehicle,
      }));
    } else {
      setDraft(prev => ({
        ...createEmptyJobDraft(prev.localId),
        vehicle: prev.vehicle,
        isCustomJob: true,
        serviceId: null,
        serviceName: '',
      }));
    }
  }, []);

  const selectCatalogService = useCallback(
    (serviceId: string) => {
      const service = catalog.find(s => s.id === serviceId);
      if (!service) return;
      setDraft(prev => applyCatalogServiceToDraft(prev, service));
      setServicePath('catalog');
    },
    [catalog]
  );

  const selectPricingOption = useCallback(
    (optionId: string) => {
      if (!selectedService) return;
      const opt = selectedService.priceOptions.find(o => o.id === optionId);
      if (!opt) return;
      setDraft(prev => ({
        ...prev,
        pricingOption: {
          id: opt.id,
          label: opt.label,
          priceCents: opt.priceCents,
        },
        servicePriceCents: opt.priceCents,
        durationMinutes: opt.durationMinutes,
      }));
    },
    [selectedService]
  );

  const toggleAddon = useCallback(
    (addonId: string) => {
      if (!selectedService) return;
      const addon = selectedService.addOns.find(a => a.id === addonId);
      if (!addon) return;
      setDraft(prev => {
        const exists = prev.selectedAddOns.some(a => a.id === addonId);
        const selectedAddOns: CreateAppointmentAddonSelection[] = exists
          ? prev.selectedAddOns.filter(a => a.id !== addonId)
          : [
              ...prev.selectedAddOns,
              {
                id: addon.id,
                name: addon.name,
                priceCents: addon.priceCents,
                durationMinutes: addon.durationMinutes ?? 0,
              },
            ];
        return { ...prev, selectedAddOns };
      });
    },
    [selectedService]
  );

  const goContinue = useCallback(() => {
    if (!canContinue) return;

    if (step === CREATE_APPOINTMENT_STEP.SERVICE) {
      if (servicePhase === 'path') {
        if (servicePath === 'catalog') {
          setServicePhase('list');
          return;
        }
        if (servicePath === 'custom') {
          setDraft(prev => ({
            ...prev,
            isCustomJob: true,
            serviceId: null,
            serviceName: prev.serviceName || 'Custom job',
            servicePriceCents: prev.servicePriceCents || 10000,
            durationMinutes: prev.durationMinutes || 60,
            customPriceLabel: prev.customPriceLabel || '100',
          }));
          const next = getNextStepOnContinue({
            step,
            pricingSkipped: false,
            addonsSkipped: true,
            locationSkipped,
            addressSkipped,
            jobIndex,
            hasScheduleSlot,
          });
          setStep(next);
          return;
        }
        return;
      }
      const next = getNextStepOnContinue({
        step,
        ...navOpts,
        hasScheduleSlot,
      });
      setStep(next);
      return;
    }

    if (step === CREATE_APPOINTMENT_STEP.REVIEW) {
      setAppointmentConfirmed(true);
      return;
    }

    const next = getNextStepOnContinue({
      step,
      ...navOpts,
      hasScheduleSlot,
    });
    setStep(next);
  }, [
    canContinue,
    step,
    servicePhase,
    servicePath,
    navOpts,
    hasScheduleSlot,
    locationSkipped,
    addressSkipped,
    jobIndex,
  ]);

  const cancelInProgressExtraJob = useCallback(() => {
    if (committedJobs.length === 0) return;
    const last = committedJobs[committedJobs.length - 1];
    setCommittedJobs(prev => prev.slice(0, -1));
    setDraft({
      localId: last.localId,
      isCustomJob: last.isCustomJob,
      serviceId: last.serviceId,
      serviceName: last.serviceName,
      pricingOption: last.pricingOption,
      selectedAddOns: [...last.selectedAddOns],
      durationMinutes: Math.max(
        0,
        last.durationMinutes -
          last.selectedAddOns.reduce(
            (s, a) => s + (a.durationMinutes > 0 ? a.durationMinutes : 0),
            0
          )
      ),
      servicePriceCents: last.servicePriceCents,
      customPriceLabel: last.isCustomJob
        ? String(last.servicePriceCents / 100)
        : '',
      vehicle: { ...last.vehicle },
    });
    setServicePath(last.isCustomJob ? 'custom' : 'catalog');
    setServicePhase('path');
    setStep(
      hasScheduleSlot
        ? CREATE_APPOINTMENT_STEP.REVIEW
        : CREATE_APPOINTMENT_STEP.VEHICLE
    );
    setNotice(null);
  }, [committedJobs, hasScheduleSlot]);

  const addAnotherJob = useCallback(() => {
    const gate = canAddAnotherJob({
      committedCount: committedJobs.length,
      draft,
    });
    if (!gate.ok) {
      setNotice(gate.reason);
      return;
    }
    const snap = snapshotJobDraft(draft);
    if (!snap) {
      setNotice('Finish this job before adding another.');
      return;
    }
    setCommittedJobs(prev => [...prev, snap]);
    setDraft(createEmptyJobDraft(newLocalId('job')));
    setServicePath(null);
    setServicePhase('path');
    setStep(CREATE_APPOINTMENT_STEP.SERVICE);
    setNotice(null);
  }, [committedJobs.length, draft]);

  const goBack = useCallback(() => {
    if (appointmentConfirmed) return;

    if (step === CREATE_APPOINTMENT_STEP.SERVICE) {
      if (servicePhase === 'list') {
        setServicePhase('path');
        setDraft(prev => ({
          ...createEmptyJobDraft(prev.localId),
          vehicle: prev.vehicle,
        }));
        setServicePath('catalog');
        return;
      }
      if (jobIndex > 0) {
        cancelInProgressExtraJob();
        return;
      }
      return;
    }

    const prev = getPreviousStepOnBack({ step, ...navOpts });
    if (prev === CREATE_APPOINTMENT_STEP.SERVICE && servicePath === 'catalog') {
      setServicePhase('list');
    }
    setStep(Math.max(0, prev));
  }, [
    appointmentConfirmed,
    step,
    servicePhase,
    jobIndex,
    navOpts,
    servicePath,
    cancelInProgressExtraJob,
  ]);

  const setSchedule = useCallback(
    (next: { scheduledDate: string; startTime: string | null }) => {
      setVisit(v => ({
        ...v,
        scheduledDate: next.scheduledDate,
        startTime: next.startTime,
      }));
    },
    []
  );

  const headerTitle = useMemo(() => {
    if (step === CREATE_APPOINTMENT_STEP.SERVICE && servicePhase === 'list') {
      return jobIndex > 0
        ? `Choose service · Job ${jobIndex + 1}`
        : 'Choose a service';
    }
    return stepMeta.title;
  }, [step, servicePhase, jobIndex, stepMeta.title]);

  const headerSubtitle = useMemo(() => {
    if (step === CREATE_APPOINTMENT_STEP.SERVICE && servicePhase === 'list') {
      return jobIndex > 0
        ? 'Pick the next service for this visit.'
        : 'Pick from what you already offer.';
    }
    return stepMeta.subtitle;
  }, [step, servicePhase, jobIndex, stepMeta.subtitle]);

  return {
    step,
    stepMeta,
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
    setNotice,
    setDraft,
    setVisit,
    goContinue,
    goBack,
    servicePhase,
    servicePath,
    chooseServicePath,
    selectCatalogService,
    selectPricingOption,
    toggleAddon,
    selectedService,
    pricingSkipped,
    addonsSkipped,
    locationSkipped,
    addressSkipped,
    shopAddressMissing,
    setLocationType,
    patchCustomer,
    patchAddress,
    patchVehicle,
    addAnotherJob,
    setSchedule,
    visitDuration,
    reviewJobs,
    newLocalId,
  };
}

export type CreateAppointmentController = ReturnType<
  typeof useCreateAppointmentController
>;
