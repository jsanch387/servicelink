import {
  buildPublicBookingVisitDraft,
  resolveResumePublicVisitState,
} from '@/features/availability/booking/utils/publicBookingVisitDraft';
import { INITIAL_CUSTOMER_FORM_DATA } from '@/features/availability/booking/utils/initialFormData';
import { describe, expect, it } from 'vitest';

describe('resolveResumePublicVisitState', () => {
  it('starts on the calendar when there is no draft', () => {
    const resumed = resolveResumePublicVisitState({
      draft: null,
      visitDurationMinutes: 60,
      needsInlineLocationStep: false,
    });
    expect(resumed.step).toBe('schedule');
    expect(resumed.detailsSubStep).toBe('contact');
  });

  it('after add-another with a valid slot, resumes on vehicles', () => {
    const resumed = resolveResumePublicVisitState({
      draft: buildPublicBookingVisitDraft({
        customerData: {
          ...INITIAL_CUSTOMER_FORM_DATA,
          fullName: 'Jordan Lee',
          phone: '5551234567',
          streetAddress: '1 Main',
          city: 'Austin',
          state: 'TX',
          zip: '78701',
        },
        selectedDate: new Date(2026, 7, 12, 12, 0, 0, 0),
        selectedTime: '09:00',
        step: 'details',
        detailsSubStep: 'vehicleNotes',
        customerServiceChoice: 'mobile',
        agreedToNotifications: true,
      }),
      visitDurationMinutes: 540,
      needsInlineLocationStep: false,
    });
    expect(resumed.customerData.fullName).toBe('Jordan Lee');
    expect(resumed.selectedTime).toBe('09:00');
    expect(resumed.step).toBe('details');
    expect(resumed.detailsSubStep).toBe('vehicleNotes');
    expect(resumed.scheduleNeedsRetiming).toBe(false);
  });

  it('asks for a new time when duration no longer fits the day', () => {
    const resumed = resolveResumePublicVisitState({
      draft: buildPublicBookingVisitDraft({
        customerData: {
          ...INITIAL_CUSTOMER_FORM_DATA,
          fullName: 'Jordan Lee',
          phone: '5551234567',
        },
        selectedDate: new Date(2026, 7, 12, 12, 0, 0, 0),
        selectedTime: '20:00',
        step: 'details',
        detailsSubStep: 'vehicleNotes',
        customerServiceChoice: null,
        agreedToNotifications: false,
      }),
      visitDurationMinutes: 300,
      needsInlineLocationStep: false,
    });
    expect(resumed.selectedTime).toBeNull();
    expect(resumed.step).toBe('schedule');
    expect(resumed.scheduleNeedsRetiming).toBe(true);
    expect(resumed.customerData.fullName).toBe('Jordan Lee');
  });

  it('skips empty calendar when draft was on schedule but slot already chosen', () => {
    const resumed = resolveResumePublicVisitState({
      draft: buildPublicBookingVisitDraft({
        customerData: {
          ...INITIAL_CUSTOMER_FORM_DATA,
          fullName: 'Jordan Lee',
          phone: '5551234567',
        },
        selectedDate: new Date(2026, 7, 12, 12, 0, 0, 0),
        selectedTime: '10:00',
        step: 'schedule',
        detailsSubStep: 'contact',
        customerServiceChoice: null,
        agreedToNotifications: true,
      }),
      visitDurationMinutes: 120,
      needsInlineLocationStep: false,
    });
    expect(resumed.step).toBe('details');
    expect(resumed.detailsSubStep).toBe('vehicleNotes');
    expect(resumed.selectedTime).toBe('10:00');
  });

  it('keeps you on schedule when refreshing mid-calendar without a time yet', () => {
    const resumed = resolveResumePublicVisitState({
      draft: buildPublicBookingVisitDraft({
        customerData: INITIAL_CUSTOMER_FORM_DATA,
        selectedDate: new Date(2026, 7, 12, 12, 0, 0, 0),
        selectedTime: null,
        step: 'schedule',
        detailsSubStep: 'contact',
        customerServiceChoice: null,
        agreedToNotifications: true,
      }),
      visitDurationMinutes: 120,
      needsInlineLocationStep: false,
    });
    expect(resumed.step).toBe('schedule');
  });

  it('sends draft-on-details without a slot back to the calendar', () => {
    const resumed = resolveResumePublicVisitState({
      draft: buildPublicBookingVisitDraft({
        customerData: {
          ...INITIAL_CUSTOMER_FORM_DATA,
          fullName: 'Jordan Lee',
          phone: '5551234567',
        },
        selectedDate: null,
        selectedTime: null,
        step: 'details',
        detailsSubStep: 'vehicleNotes',
        customerServiceChoice: null,
        agreedToNotifications: true,
      }),
      visitDurationMinutes: 120,
      needsInlineLocationStep: false,
    });
    expect(resumed.step).toBe('schedule');
  });

  it('does not resume on review without a scheduled slot', () => {
    const resumed = resolveResumePublicVisitState({
      draft: buildPublicBookingVisitDraft({
        customerData: {
          ...INITIAL_CUSTOMER_FORM_DATA,
          fullName: 'Jordan Lee',
          phone: '5551234567',
        },
        selectedDate: null,
        selectedTime: null,
        step: 'review',
        detailsSubStep: 'vehicleNotes',
        customerServiceChoice: null,
        agreedToNotifications: true,
      }),
      visitDurationMinutes: 120,
      needsInlineLocationStep: false,
    });
    expect(resumed.step).toBe('schedule');
    expect(resumed.customerData.fullName).toBe('Jordan Lee');
  });
});
