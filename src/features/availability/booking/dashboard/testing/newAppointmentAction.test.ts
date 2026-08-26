import { describe, expect, it } from 'vitest';

import { ROUTES } from '@/constants/routes';
import { FREE_BOOKINGS_LIMIT } from '@/features/pricing';

import {
  getNewAppointmentActionState,
  NEW_APPOINTMENT_FREE_CAP_NOTICE,
  NEW_APPOINTMENT_MISSING_SLUG_NOTICE,
} from '../utils/newAppointmentAction';

describe('getNewAppointmentActionState', () => {
  it('enables the bookings new flow when a public page slug exists', () => {
    expect(
      getNewAppointmentActionState({
        hasPublicPageSlug: true,
        atFreeBookingCap: false,
      })
    ).toEqual({
      href: ROUTES.DASHBOARD.BOOKINGS_NEW,
      enabled: true,
      title: undefined,
      ariaLabel: 'New appointment for a customer',
      blockedNotice: null,
    });
  });

  it('blocks when the free plan cap is reached', () => {
    const state = getNewAppointmentActionState({
      hasPublicPageSlug: true,
      atFreeBookingCap: true,
    });

    expect(state.enabled).toBe(false);
    expect(state.title).toBe(NEW_APPOINTMENT_FREE_CAP_NOTICE);
    expect(state.blockedNotice).toBe(NEW_APPOINTMENT_FREE_CAP_NOTICE);
    expect(NEW_APPOINTMENT_FREE_CAP_NOTICE).toContain(
      String(FREE_BOOKINGS_LIMIT)
    );
  });

  it('blocks when the public page slug is missing', () => {
    expect(
      getNewAppointmentActionState({
        hasPublicPageSlug: false,
        atFreeBookingCap: false,
      })
    ).toMatchObject({
      href: undefined,
      enabled: false,
      title: NEW_APPOINTMENT_MISSING_SLUG_NOTICE,
      blockedNotice: NEW_APPOINTMENT_MISSING_SLUG_NOTICE,
    });
  });
});
