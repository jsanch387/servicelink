const GUIDE_KEY = 'servicelink.v3CalendarGuide';
const CHECKLIST_KEY = 'servicelink.v3ChecklistDismissed';

export const V3_GUIDE_EVENT = 'onboarding-v3-guide';

export function readV3CalendarGuide(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(GUIDE_KEY) === '1';
}

export function armV3CalendarGuide(notify = true): void {
  sessionStorage.setItem(GUIDE_KEY, '1');
  if (notify) window.dispatchEvent(new Event(V3_GUIDE_EVENT));
}

export function clearV3CalendarGuide(): void {
  sessionStorage.removeItem(GUIDE_KEY);
  window.dispatchEvent(new Event(V3_GUIDE_EVENT));
}

export function readV3ChecklistDismissed(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(CHECKLIST_KEY) === '1';
}

export function dismissV3Checklist(): void {
  sessionStorage.setItem(CHECKLIST_KEY, '1');
}

/** Next sign-in should show the profile checklist again. */
export function clearV3ChecklistDismissed(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(CHECKLIST_KEY);
}
