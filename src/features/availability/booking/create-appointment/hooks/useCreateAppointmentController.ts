'use client';

import { resolveBusinessIndustry } from '@/constants/businessTypes';
import type { PublicBookingServiceLocation } from '@/features/business-profile/utils/publicServiceLocation';
import { usePublicBlockedSlots } from '@/features/availability/booking/hooks/usePublicBlockedSlots';
import type { QuoteCatalogService } from '@/features/quotes/server/loadQuoteServiceCatalog';
import { useOwnerQuoteScheduling } from '@/features/quotes/hooks/useOwnerQuoteScheduling';
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
import { buildOwnerCreateAppointmentBody } from '../utils/buildOwnerCreateAppointmentBody';
import { canContinueCreateAppointmentStep } from '../utils/createFlowContinueGate';
import {
  getCreateAppointmentProgressFraction,
  getNextStepOnContinue,
  getPreviousStepOnBack,
} from '../utils/createFlowNavigation';
import { buildOwnerFlexibleWeeklySchedule } from '../utils/ownerFlexibleSchedule';
import { CREATE_APPOINTMENT_SUBMIT_MIN_MS } from '../constants/submitStatus';
import { normalizeUsPhoneDigits } from '@/lib/formatUsPhone';
import type { MembershipVisitPrefill } from '../types/membershipVisitPrefill';
import { shopAddressFieldsFromLocation } from '../../utils/bookingServiceLocationFlow';

export type ServiceStepPhase = 'path' | 'list';

