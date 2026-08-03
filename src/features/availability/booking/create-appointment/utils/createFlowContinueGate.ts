import { CREATE_APPOINTMENT_STEP } from '../constants';
import type {
  CreateAppointmentAddress,
  CreateAppointmentCustomer,
  CreateAppointmentLocationType,
  CreateAppointmentVehicle,
} from '../types';
import {
  isAddressStepComplete,
  isCustomJobPricingComplete,
  isCustomerStepComplete,
  isLocationStepComplete,
  isReviewVisitFieldsComplete,
  isVehicleStepComplete,
} from './createAppointmentValidators';

export interface CanContinueCreateAppointmentArgs {
  appointmentConfirmed: boolean;
  step: number;
  selectedServiceId: string | null;
  isCustomJob?: boolean;
  customJobComplete?: boolean;
  pricingSkipped?: boolean;
  locationSkipped?: boolean;
  addressSkipped?: boolean;
  /** Allow continue on steps after catalog for unfinished slices. */
  stubMode?: boolean;
  /** Service step: path chooser vs catalog list. */
  servicePickPhase?: 'chooser' | 'catalog';
  /** Path chosen on chooser (catalog | custom). */
  servicePath?: 'catalog' | 'custom' | null;
  acceptBookings?: boolean;
  scheduleLoading?: boolean;
  selectedDateKey?: string | null;
  selectedTime?: string | null;
  timeSlots?: string[];
  customer?: CreateAppointmentCustomer;
  appointmentLocationType?: CreateAppointmentLocationType | null;
  shopAddressMissing?: boolean;
  address?: CreateAppointmentAddress;
  vehicle?: CreateAppointmentVehicle;
  catalogPriceComplete?: boolean;
  hasCommittedJobs?: boolean;
  customPriceLabel?: string;
  serviceName?: string;
  durationMinutes?: number;
}

/**
 * Whether Continue / Confirm is allowed for the current wizard step.
 */
export function canContinueCreateAppointmentStep(
  p: CanContinueCreateAppointmentArgs
): boolean {
  if (p.appointmentConfirmed) return false;

  if (p.step === CREATE_APPOINTMENT_STEP.SERVICE) {
    if (p.servicePickPhase === 'chooser') {
      return p.servicePath === 'catalog' || p.servicePath === 'custom';
    }
    // catalog list
    return Boolean(p.selectedServiceId) && !p.isCustomJob;
  }

  if (p.stubMode) {
    return true;
  }

  if (p.step === CREATE_APPOINTMENT_STEP.PRICING) {
    if (p.isCustomJob) {
      return isCustomJobPricingComplete({
        serviceName: p.serviceName,
        customPriceLabel: p.customPriceLabel,
        durationMinutes: p.durationMinutes,
      });
    }
    if (p.pricingSkipped) return true;
    return p.catalogPriceComplete !== false;
  }
  if (p.step === CREATE_APPOINTMENT_STEP.ADDONS) return true;
  if (p.step === CREATE_APPOINTMENT_STEP.LOCATION) {
    if (p.locationSkipped) return true;
    if (!isLocationStepComplete(p.appointmentLocationType)) return false;
    if (p.shopAddressMissing) return false;
    return true;
  }
  if (p.step === CREATE_APPOINTMENT_STEP.ADDRESS) {
    return isAddressStepComplete(p.address);
  }
  if (p.step === CREATE_APPOINTMENT_STEP.VEHICLE) {
    return isVehicleStepComplete(p.vehicle);
  }
  if (p.step === CREATE_APPOINTMENT_STEP.SCHEDULE) {
    // Owner flow: freer than public — date + time is enough.
    // Optional `timeSlots` / `acceptBookings` still supported for public-style callers.
    if (p.acceptBookings === false) return false;
    if (p.scheduleLoading) return false;
    if (!p.selectedDateKey || !p.selectedTime) return false;
    if (Array.isArray(p.timeSlots) && p.timeSlots.length > 0) {
      return p.timeSlots.includes(p.selectedTime);
    }
    return true;
  }
  if (p.step === CREATE_APPOINTMENT_STEP.CUSTOMER) {
    return isCustomerStepComplete(p.customer);
  }
  if (p.step === CREATE_APPOINTMENT_STEP.REVIEW) {
    const visitReady = isReviewVisitFieldsComplete({
      selectedDateKey: p.selectedDateKey ?? null,
      selectedTime: p.selectedTime ?? null,
      customer: p.customer ?? { fullName: '', phone: '', email: '' },
      appointmentLocationType: p.appointmentLocationType,
      locationSkipped: p.locationSkipped,
      addressSkipped: p.addressSkipped,
      address: p.address ?? {
        street: '',
        unit: '',
        city: '',
        state: '',
        zip: '',
      },
    });
    if (!visitReady) return false;
    const hasActiveJobDraft =
      Boolean(p.selectedServiceId) || Boolean(p.isCustomJob);
    if (!hasActiveJobDraft) return Boolean(p.hasCommittedJobs);
    if (p.isCustomJob) {
      return (
        isCustomJobPricingComplete({
          serviceName: p.serviceName,
          customPriceLabel: p.customPriceLabel,
          durationMinutes: p.durationMinutes,
        }) && isVehicleStepComplete(p.vehicle)
      );
    }
    if (!p.isCustomJob && p.catalogPriceComplete === false) return false;
    return isVehicleStepComplete(p.vehicle);
  }
  return true;
}
