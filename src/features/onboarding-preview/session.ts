export type PreviewStep = 'industry' | 'business' | 'live' | 'recap';

export type PreviewSurface = 'web' | 'app';

export interface OnboardingPreviewSession {
  open: boolean;
  step: PreviewStep;
  surface: PreviewSurface;
  /** Stored industry value, e.g. "Vehicle Services". */
  industry: string;
  trades: string[];
  businessName: string;
  slugEdited: boolean;
  customSlug: string;
  /** 10 national digits, or empty. */
  phone: string;
  bookedTest: boolean;
  /** Highlight Bookings and tell them to mark the test job complete. */
  calendarGuide: boolean;
  receiptSeen: boolean;
  linkTextSent: boolean;
  checklistDismissed: boolean;
  finished: boolean;
}

const STORAGE_KEY = 'servicelink.onboardingPreview';

export const PREVIEW_SESSION_EVENT = 'onboarding-preview-session';
export const PREVIEW_DISMISS_GUIDE_EVENT = 'onboarding-preview-dismiss-guide';

const STEPS: PreviewStep[] = ['industry', 'business', 'live', 'recap'];

export function emptyPreviewSession(): OnboardingPreviewSession {
  return {
    open: false,
    step: 'industry',
    surface: 'web',
    industry: '',
    trades: [],
    businessName: '',
    slugEdited: false,
    customSlug: '',
    phone: '',
    bookedTest: false,
    calendarGuide: false,
    receiptSeen: false,
    linkTextSent: false,
    checklistDismissed: false,
    finished: false,
  };
}

export function readPreviewSession(): OnboardingPreviewSession {
  if (typeof window === 'undefined') return emptyPreviewSession();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyPreviewSession();
    const parsed = JSON.parse(raw) as Partial<OnboardingPreviewSession>;
    const step = STEPS.includes(parsed.step as PreviewStep)
      ? (parsed.step as PreviewStep)
      : 'industry';
    const surface = parsed.surface === 'app' ? 'app' : 'web';
    return {
      ...emptyPreviewSession(),
      ...parsed,
      step,
      surface,
      trades: Array.isArray(parsed.trades) ? parsed.trades.filter(Boolean) : [],
      businessName:
        typeof parsed.businessName === 'string' ? parsed.businessName : '',
      customSlug:
        typeof parsed.customSlug === 'string' ? parsed.customSlug : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
    };
  } catch {
    return emptyPreviewSession();
  }
}

export function writePreviewSession(session: OnboardingPreviewSession): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(PREVIEW_SESSION_EVENT));
}

/** Fill empty fields when jumping ahead so later screens are reviewable. */
export function seedPreviewForStep(
  session: OnboardingPreviewSession,
  step: PreviewStep
): OnboardingPreviewSession {
  if (step === 'industry' || step === 'business') {
    return { ...session, step };
  }
  return {
    ...session,
    step,
    industry: session.industry || 'Vehicle Services',
    trades: session.trades.length > 0 ? session.trades : ['detailing'],
    businessName: session.businessName.trim()
      ? session.businessName
      : "Mike's Detailing",
    bookedTest: step === 'recap' ? true : session.bookedTest,
  };
}