function shopAddressFromLocation(
  loc: PublicBookingServiceLocation
): CreateAppointmentAddress {
  const fields = shopAddressFieldsFromLocation(loc);
  return {
    street: fields.streetAddress,
    unit: fields.unitApt,
    city: fields.city,
    state: fields.state,
    zip: fields.zip,
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
  businessId: string;
  businessSlug: string;
  businessType?: string | null;
  catalog: QuoteCatalogService[];
  serviceLocation: PublicBookingServiceLocation;
  /** When true, schedule/review continue gates are bypassed (tests / stubs). */
  stubAfterVehicle?: boolean;
  /** Prefill from membership Book visit. */
  membershipVisit?: MembershipVisitPrefill | null;
}

export function useCreateAppointmentController(
  options: UseCreateAppointmentControllerOptions
) {
  const {
    businessId,
    businessSlug,
    businessType,
    catalog,
    serviceLocation,
    stubAfterVehicle = false,
    membershipVisit = null,
  } = options;

  const reactId = useId();
  const membershipId = membershipVisit?.membershipId?.trim() || null;
  const [step, setStep] = useState<number>(() => {
    // Membership Book visit: land on custom job (Included price + duration).
    if (membershipVisit) return CREATE_APPOINTMENT_STEP.PRICING;
    return CREATE_APPOINTMENT_STEP.SERVICE;
  });
  const [servicePhase, setServicePhase] = useState<ServiceStepPhase>('path');
  const [servicePath, setServicePath] = useState<ServicePathChoice | null>(
    () => (membershipVisit ? 'custom' : null)
  );
  const [committedJobs, setCommittedJobs] = useState<
    CreateAppointmentJobSnapshot[]
  >([]);
  const [draft, setDraft] = useState<CreateAppointmentJobDraft>(() => {
    const base = createEmptyJobDraft(`job_${reactId}_0`);
    if (!membershipVisit) return base;
    const vehicle = membershipVisit.vehicle;
    const rawMinutes = Math.round(membershipVisit.visitDurationMinutes);
    const durationMinutes =
      Number.isFinite(rawMinutes) && rawMinutes >= 30 ? rawMinutes : 60;
    return {
      ...base,
      isCustomJob: true,
      serviceName: membershipVisit.planName.trim() || 'Membership visit',
      durationMinutes,
      servicePriceCents: 0,
      customPriceLabel: '0',
      vehicle: vehicle
        ? {
            year: vehicle.year.trim(),
            make: vehicle.make.trim(),
            model: vehicle.model.trim(),
          }
        : base.vehicle,
    };
  });

  // Keep membership price locked at $0 (Included UI) even if draft was stale.
  useEffect(() => {
    if (!membershipId) return;
    setDraft(prev => {
      if (
        prev.servicePriceCents === 0 &&
        prev.customPriceLabel === '0' &&
        prev.isCustomJob
      ) {
        return prev;
      }
      return {
        ...prev,
        isCustomJob: true,
        servicePriceCents: 0,
        customPriceLabel: '0',
      };
    });
  }, [membershipId]);
  const [visit, setVisit] = useState<CreateAppointmentVisitState>(() => {
    const base = createEmptyVisit();
    if (!membershipVisit) return base;
    let locationType = base.locationType;
    let address = base.address;
    const saved = membershipVisit.address;
    const hasSavedAddress = Boolean(
      saved?.street?.trim() &&
        saved.city?.trim() &&
        saved.state?.trim() &&
        saved.zip?.trim()
    );
    if (serviceLocation.mode === 'mobile_only') {
      locationType = 'mobile';
      if (hasSavedAddress && saved) {
        address = {
          street: saved.street.trim(),
          unit: saved.unit?.trim() || '',
          city: saved.city.trim(),
          state: saved.state.trim(),
          zip: saved.zip.trim(),
        };
      }
    } else if (serviceLocation.mode === 'shop_only') {
      locationType = 'shop';
      address = shopAddressFromLocation(serviceLocation);
    } else if (hasSavedAddress && saved) {
      // both: prefer mobile + CRM address so owner doesn't retype
      locationType = 'mobile';
      address = {
        street: saved.street.trim(),
        unit: saved.unit?.trim() || '',
        city: saved.city.trim(),
        state: saved.state.trim(),
        zip: saved.zip.trim(),
      };
    }
    return {
      ...base,
      customer: {
        fullName: membershipVisit.customerName.trim(),
        email:
          membershipVisit.email.trim() === '—'
            ? ''
            : membershipVisit.email.trim(),
        phone: normalizeUsPhoneDigits(membershipVisit.phone.trim()),
      },
      notes: membershipVisit.notes?.trim() || '',
      locationType,
      address,
    };
  });
  const [appointmentConfirmed, setAppointmentConfirmed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [locationSeeded, setLocationSeeded] = useState(() => {
    if (!membershipVisit) return false;
    if (
      serviceLocation.mode === 'mobile_only' ||
      serviceLocation.mode === 'shop_only'
    ) {
      return true;
    }
    // both + CRM address → location already set to mobile
    const saved = membershipVisit.address;
    return Boolean(
      saved?.street?.trim() &&
        saved.city?.trim() &&
        saved.state?.trim() &&
        saved.zip?.trim()
    );
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(
    null
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [scheduleExactConflict, setScheduleExactConflict] = useState(false);
  const [showScheduleConflictModal, setShowScheduleConflictModal] =
    useState(false);

  const jobIndex = committedJobs.length;
  const hasScheduleSlot = Boolean(visit.scheduledDate && visit.startTime);

  // Prefetch once for the whole create session — ScheduleStep remounts on
  // back/continue must not re-hit availability / blocked-slots APIs.
  const { weeklySchedule, loading: scheduleLoading } =
    useOwnerQuoteScheduling();
  const { blockedSlots, loading: blockedSlotsLoading } = usePublicBlockedSlots(
    businessSlug.trim() || undefined
  );
  const flexibleWeeklySchedule = useMemo(
    () => buildOwnerFlexibleWeeklySchedule(weeklySchedule),
    [weeklySchedule]
  );
  const scheduleDataLoading = scheduleLoading || blockedSlotsLoading;

  const visitDuration = useMemo(
    () => visitDurationMinutes(committedJobs, draft),
    [committedJobs, draft]
  );

  const reviewJobs = useMemo(
    () =>
      reviewJobsFromState(committedJobs, draft, {
        membershipPriceIncluded: Boolean(membershipId),
      }),
    [committedJobs, draft, membershipId]
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
  const resolvedIndustry = resolveBusinessIndustry(businessType);
  const vehicleSkipped =
    resolvedIndustry.value != null && !resolvedIndustry.showVehicleFields;

  const shopAddressMissing =
    visit.locationType === 'shop' && !serviceLocation.hasCompleteShopAddress;

  const navOpts = useMemo(
    () => ({
      pricingSkipped,
      addonsSkipped,
      locationSkipped,
      addressSkipped,
      vehicleSkipped,
      jobIndex,
    }),
    [
      pricingSkipped,
      addonsSkipped,
      locationSkipped,
      addressSkipped,
      vehicleSkipped,
      jobIndex,
    ]
  );

  const progress = getCreateAppointmentProgressFraction(step, {
    // Keep pricing/addons in the progress denominator even before a service
    // is chosen — otherwise selecting a tiered service shrinks the bar.
    appointmentConfirmed,
    pricingSkipped: false,
    addonsSkipped: false,
    locationSkipped,
    addressSkipped,
    vehicleSkipped,
    jobIndex,
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
    serviceName: draft.serviceName,
    customPriceLabel: draft.customPriceLabel,
    durationMinutes: draft.durationMinutes,
    membershipPriceIncluded: Boolean(membershipId),
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
        customPriceLabel: '',
        durationMinutes: 0,
        servicePriceCents: 0,
      }));
    }
  }, []);

  const patchDraft = useCallback(
    (patch: Partial<CreateAppointmentJobDraft>) => {
      setDraft(prev => ({ ...prev, ...patch }));
    },
    []
  );

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

  const submitAppointment = useCallback(async () => {
    if (isSubmitting) return;

    const startedAt = Date.now();
    const waitMinDisplay = async () => {
      const elapsed = Date.now() - startedAt;
      const remaining = CREATE_APPOINTMENT_SUBMIT_MIN_MS - elapsed;
      if (remaining > 0) {
        await new Promise<void>(resolve => {
          window.setTimeout(resolve, remaining);
        });
      }
    };

    const jobs = reviewJobsFromState(committedJobs, draft, {
      membershipPriceIncluded: Boolean(membershipId),
    });
    if (jobs.length === 0) {
      setNotice('Add at least one job before confirming.');
      return;
    }
    if (!visit.scheduledDate || !visit.startTime || !visit.locationType) {
      setNotice('Pick a date, time, and location before confirming.');
      return;
    }

    setIsSubmitting(true);
    setNotice(null);
    setSubmitError(null);
    try {
      const body = buildOwnerCreateAppointmentBody({
        businessId,
        businessSlug,
        visit,
        jobs,
        membershipId,
      });
      const res = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        data?: { id?: string };
      } | null;

      await waitMinDisplay();

      if (!res.ok || !json?.success) {
        setSubmitError(
          typeof json?.error === 'string' && json.error.trim()
            ? json.error.trim()
            : 'Could not create the appointment. Please try again.'
        );
        return;
      }

      setConfirmedBookingId(
        typeof json.data?.id === 'string' ? json.data.id : null
      );
      setAppointmentConfirmed(true);
    } catch {
      await waitMinDisplay();
      setSubmitError('Could not create the appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    committedJobs,
    draft,
    visit,
    businessId,
    businessSlug,
    membershipId,
  ]);

  const goContinue = useCallback(() => {
    if (!canContinue || isSubmitting) return;

    if (step === CREATE_APPOINTMENT_STEP.SERVICE) {
      if (servicePhase === 'path') {
        if (servicePath === 'catalog') {
          setServicePhase('list');
          return;
        }
        if (servicePath === 'custom') {
          const next = getNextStepOnContinue({
            step,
            pricingSkipped: false,
            addonsSkipped: true,
            locationSkipped,
            addressSkipped,
            vehicleSkipped,
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
      void submitAppointment();
      return;
    }

    if (step === CREATE_APPOINTMENT_STEP.SCHEDULE && scheduleExactConflict) {
      setShowScheduleConflictModal(true);
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
    isSubmitting,
    step,
    servicePhase,
    servicePath,
    navOpts,
    hasScheduleSlot,
    locationSkipped,
    addressSkipped,
    vehicleSkipped,
    jobIndex,
    submitAppointment,
    scheduleExactConflict,
  ]);

  const confirmScheduleDespiteConflict = useCallback(() => {
    setShowScheduleConflictModal(false);
    const next = getNextStepOnContinue({
      step: CREATE_APPOINTMENT_STEP.SCHEDULE,
      ...navOpts,
      hasScheduleSlot,
    });
    setStep(next);
  }, [navOpts, hasScheduleSlot]);

  const dismissScheduleConflictModal = useCallback(() => {
    setShowScheduleConflictModal(false);
  }, []);

  const setExactStartConflict = useCallback((hasConflict: boolean) => {
    setScheduleExactConflict(hasConflict);
    if (!hasConflict) setShowScheduleConflictModal(false);
  }, []);

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
      hasScheduleSlot || vehicleSkipped
        ? CREATE_APPOINTMENT_STEP.REVIEW
        : CREATE_APPOINTMENT_STEP.VEHICLE
    );
    setNotice(null);
  }, [committedJobs, hasScheduleSlot, vehicleSkipped]);

  const addAnotherJob = useCallback(() => {
    const gate = canAddAnotherJob({
      committedCount: committedJobs.length,
      draft,
    });
    if (!gate.ok) {
      setNotice(gate.reason);
      return;
    }
    const snap = snapshotJobDraft(draft, {
      membershipPriceIncluded: Boolean(membershipId),
    });
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
  }, [committedJobs.length, draft, membershipId]);

  const goBack = useCallback(() => {
    if (appointmentConfirmed || isSubmitting) return;

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

    // Membership Book visit starts on custom job — no prior step.
    if (membershipId && step === CREATE_APPOINTMENT_STEP.PRICING) {
      return;
    }

    const prev = getPreviousStepOnBack({ step, ...navOpts });
    if (prev === CREATE_APPOINTMENT_STEP.SERVICE && servicePath === 'catalog') {
      setServicePhase('list');
    }
    // Don't send membership flow back to the service chooser.
    if (
      membershipId &&
      (prev === CREATE_APPOINTMENT_STEP.SERVICE ||
        prev < CREATE_APPOINTMENT_STEP.PRICING)
    ) {
      return;
    }
    setStep(Math.max(0, prev));
  }, [
    appointmentConfirmed,
    isSubmitting,
    step,
    servicePhase,
    jobIndex,
    navOpts,
    servicePath,
    membershipId,
    cancelInProgressExtraJob,
  ]);

  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  const setSchedule = useCallback(
    (next: { scheduledDate: string; startTime: string | null }) => {
      setShowScheduleConflictModal(false);
      setVisit(v => ({
        ...v,
        scheduledDate: next.scheduledDate,
        startTime: next.startTime,
      }));
    },
    []
  );

  const setApplySale = useCallback((applySale: boolean) => {
    setVisit(v => ({ ...v, applySale }));
  }, []);

  const headerTitle = useMemo(() => {
    if (step === CREATE_APPOINTMENT_STEP.SERVICE && servicePhase === 'list') {
      return 'Choose a service';
    }
    if (step === CREATE_APPOINTMENT_STEP.PRICING && draft.isCustomJob) {
      return 'Custom job';
    }
    return stepMeta.title;
  }, [step, servicePhase, draft.isCustomJob, stepMeta.title]);

  const headerSubtitle = useMemo((): string | undefined => {
    if (step === CREATE_APPOINTMENT_STEP.SERVICE && servicePhase === 'list') {
      return 'Pick from what you already offer.';
    }
    if (step === CREATE_APPOINTMENT_STEP.PRICING && draft.isCustomJob) {
      return 'Name the work, then set duration and price.';
    }
    if (
      step === CREATE_APPOINTMENT_STEP.PRICING ||
      step === CREATE_APPOINTMENT_STEP.ADDONS
    ) {
      return undefined;
    }
    const subtitle = stepMeta.subtitle?.trim();
    return subtitle || undefined;
  }, [step, servicePhase, draft.isCustomJob, stepMeta.subtitle]);

  return {
    step,
    stepMeta,
    headerTitle,
    headerSubtitle,
    progress,
    canContinue,
    appointmentConfirmed,
    confirmedBookingId,
    membershipId,
    isSubmitting,
    submitError,
    clearSubmitError,
    committedJobs,
    draft,
    visit,
    jobIndex,
    notice,
    setNotice,
    setDraft,
    setVisit,
    goContinue,
    confirmScheduleDespiteConflict,
    dismissScheduleConflictModal,
    setExactStartConflict,
    showScheduleConflictModal,
    scheduleExactConflict,
    goBack,
    servicePhase,
    servicePath,
    chooseServicePath,
    selectCatalogService,
    selectPricingOption,
    toggleAddon,
    patchDraft,
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
    setApplySale,
    visitDuration,
    reviewJobs,
    flexibleWeeklySchedule,
    blockedSlots,
    scheduleDataLoading,
    newLocalId,
  };
}

export type CreateAppointmentController = ReturnType<
  typeof useCreateAppointmentController
>;
