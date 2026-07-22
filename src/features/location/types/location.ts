export type LocationAutocompleteMode = 'customer-search' | 'service-origin';

export interface StructuredLocation {
  providerId: string;
  label: string;
  searchValue: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  placeType: string;
}
