import { PUBLIC_BOOKING_MAX_JOBS } from '@/features/availability/booking/constants/publicBookingJobs';
import type {
  BookingV2Cart,
  BookingV2CartAddOn,
  BookingV2CartItem,
  BookingV2Customer,
  BookingV2Pet,
  BookingV2Schedule,
  BookingV2ServiceLocation,
  BookingV2Vehicle,
} from '../types';

function cartKey(businessSlug: string): string {
  return `servicelink.bookingV2Cart.v1:${businessSlug.trim()}`;
}

export function emptyBookingV2Customer(): BookingV2Customer {
  return {
    phone: '',
    fullName: '',
    email: '',
    streetAddress: '',
    unitApt: '',
    city: '',
    state: '',
    zip: '',
    notes: '',
  };
}

function readCustomer(value: unknown): BookingV2Customer {
  const empty = emptyBookingV2Customer();
  if (!value || typeof value !== 'object') return empty;
  const customer = value as Partial<BookingV2Customer>;
  return {
    phone: typeof customer.phone === 'string' ? customer.phone : '',
    fullName: typeof customer.fullName === 'string' ? customer.fullName : '',
    email: typeof customer.email === 'string' ? customer.email : '',
    streetAddress:
      typeof customer.streetAddress === 'string' ? customer.streetAddress : '',
    unitApt: typeof customer.unitApt === 'string' ? customer.unitApt : '',
    city: typeof customer.city === 'string' ? customer.city : '',
    state: typeof customer.state === 'string' ? customer.state : '',
    zip: typeof customer.zip === 'string' ? customer.zip : '',
    notes: typeof customer.notes === 'string' ? customer.notes : '',
  };
}

function emptyCart(): BookingV2Cart {
  return {
    items: [],
    serviceLocation: null,
    schedule: null,
    customer: emptyBookingV2Customer(),
  };
}

function readSchedule(value: unknown): BookingV2Schedule | null {
  if (!value || typeof value !== 'object') return null;
  const schedule = value as Partial<BookingV2Schedule>;
  if (
    typeof schedule.date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(schedule.date) ||
    typeof schedule.time !== 'string' ||
    !/^\d{2}:\d{2}$/.test(schedule.time)
  ) {
    return null;
  }
  return { date: schedule.date, time: schedule.time };
}

function isLocation(value: unknown): value is BookingV2ServiceLocation {
  return value === 'mobile' || value === 'shop';
}

function readVehicle(value: unknown): BookingV2Vehicle {
  const vehicle = value as Partial<BookingV2Vehicle> | null;
  return {
    year: typeof vehicle?.year === 'string' ? vehicle.year : '',
    make: typeof vehicle?.make === 'string' ? vehicle.make : '',
    model: typeof vehicle?.model === 'string' ? vehicle.model : '',
  };
}

function readPet(value: unknown): BookingV2Pet | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const pet = value as Partial<BookingV2Pet>;
  const name = typeof pet.name === 'string' ? pet.name : '';
  const species = typeof pet.species === 'string' ? pet.species : '';
  const breed = typeof pet.breed === 'string' ? pet.breed : '';
  const size = typeof pet.size === 'string' ? pet.size : '';
  if (!name && !species && !breed && !size) return undefined;
  return { name, species, breed, size };
}

function readAddOns(value: unknown): BookingV2CartAddOn[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(entry => {
    if (!entry || typeof entry !== 'object') return [];
    const addOn = entry as Partial<BookingV2CartAddOn>;
    if (typeof addOn.id !== 'string' || typeof addOn.name !== 'string') {
      return [];
    }
    return [
      {
        id: addOn.id,
        name: addOn.name,
        priceCents: typeof addOn.priceCents === 'number' ? addOn.priceCents : 0,
      },
    ];
  });
}

function readItem(value: unknown): BookingV2CartItem | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<BookingV2CartItem>;
  if (
    typeof item.serviceId !== 'string' ||
    typeof item.serviceName !== 'string'
  ) {
    return null;
  }
  const addOns = readAddOns(item.addOns);
  const addOnIds = Array.isArray(item.addOnIds)
    ? item.addOnIds.filter((id): id is string => typeof id === 'string')
    : addOns.map(addOn => addOn.id);

  return {
    serviceId: item.serviceId,
    serviceName: item.serviceName,
    priceOptionId:
      typeof item.priceOptionId === 'string' ? item.priceOptionId : null,
    priceOptionLabel:
      typeof item.priceOptionLabel === 'string' ? item.priceOptionLabel : null,
    addOnIds,
    addOns,
    vehicle: readVehicle(item.vehicle),
    pet: readPet(item.pet),
    dueCents: typeof item.dueCents === 'number' ? item.dueCents : 0,
    originalCents:
      typeof item.originalCents === 'number' ? item.originalCents : 0,
    durationMinutes:
      typeof item.durationMinutes === 'number' ? item.durationMinutes : 0,
  };
}

