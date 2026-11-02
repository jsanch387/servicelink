export interface PublicQuoteRequestFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicle2Year: string;
  vehicle2Make: string;
  vehicle2Model: string;
  timeline: string;
  details: string;
}

export type PublicQuoteRequestFormErrors = Partial<
  Record<keyof PublicQuoteRequestFormData, string>
>;
