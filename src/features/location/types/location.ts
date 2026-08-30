export type LocationAutocompleteMode =
  | 'customer-search'
  | 'service-origin'
  | 'street-address';

export interface StructuredLocation {
  providerId: string;
  label: string;
  searchValue: string;
  city: string;
  state: string;
  zip: string;
  /** House number + street when the pick is an address. Empty for city/ZIP. */
  street?: string;
  latitude: number;
  longitude: number;
  placeType: string;
}