function readCart(raw: string | null): BookingV2Cart {
  if (!raw) return emptyCart();
  try {
    const parsed = JSON.parse(raw) as Partial<BookingV2Cart>;
    const items = Array.isArray(parsed.items)
      ? parsed.items.flatMap(item => {
          const next = readItem(item);
          return next ? [next] : [];
        })
      : [];
    return {
      items,
      serviceLocation: isLocation(parsed.serviceLocation)
        ? parsed.serviceLocation
        : null,
      schedule: readSchedule(parsed.schedule),
      customer: readCustomer(parsed.customer),
    };
  } catch {
    return emptyCart();
  }
}

function writeCart(businessSlug: string, cart: BookingV2Cart): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(cartKey(businessSlug), JSON.stringify(cart));
}

export function readBookingV2Cart(businessSlug: string): BookingV2Cart {
  if (typeof window === 'undefined') return emptyCart();
  return readCart(window.sessionStorage.getItem(cartKey(businessSlug)));
}

/** Starts the visit with this service. Later screens append from here. */
export function saveBookingV2SetupItem(
  businessSlug: string,
  item: BookingV2CartItem
): void {
  const existing = readBookingV2Cart(businessSlug);
  writeCart(businessSlug, {
    items: [item],
    serviceLocation: existing.serviceLocation,
    schedule: null,
    customer: existing.customer,
  });
}

/** Adds a service to the visit. Returns false when the visit is already full. */
export function appendBookingV2CartItem(
  businessSlug: string,
  item: BookingV2CartItem
): boolean {
  const existing = readBookingV2Cart(businessSlug);
  if (existing.items.length >= PUBLIC_BOOKING_MAX_JOBS) return false;
  writeCart(businessSlug, {
    items: [...existing.items, item],
    serviceLocation: existing.serviceLocation,
    schedule: existing.schedule,
    customer: existing.customer,
  });
  return true;
}

/** Replaces one service and keeps the rest of the visit. */
export function replaceBookingV2CartItem(
  businessSlug: string,
  index: number,
  item: BookingV2CartItem
): void {
  const existing = readBookingV2Cart(businessSlug);
  if (index < 0 || index >= existing.items.length) {
    appendBookingV2CartItem(businessSlug, item);
    return;
  }
  writeCart(businessSlug, {
    items: existing.items.map((current, itemIndex) =>
      itemIndex === index ? item : current
    ),
    serviceLocation: existing.serviceLocation,
    schedule: existing.schedule,
    customer: existing.customer,
  });
}

export function removeBookingV2CartItem(
  businessSlug: string,
  index: number
): BookingV2Cart {
  const existing = readBookingV2Cart(businessSlug);
  const cart: BookingV2Cart = {
    items: existing.items.filter((_, itemIndex) => itemIndex !== index),
    serviceLocation: existing.serviceLocation,
    schedule: existing.schedule,
    customer: existing.customer,
  };
  writeCart(businessSlug, cart);
  return cart;
}

export function saveBookingV2Schedule(
  businessSlug: string,
  schedule: BookingV2Schedule
): BookingV2Cart {
  const existing = readBookingV2Cart(businessSlug);
  const cart: BookingV2Cart = { ...existing, schedule };
  writeCart(businessSlug, cart);
  return cart;
}

export function saveBookingV2Customer(
  businessSlug: string,
  customer: BookingV2Customer
): BookingV2Cart {
  const existing = readBookingV2Cart(businessSlug);
  const cart: BookingV2Cart = { ...existing, customer };
  writeCart(businessSlug, cart);
  return cart;
}

export type BookingV2CheckoutSnapshot = {
  choice: 'pay_now' | 'pay_in_person';
  amountCents: number;
  kind: 'paid' | 'deposit' | 'later';
};

function checkoutKey(businessSlug: string): string {
  return `servicelink.bookingV2Checkout.v1:${businessSlug}`;
}

export function saveBookingV2CheckoutSnapshot(
  businessSlug: string,
  snapshot: BookingV2CheckoutSnapshot
): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(
    checkoutKey(businessSlug),
    JSON.stringify(snapshot)
  );
}

export function readBookingV2CheckoutSnapshot(
  businessSlug: string
): BookingV2CheckoutSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const parsed = JSON.parse(
      window.sessionStorage.getItem(checkoutKey(businessSlug)) ?? ''
    ) as Partial<BookingV2CheckoutSnapshot>;
    if (parsed.choice !== 'pay_now' && parsed.choice !== 'pay_in_person') {
      return null;
    }
    if (
      parsed.kind !== 'paid' &&
      parsed.kind !== 'deposit' &&
      parsed.kind !== 'later'
    ) {
      return null;
    }
    if (typeof parsed.amountCents !== 'number' || parsed.amountCents < 0) {
      return null;
    }
    return {
      choice: parsed.choice,
      amountCents: Math.round(parsed.amountCents),
      kind: parsed.kind,
    };
  } catch {
    return null;
  }
}

export function saveBookingV2ServiceLocation(
  businessSlug: string,
  serviceLocation: BookingV2ServiceLocation
): BookingV2Cart {
  const existing = readBookingV2Cart(businessSlug);
  const cart: BookingV2Cart = { ...existing, serviceLocation };
  writeCart(businessSlug, cart);
  return cart;
}
