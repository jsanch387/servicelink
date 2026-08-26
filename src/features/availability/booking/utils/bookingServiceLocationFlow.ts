import type { PublicBookingServiceLocation } from '@/features/business-profile/utils/publicServiceLocation';
import type { CustomerFormData } from '../types';
import type { CustomerFormStep } from '../components/CustomerForm';
import {
  isCustomerFormStepValid,
  isCustomerFormValid,
} from '../components/CustomerForm';

export type BookingDetailsSubStep = CustomerFormStep;

export type CustomerServiceChoice = 'mobile' | 'shop' | null;

export function customerBookingUsesShop(
  serviceLocation: PublicBookingServiceLocation,
  customerChoice: CustomerServiceChoice
): boolean {
  if (serviceLocation.mode === 'shop_only') return true;
  if (serviceLocation.mode === 'both' && customerChoice === 'shop') return true;
  return false;
}

function shopBookingHasCompleteAddress(
  serviceLocation: PublicBookingServiceLocation,
  customerChoice: CustomerServiceChoice
): boolean {
  if (!customerBookingUsesShop(serviceLocation, customerChoice)) return true;
  return serviceLocation.hasCompleteShopAddress;
}

export function customerAddressEntryRequired(
  serviceLocation: PublicBookingServiceLocation,
  customerChoice: CustomerServiceChoice
): boolean {
  if (serviceLocation.mode === 'mobile_only') return true;
  if (serviceLocation.mode === 'shop_only') return false;
  return customerChoice === 'mobile';
}

export function clearCustomerServiceAddress(
  customer: CustomerFormData
): CustomerFormData {
  return {
    ...customer,
    streetAddress: '',
    unitApt: '',
    city: '',
    state: '',
    zip: '',
  };
}

export function prefillCustomerWithShopAddress(
  customer: CustomerFormData,
  serviceLocation: PublicBookingServiceLocation
): CustomerFormData {
  return {
    ...customer,
    streetAddress: serviceLocation.shopStreet,
    unitApt: serviceLocation.shopUnit,
    city: serviceLocation.city,
    state: serviceLocation.state,
    zip: serviceLocation.zip,
  };
}

export function getNextDetailsSubStep(
  current: BookingDetailsSubStep,
  _serviceLocation: PublicBookingServiceLocation,
  _customerChoice: CustomerServiceChoice
): BookingDetailsSubStep | 'review' {
  // Contact + service address are collapsed into a single 'contact' screen.
  if (current === 'contact') return 'vehicleNotes';
  return 'review';
}

export function getPrevDetailsSubStep(
  current: BookingDetailsSubStep,
  _serviceLocation: PublicBookingServiceLocation,
  _customerChoice: CustomerServiceChoice
): BookingDetailsSubStep | 'schedule' {
  if (current === 'contact') return 'schedule';
  return 'contact';
}

export function isCustomerServiceLocationChoiceValid(
  serviceLocation: PublicBookingServiceLocation,
  customerChoice: CustomerServiceChoice
): boolean {
  if (serviceLocation.mode !== 'both') return true;
  if (customerChoice !== 'mobile' && customerChoice !== 'shop') return false;
  return shopBookingHasCompleteAddress(serviceLocation, customerChoice);
}

export function isBookingDetailsSubStepValid(
  step: BookingDetailsSubStep,
  customer: CustomerFormData,
  serviceLocation: PublicBookingServiceLocation,
  customerChoice: CustomerServiceChoice,
  options: {
    showVehicleFields: boolean;
    requireVehicleFields?: boolean;
    showPetFields?: boolean;
    requirePetFields?: boolean;
    emailOptional: boolean;
  }
): boolean {
  const requireCustomerAddress = customerAddressEntryRequired(
    serviceLocation,
    customerChoice
  );

  if (step === 'contact' || step === 'vehicleNotes') {
    if (
      step === 'contact' &&
      !shopBookingHasCompleteAddress(serviceLocation, customerChoice)
    ) {
      return false;
    }
    return isCustomerFormStepValid(
      customer,
      step,
      options.requireVehicleFields ?? options.showVehicleFields,
      options.emailOptional,
      requireCustomerAddress,
      options.requirePetFields ?? options.showPetFields ?? false
    );
  }

  return false;
}

export function resolveCustomerServiceLocationPayload(
  serviceLocation: PublicBookingServiceLocation,
  customerChoice: CustomerServiceChoice
): 'mobile' | 'shop' | undefined {
  if (serviceLocation.mode === 'both') {
    return customerChoice ?? undefined;
  }
  if (serviceLocation.mode === 'shop_only') return 'shop';
  return 'mobile';
}

export function isBookingCustomerDetailsValid(
  customer: CustomerFormData,
  serviceLocation: PublicBookingServiceLocation,
  customerChoice: CustomerServiceChoice,
  showVehicleFields: boolean,
  emailOptional: boolean,
  requireVehicleFields = showVehicleFields,
  requirePetFields = false
): boolean {
  if (serviceLocation.mode === 'both' && customerChoice === null) {
    return false;
  }

  if (
    customerBookingUsesShop(serviceLocation, customerChoice) &&
    !serviceLocation.hasCompleteShopAddress
  ) {
    return false;
  }

  const requireCustomerAddress = customerAddressEntryRequired(
    serviceLocation,
    customerChoice
  );

  return isCustomerFormValid(
    customer,
    requireVehicleFields,
    emailOptional,
    requireCustomerAddress,
    requirePetFields
  );
}
