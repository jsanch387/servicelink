import { describe, expect, it } from 'vitest';

import {
  decideQrCodeEmail,
  decideReceiptReviewEmail,
  decideSetupEmail,
  decideTestAppointmentEmail,
  type SetupEmailState,
} from '../eligibility';

const signup = new Date('2026-11-03T15:00:00.000Z');
const day = 24 * 60 * 60 * 1000;

function state(overrides: Partial<SetupEmailState> = {}): SetupEmailState {
  return {
    onboardingStatus: 'not_started',
    signupAt: signup,
    firstSentAt: null,
    finalSentAt: null,
    firstSentOn: null,
    today: '2026-11-03',
    excluded: false,
    noEmail: false,
    ...overrides,
  };
}

describe('decideSetupEmail', () => {
  it('waits a day after signup', () => {
    const now = new Date(signup.getTime() + day - 60_000);
    expect(decideSetupEmail(state(), now)).toBeNull();
  });

  it('sends the first note once a day has passed', () => {
    const now = new Date(signup.getTime() + day);
    expect(decideSetupEmail(state({ today: '2026-11-04' }), now)).toBe(
      'A1_setup_one_step'
    );
  });

  it('does not send the last note until the first email went out', () => {
    const now = new Date(signup.getTime() + 4 * day);
    expect(decideSetupEmail(state({ today: '2026-11-07' }), now)).toBe(
      'A1_setup_one_step'
    );
  });

  it('waits three days after the first note', () => {
    const firstSentAt = new Date(signup.getTime() + day);
    const now = new Date(firstSentAt.getTime() + 3 * day - 60_000);
    expect(
      decideSetupEmail(
        state({
          firstSentAt,
          firstSentOn: '2026-11-04',
          today: '2026-11-07',
        }),
        now
      )
    ).toBeNull();
  });

  it('sends the last note three days after the first email', () => {
    const firstSentAt = new Date(signup.getTime() + day);
    const now = new Date(firstSentAt.getTime() + 3 * day);
    expect(
      decideSetupEmail(
        state({
          onboardingStatus: 'in_progress',
          firstSentAt,
          firstSentOn: '2026-11-04',
          today: '2026-11-07',
        }),
        now
      )
    ).toBe('A2_setup_final');
  });

  it('holds the second email on the same Chicago day as the first', () => {
    const now = new Date(signup.getTime() + 4 * day);
    expect(
      decideSetupEmail(
        state({
          firstSentAt: now,
          firstSentOn: '2026-11-07',
          today: '2026-11-07',
        }),
        now
      )
    ).toBeNull();
  });

  it('sends nothing once setup is finished', () => {
    const now = new Date(signup.getTime() + 2 * day);
    expect(
      decideSetupEmail(state({ onboardingStatus: 'completed' }), now)
    ).toBeNull();
  });

  it('sends nothing to an internal address', () => {
    const now = new Date(signup.getTime() + 2 * day);
    expect(decideSetupEmail(state({ excluded: true }), now)).toBeNull();
  });
});

describe('decideTestAppointmentEmail', () => {
  const finished = new Date('2026-11-03T15:00:00.000Z');

  it('waits a day after they finish', () => {
    const now = new Date(finished.getTime() + day - 60_000);
    expect(
      decideTestAppointmentEmail(
        { completedAt: finished, alreadySent: false, hasBooking: false },
        now
      )
    ).toBeNull();
  });

  it('sends once a day has passed and they still have no booking', () => {
    const now = new Date(finished.getTime() + day);
    expect(
      decideTestAppointmentEmail(
        { completedAt: finished, alreadySent: false, hasBooking: false },
        now
      )
    ).toBe('A3_test_appointment');
  });

  it('sends nothing once any booking exists', () => {
    const now = new Date(finished.getTime() + 2 * day);
    expect(
      decideTestAppointmentEmail(
        { completedAt: finished, alreadySent: false, hasBooking: true },
        now
      )
    ).toBeNull();
  });

  it('sends nothing after the note already went out', () => {
    const now = new Date(finished.getTime() + 2 * day);
    expect(
      decideTestAppointmentEmail(
        { completedAt: finished, alreadySent: true, hasBooking: false },
        now
      )
    ).toBeNull();
  });
});

describe('decideReceiptReviewEmail', () => {
  const asked = new Date('2026-11-04T15:00:00.000Z');

  it('waits three days after the first-appointment email', () => {
    const now = new Date(asked.getTime() + 3 * day - 60_000);
    expect(
      decideReceiptReviewEmail(
        {
          askSentAt: asked,
          askSentOn: '2026-11-04',
          today: '2026-11-07',
          alreadySent: false,
          hasBooking: false,
        },
        now
      )
    ).toBeNull();
  });

  it('sends once three days have passed and the calendar is still empty', () => {
    const now = new Date(asked.getTime() + 3 * day);
    expect(
      decideReceiptReviewEmail(
        {
          askSentAt: asked,
          askSentOn: '2026-11-04',
          today: '2026-11-07',
          alreadySent: false,
          hasBooking: false,
        },
        now
      )
    ).toBe('A4_receipt_review');
  });

  it('sends nothing once any booking exists', () => {
    const now = new Date(asked.getTime() + 4 * day);
    expect(
      decideReceiptReviewEmail(
        {
          askSentAt: asked,
          askSentOn: '2026-11-04',
          today: '2026-11-08',
          alreadySent: false,
          hasBooking: true,
        },
        now
      )
    ).toBeNull();
  });
});

describe('decideQrCodeEmail', () => {
  const booked = new Date('2026-11-05T15:00:00.000Z');

  it('waits a day after the first booking', () => {
    const now = new Date(booked.getTime() + day - 60_000);
    expect(
      decideQrCodeEmail(
        {
          firstBookingAt: booked,
          firstBookingOn: '2026-11-05',
          today: '2026-11-06',
          alreadySent: false,
        },
        now
      )
    ).toBeNull();
  });

  it('sends the morning after the first booking', () => {
    const now = new Date(booked.getTime() + day);
    expect(
      decideQrCodeEmail(
        {
          firstBookingAt: booked,
          firstBookingOn: '2026-11-05',
          today: '2026-11-06',
          alreadySent: false,
        },
        now
      )
    ).toBe('A5_qr_code');
  });

  it('sends nothing without a booking or after the note went out', () => {
    const now = new Date(booked.getTime() + 2 * day);
    expect(
      decideQrCodeEmail(
        {
          firstBookingAt: null,
          firstBookingOn: null,
          today: '2026-11-07',
          alreadySent: false,
        },
        now
      )
    ).toBeNull();
    expect(
      decideQrCodeEmail(
        {
          firstBookingAt: booked,
          firstBookingOn: '2026-11-05',
          today: '2026-11-07',
          alreadySent: true,
        },
        now
      )
    ).toBeNull();
  });
});
