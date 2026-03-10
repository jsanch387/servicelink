/**
 * Types for the service details + add-ons booking flow (UI prototype).
 * Mock data only; not connected to database.
 */

export interface ServiceAddOn {
  id: string;
  name: string;
  priceCents: number;
}

export interface ServiceDetailView {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  durationMinutes: number;
}
