import { WORKSHOP_ATTRIBUTION_STORAGE_KEY } from '../constants';

function readAttribution(storage: Storage): boolean {
  return storage.getItem(WORKSHOP_ATTRIBUTION_STORAGE_KEY) === '1';
}

function writeAttribution(storage: Storage): void {
  storage.setItem(WORKSHOP_ATTRIBUTION_STORAGE_KEY, '1');
}

/** Marks this browser as workshop-attributed (for signup conversion tracking). */
export function markWorkshopAttribution(): void {
  if (typeof window === 'undefined') return;

  try {
    writeAttribution(window.localStorage);
  } catch {
    // ignore
  }

  try {
    writeAttribution(window.sessionStorage);
  } catch {
    // ignore
  }
}

export function hasWorkshopAttribution(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    if (readAttribution(window.localStorage)) return true;
  } catch {
    // ignore
  }

  try {
    if (readAttribution(window.sessionStorage)) return true;
  } catch {
    // ignore
  }

  return false;
}

export function clearWorkshopAttribution(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(WORKSHOP_ATTRIBUTION_STORAGE_KEY);
  } catch {
    // ignore
  }

  try {
    window.sessionStorage.removeItem(WORKSHOP_ATTRIBUTION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function captureWorkshopAttributionFromUrl(
  searchParams: URLSearchParams
): void {
  if (searchParams.get('from') === 'workshop') {
    markWorkshopAttribution();
  }
}
