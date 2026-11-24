import type { PublicBookingServiceLocation } from '@/features/business-profile/utils/publicServiceLocation';
import { normalizeUsPhoneDigits } from '@/lib/formatUsPhone';
import { shopAddressFieldsFromLocation } from '../../utils/bookingServiceLocationFlow';
import {
  emptyAddress,
  type CreateAppointmentAddress,
  type CreateAppointmentVisitState,
} from '../types';

export type SavedCustomerBookingDetails = {
  customerName: string;
  email: string;
  phone: string;
  notes?: string;
  address?: CreateAppointmentAddress | null;
};

function hasSavedAddress(
  address: CreateAppointmentAddress | null | undefined
): address is CreateAppointmentAddress {
  return Boolean(
    address?.street?.trim() &&
      address.city?.trim() &&
      address.state?.trim() &&
      address.zip?.trim()
  );
}

/**
 * Fill the visit's customer, notes, and service location from a saved customer.
 * Shop-only visits keep the shop address. Mobile visits use the customer's address.
 */
export function seedVisitFromSavedCustomer(args: {
  base: CreateAppointmentVisitState;
  serviceLocation: PublicBookingServiceLocation;
  details: SavedCustomerBookingDetails;
}): { visit: CreateAppointmentVisitState; locationSeeded: boolean } {
  const { base, serviceLocation, details } = args;
  const saved = hasSavedAddress(details.address) ? details.address : null;
  let locationType = base.locationType;
  let address = base.address;
  let locationSeeded = false;

  if (serviceLocation.mode === 'mobile_only') {
    locationType = 'mobile';
    locationSeeded = true;
    if (saved) {
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
    locationSeeded = true;
    const fields = shopAddressFieldsFromLocation(serviceLocation);
    address = {
      street: fields.streetAddress,
      unit: fields.unitApt,
      city: fields.city,
      state: fields.state,
      zip: fields.zip,
    };
  } else if (saved) {
    locationType = 'mobile';
    locationSeeded = true;
    address = {
      street: saved.street.trim(),
      unit: saved.unit?.trim() || '',
      city: saved.city.trim(),
      state: saved.state.trim(),
      zip: saved.zip.trim(),
    };
  } else {
    address = emptyAddress();
  }

  const email = details.email.trim();
  return {
    locationSeeded,
    visit: {
      ...base,
      customer: {
        fullName: details.customerName.trim(),
        email: email === '—' ? '' : email,
        phone: normalizeUsPhoneDigits(details.phone.trim()),
      },
      notes: details.notes?.trim() || '',
      locationType,
      address,
    },
  };
}
