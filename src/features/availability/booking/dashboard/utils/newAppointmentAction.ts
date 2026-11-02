import { ROUTES } from '@/constants/routes';
import { FREE_BOOKINGS_LIMIT } from '@/features/pricing';

export const NEW_APPOINTMENT_FREE_CAP_NOTICE = `You've reached your free plan limit (${FREE_BOOKINGS_LIMIT} appointments). Upgrade to Pro for unlimited bookings.`;

export const NEW_APPOINTMENT_MISSING_SLUG_NOTICE =
  'Set your public page URL under Business profile to create bookings from here.';

export interface NewAppointmentActionState {
  href: string | undefined;
  enabled: boolean;
  title: string | undefined;
  ariaLabel: string;
  blockedNotice: string | null;
}

export function getNewAppointmentActionState(args: {
  hasPublicPageSlug: boolean;
  atFreeBookingCap: boolean;
}): NewAppointmentActionState {
  const href = args.hasPublicPageSlug
    ? ROUTES.DASHBOARD.BOOKINGS_NEW
    : undefined;

  if (args.atFreeBookingCap) {
    return {
      href,
      enabled: false,
      title: NEW_APPOINTMENT_FREE_CAP_NOTICE,
      ariaLabel:
        'New appointment unavailable. Free plan booking limit reached.',
      blockedNotice: NEW_APPOINTMENT_FREE_CAP_NOTICE,
    };
  }

  if (!href) {
    return {
      href: undefined,
      enabled: false,
      title: NEW_APPOINTMENT_MISSING_SLUG_NOTICE,
      ariaLabel:
        'New appointment unavailable. Set your public page URL under Business profile first.',
      blockedNotice: NEW_APPOINTMENT_MISSING_SLUG_NOTICE,
    };
  }

  return {
    href,
    enabled: true,
    title: undefined,
    ariaLabel: 'New appointment for a customer',
    blockedNotice: null,
  };
}
