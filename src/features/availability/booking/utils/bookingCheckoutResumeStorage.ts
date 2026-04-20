import type { CustomerFormData } from '../types';

export type BookingCheckoutResumePaymentChoice = 'pay_now' | 'pay_in_person';

export type BookingCheckoutResumeDraftV1 = {
  v: 1;
  savedAt: number;
  businessSlug: string;
  serviceId?: string;
  /** True only while the user is expected on Stripe-hosted checkout. */
  awaitingStripeReturn: boolean;
  selectedDate: string;
  selectedTime: string;
  customerData: CustomerFormData;
  customerPaymentChoice: BookingCheckoutResumePaymentChoice | null;
};

const STORAGE_PREFIX = 'servicelink.bookingCheckoutResume.v1:';

export function bookingCheckoutResumeStorageKey(
  businessSlug: string,
  serviceId?: string
): string {
  return `${STORAGE_PREFIX}${businessSlug}:${serviceId ?? '__no_svc__'}`;
}

export function saveBookingCheckoutResumeDraft(
  draft: BookingCheckoutResumeDraftV1
): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      bookingCheckoutResumeStorageKey(draft.businessSlug, draft.serviceId),
      JSON.stringify(draft)
    );
  } catch {
    // ignore quota / private mode
  }
}

export function loadBookingCheckoutResumeDraft(
  businessSlug: string,
  serviceId?: string
): BookingCheckoutResumeDraftV1 | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(
      bookingCheckoutResumeStorageKey(businessSlug, serviceId)
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BookingCheckoutResumeDraftV1;
    if (parsed?.v !== 1) return null;
    if (typeof parsed.savedAt !== 'number') return null;
    if (parsed.businessSlug !== businessSlug) return null;
    if ((parsed.serviceId ?? undefined) !== (serviceId ?? undefined)) {
      return null;
    }
    if (
      typeof parsed.selectedDate !== 'string' ||
      typeof parsed.selectedTime !== 'string' ||
      typeof parsed.customerData !== 'object' ||
      parsed.customerData == null
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearBookingCheckoutResumeDraft(
  businessSlug: string,
  serviceId?: string
): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(
      bookingCheckoutResumeStorageKey(businessSlug, serviceId)
    );
  } catch {
    // ignore
  }
}
