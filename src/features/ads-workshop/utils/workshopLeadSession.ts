import { WORKSHOP_LEAD_ID_STORAGE_KEY } from '../constants';

export function persistWorkshopLeadId(leadId: string): void {
  if (typeof window === 'undefined' || !leadId.trim()) return;

  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      storage.setItem(WORKSHOP_LEAD_ID_STORAGE_KEY, leadId);
    } catch {
      // ignore
    }
  }
}

export function getWorkshopLeadId(): string | null {
  if (typeof window === 'undefined') return null;

  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      const id = storage.getItem(WORKSHOP_LEAD_ID_STORAGE_KEY)?.trim();
      if (id) return id;
    } catch {
      // ignore
    }
  }

  return null;
}

export function clearWorkshopLeadId(): void {
  if (typeof window === 'undefined') return;

  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      storage.removeItem(WORKSHOP_LEAD_ID_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
