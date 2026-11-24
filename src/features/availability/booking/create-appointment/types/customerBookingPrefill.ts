/** Prefill for owner New booking opened from a customer profile. */
export type CustomerBookingPrefill = {
  customerName: string;
  email: string;
  phone: string;
  notes?: string;
  address?: {
    street: string;
    unit: string;
    city: string;
    state: string;
    zip: string;
  };
  /** Newest first. The first one is filled in; the rest are choices. */
  vehicles?: {
    year: string;
    make: string;
    model: string;
  }[];
};
