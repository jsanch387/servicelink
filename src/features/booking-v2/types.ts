export type BookingV2Vehicle = {
  year: string;
  make: string;
  model: string;
};

/** Pet snapshot for grooming and other pet businesses. */
export type BookingV2Pet = {
  name: string;
  species: string;
  breed: string;
  size: string;
};

/** Add-on snapshot so the cart can render without another lookup. */
export type BookingV2CartAddOn = {
  id: string;
  name: string;
  priceCents: number;
};

/** One configured service, ready for the visit cart. */
export type BookingV2CartItem = {
  serviceId: string;
  serviceName: string;
  priceOptionId: string | null;
  priceOptionLabel: string | null;
  addOnIds: string[];
  addOns: BookingV2CartAddOn[];
  vehicle: BookingV2Vehicle;
  /** Set for pet businesses. Vehicle stays empty on those jobs. */
  pet?: BookingV2Pet;
  /** Price after an active sale. */
  dueCents: number;
  originalCents: number;
  durationMinutes: number;
};

/** Visit-level choice. Only asked when the business offers both. */
export type BookingV2ServiceLocation = 'mobile' | 'shop';

/** Visit-level appointment. `date` is YYYY-MM-DD, `time` is HH:mm. */
export type BookingV2Schedule = {
  date: string;
  time: string;
};

/** Visit-level contact. Phone is 10 US digits. */
export type BookingV2Customer = {
  phone: string;
  fullName: string;
  email: string;
  streetAddress: string;
  unitApt: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
};

export type BookingV2Cart = {
  items: BookingV2CartItem[];
  serviceLocation: BookingV2ServiceLocation | null;
  schedule: BookingV2Schedule | null;
  customer: BookingV2Customer;
};
