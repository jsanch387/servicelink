/**
 * Business profile location (city, state, ZIP).
 * Shop street/unit live on `business_profiles` separately — see docs/serviceLocation.md.
 */

export interface BusinessLocationFields {
  city: string;
  state: string;
  zip: string;
}

const SERVICE_AREA_CITY_STATE_REGEX =
  /^[A-Za-z]+(?:[ '.-][A-Za-z]+)*,\s?[A-Za-z]{2}$/;

export function parseServiceAreaCityState(serviceArea: string): {
  city: string;
  state: string;
} {
  const [rawCity = '', rawState = ''] = serviceArea.split(',');
  return {
    city: rawCity.trim(),
    state: rawState.trim().toUpperCase().slice(0, 2),
  };
}

export function formatServiceArea(city: string, state: string): string {
  const trimmedCity = city.trim();
  const trimmedState = state.trim().toUpperCase().slice(0, 2);
  if (!trimmedCity && !trimmedState) return '';
  if (trimmedCity && trimmedState) return `${trimmedCity}, ${trimmedState}`;
  return trimmedCity || trimmedState;
}

export function isValidCityStateServiceArea(serviceArea: string): boolean {
  return SERVICE_AREA_CITY_STATE_REGEX.test(serviceArea.trim());
}

export function sanitizeCityInput(value: string): string {
  return value
    .replace(/[^A-Za-z\s'.-]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trimStart();
}

export function sanitizeStateInput(value: string): string {
  return value
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 2);
}

export function sanitizeZipInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 5);
}

export function isValidUsZip(zip: string): boolean {
  return /^\d{5}$/.test(zip.trim());
}

/** Display label e.g. "Austin, TX 78701" */
export function formatProfileLocationLabel(
  city: string,
  state: string,
  zip: string
): string | null {
  const area = formatServiceArea(city, state);
  const zipTrim = zip.trim();
  if (!area && !zipTrim) return null;
  if (area && zipTrim) return `${area} ${zipTrim}`;
  return area || zipTrim;
}

export interface ShopAddressParts {
  street: string;
  unit?: string | null;
  city: string;
  state: string;
  zip: string;
}

/** Full mailing-style shop address for display (booking flow, maps, etc.). */
export function formatFullShopAddress(parts: ShopAddressParts): string | null {
  const street = parts.street.trim();
  const unit = parts.unit?.trim();
  const location = formatProfileLocationLabel(
    parts.city,
    parts.state,
    parts.zip
  );

  if (!street && !location) return null;

  const streetLine = unit ? `${street}, ${unit}` : street;
  if (streetLine && location) return `${streetLine}, ${location}`;
  return streetLine || location;
}

export function validateBusinessLocation(
  fields: BusinessLocationFields
): string[] {
  const errors: string[] = [];
  const city = fields.city.trim();
  const state = fields.state.trim();
  const zip = fields.zip.trim();

  if (!city || !state) {
    errors.push('City and state are required');
  } else {
    const serviceArea = formatServiceArea(city, state);
    if (!isValidCityStateServiceArea(serviceArea)) {
      errors.push('Location must use a valid city and 2-letter state');
    }
  }

  if (!zip) {
    errors.push('ZIP is required');
  } else if (!isValidUsZip(zip)) {
    errors.push('ZIP must be 5 digits');
  }

  return errors;
}
