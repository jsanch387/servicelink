export interface PublicQuoteRequestFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceRequested: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  timeline: string;
  details: string;
}

export type PublicQuoteRequestFormErrors = Partial<
  Record<keyof PublicQuoteRequestFormData, string>
>;
