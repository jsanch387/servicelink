import { describe, expect, it } from 'vitest';

import { decideSetupEmail, type SetupEmailState } from '../eligibility';

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
