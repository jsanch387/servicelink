/**
 * Types for the "new availability booking" email to the business owner (V2).
 */

export interface AddOnForEmail {
  id: string;
  name: string;
  priceCents: number;
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
  /** Total price (base + add-ons). */
  totalPriceCents?: number;
}

export interface SendAvailabilityBookingNotificationResult {
  sent: boolean;
  error?: string;
}
