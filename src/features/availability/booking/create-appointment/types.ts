export type CreateAppointmentLocationType = 'mobile' | 'shop';

export interface CreateAppointmentCustomer {
  fullName: string;
  phone: string;
  email: string;
}

export interface CreateAppointmentAddress {
  street: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
}

export interface CreateAppointmentVehicle {
  year: string;
  make: string;
  model: string;
}

export interface CreateAppointmentAddonSelection {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes: number;
}

export interface CreateAppointmentPricingOption {
  id: string;
  label: string | null;
  priceCents: number;
}

/** Frozen job after “Add another job” or final snapshot before POST. */
export interface CreateAppointmentJobSnapshot {
  localId: string;
  isCustomJob: boolean;
  serviceId: string | null;
  serviceName: string;
  pricingOption: CreateAppointmentPricingOption | null;
  selectedAddOns: CreateAppointmentAddonSelection[];
  /** Job total duration including add-on duration contribution. */
  durationMinutes: number;
  /** Service/custom price only (before add-ons). */
  servicePriceCents: number;
  vehicle: CreateAppointmentVehicle;
}

export interface CreateAppointmentJobDraft {
  localId: string;
  isCustomJob: boolean;
  /** Chooser: null until catalog or custom is picked. */
  serviceId: string | null;
  serviceName: string;
  pricingOption: CreateAppointmentPricingOption | null;
  selectedAddOns: CreateAppointmentAddonSelection[];
  /** Catalog base duration (before add-ons) or custom duration. */
  durationMinutes: number;
  servicePriceCents: number;
  /** Custom job fields when isCustomJob. */
  customPriceLabel: string;
  vehicle: CreateAppointmentVehicle;
}

export interface CreateAppointmentVisitState {
  customer: CreateAppointmentCustomer;
  locationType: CreateAppointmentLocationType | null;
  address: CreateAppointmentAddress;
  scheduledDate: string | null;
  startTime: string | null;
  /** Appointment-level notes (not a customer profile field). */
  notes: string;
}

export function emptyCustomer(): CreateAppointmentCustomer {
  return { fullName: '', phone: '', email: '' };
}

export function emptyAddress(): CreateAppointmentAddress {
  return { street: '', unit: '', city: '', state: '', zip: '' };
}

export function emptyVehicle(): CreateAppointmentVehicle {
  return { year: '', make: '', model: '' };
}

export function createEmptyJobDraft(localId: string): CreateAppointmentJobDraft {
  return {
    localId,
    isCustomJob: false,
    serviceId: null,
    serviceName: '',
    pricingOption: null,
    selectedAddOns: [],
    durationMinutes: 0,
    servicePriceCents: 0,
    customPriceLabel: '',
    vehicle: emptyVehicle(),
  };
}

export function createEmptyVisit(): CreateAppointmentVisitState {
  return {
    customer: emptyCustomer(),
    locationType: null,
    address: emptyAddress(),
    scheduledDate: null,
    startTime: null,
    notes: '',
  };
}
