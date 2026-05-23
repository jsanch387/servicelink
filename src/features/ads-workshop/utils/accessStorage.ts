import {
  HAS_WORKSHOP_ACCESS_STORAGE_KEY,
  HAS_WORKSHOP_ACCESS_STORAGE_VALUE,
} from '../constants';

function readFromStorage(storage: Storage): boolean {
  return (
    storage.getItem(HAS_WORKSHOP_ACCESS_STORAGE_KEY) ===
    HAS_WORKSHOP_ACCESS_STORAGE_VALUE
  );
}

function writeToStorage(storage: Storage): boolean {
  storage.setItem(
    HAS_WORKSHOP_ACCESS_STORAGE_KEY,
    HAS_WORKSHOP_ACCESS_STORAGE_VALUE
  );
  return true;
}

export function hasWorkshopAccess(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    if (readFromStorage(window.localStorage)) return true;
  } catch {
    // Safari private / blocked storage
  }

  try {
    if (readFromStorage(window.sessionStorage)) return true;
  } catch {
    // sessionStorage blocked
  }

  return false;
}

/** Persists unlock to localStorage and sessionStorage (Safari fallback). */
export function grantWorkshopAccess(): boolean {
  if (typeof window === 'undefined') return false;

  let granted = false;

  try {
    granted = writeToStorage(window.localStorage) || granted;
  } catch {
    // localStorage unavailable
  }

  try {
    granted = writeToStorage(window.sessionStorage) || granted;
  } catch {
    // sessionStorage unavailable
  }

  return granted;
}

export function revokeWorkshopAccess(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(HAS_WORKSHOP_ACCESS_STORAGE_KEY);
  } catch {
    // ignore
  }

  try {
    window.sessionStorage.removeItem(HAS_WORKSHOP_ACCESS_STORAGE_KEY);
  } catch {
    // ignore
  }
}
