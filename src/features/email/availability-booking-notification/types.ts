/**
 * Types for the "new availability booking" email to the business owner (V2).
 */

export interface AddOnForEmail {
  id: string;
  name: string;
  priceCents: number;
}

/** Optional payment summary for customer + owner emails (same HTML template). */
export interface AvailabilityBookingPaymentSummary {
  /** Section heading in the email card (default: "Payment"). */
  title?: string;
  /** Label/value rows shown in the payment card. */
  rows: Array<{ label: string; value: string }>;
  /** Small note under the table (non–card flows, or extra copy). */
  note?: string;
  /**
   * Card was charged through Stripe (booking checkout). Template shows a
   * Stripe receipt disclaimer with different wording for customer vs owner.
   */
  stripeCardPayment?: boolean;
}

export interface AvailabilityBookingNotificationPayload {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerVehicleYear?: string;
  customerVehicleMake?: string;
  customerVehicleModel?: string;
  serviceName: string;
  /** Multi-price option selected by customer (e.g., Sedan, SUV). */
  servicePriceOptionLabel?: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  servicePriceCents?: number;
  /** Add-ons selected at booking. */
  selectedAddOns?: AddOnForEmail[];
  /** Total price (base + add-ons), pre-discount. */
  totalPriceCents?: number;
  /**
   * When a sale (or later promo) applies at book time — shown in Service details.
   * `totalPriceCents` stays pre-discount; email shows estimated total after discount.
   */
  discount?: {
    label: string;
    discountCents: number;
    estimatedTotalCents: number;
  };
  /** Shown in both customer confirmation and owner notification when set. */
  paymentSummary?: AvailabilityBookingPaymentSummary;
  /** Where service happens (mobile at customer vs shop visit). */
  serviceLocation?: AvailabilityBookingServiceLocationEmail;
  /** Customer or job notes from the booking form (omitted in email when empty). */
  customerNotes?: string;
  /** Owner scheduled this appointment from the dashboard (not a public self-booking). */
  createdByOwner?: boolean;
}

export interface AvailabilityBookingServiceLocationEmail {
  type: 'mobile' | 'shop';
  formattedAddress: string;
}

export interface SendAvailabilityBookingNotificationResult {
  sent: boolean;
  error?: string;
}
