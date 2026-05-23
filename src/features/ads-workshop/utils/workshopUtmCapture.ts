import { WORKSHOP_UTM_STORAGE_KEY } from '../constants';
import type { WorkshopUtmAttribution } from '../types/workshopLead';

const UTM_PARAM_KEYS = [
  ['utmSource', 'utm_source'],
  ['utmMedium', 'utm_medium'],
  ['utmCampaign', 'utm_campaign'],
  ['utmContent', 'utm_content'],
  ['utmTerm', 'utm_term'],
  ['fbclid', 'fbclid'],
] as const;

function trimParam(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function parseWorkshopUtmsFromSearchParams(
  searchParams: URLSearchParams,
  landingPath = '/workshop'
): WorkshopUtmAttribution {
  const attribution: WorkshopUtmAttribution = { landingPath };

  for (const [field, param] of UTM_PARAM_KEYS) {
    const value = trimParam(searchParams.get(param));
    if (value) attribution[field] = value;
  }

  return attribution;
}

export function hasWorkshopUtmData(
  attribution: WorkshopUtmAttribution
): boolean {
  return UTM_PARAM_KEYS.some(([field]) => Boolean(attribution[field]));
}

function readStoredUtms(): WorkshopUtmAttribution | null {
  if (typeof window === 'undefined') return null;

  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      const raw = storage.getItem(WORKSHOP_UTM_STORAGE_KEY);
      if (!raw) continue;
      return JSON.parse(raw) as WorkshopUtmAttribution;
    } catch {
      // ignore corrupt payload
    }
  }

  return null;
}

/** First-touch: only writes when nothing stored yet. */
export function persistWorkshopUtms(attribution: WorkshopUtmAttribution): void {
  if (typeof window === 'undefined') return;
  if (!hasWorkshopUtmData(attribution) && !attribution.landingPath) return;

  const existing = readStoredUtms();
  if (existing && hasWorkshopUtmData(existing)) return;

  const payload = existing ? { ...existing, ...attribution } : attribution;

  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      storage.setItem(WORKSHOP_UTM_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }
}

export function getStoredWorkshopUtms(): WorkshopUtmAttribution | undefined {
  return readStoredUtms() ?? undefined;
}

export function captureWorkshopUtmsFromWindow(): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  persistWorkshopUtms(
    parseWorkshopUtmsFromSearchParams(params, window.location.pathname)
  );
}
