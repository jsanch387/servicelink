import { describe, expect, it } from 'vitest';
import { parseJobCompletedBody } from '@/features/availability/booking/server/parseJobCompletedBody';

describe('parseJobCompletedBody', () => {
  it('accepts minimal job_completed payload', () => {
    const result = parseJobCompletedBody({ action: 'job_completed' });
    expect(result).toEqual({
      ok: true,
      body: { action: 'job_completed', sessionFees: [] },
    });
  });

  it('accepts session fees and session payment', () => {
    const result = parseJobCompletedBody({
      action: 'job_completed',
      sessionFees: [{ label: 'Pet hair', amountCents: 2500 }],
      sessionPayment: { method: 'cash', amountCents: 12000 },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.body.sessionFees).toHaveLength(1);
      expect(result.body.sessionPayment).toEqual({
        method: 'cash',
        amountCents: 12000,
      });
    }
  });

  it('rejects invalid sessionFees', () => {
    expect(
      parseJobCompletedBody({
        action: 'job_completed',
        sessionFees: [{ label: '', amountCents: 100 }],
      }).ok
    ).toBe(false);
  });

  it('rejects tap_to_pay without valid method shape', () => {
    expect(
      parseJobCompletedBody({
        action: 'job_completed',
        sessionPayment: { method: 'tap_to_pay', amountCents: 1000 },
      }).ok
    ).toBe(true);
  });

  it('rejects wrong action', () => {
    expect(parseJobCompletedBody({ action: 'work_finished' }).ok).toBe(false);
  });
});
