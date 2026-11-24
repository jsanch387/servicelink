import { expirePastAppointmentRequests } from '@/features/availability/services/expirePastAppointmentRequests';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const notify = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock(
  '@/features/availability/services/notifyCustomerAppointmentRequestExpired',
  () => ({
    notifyCustomerAppointmentRequestExpired: notify,
  })
);

const pastRequest = {
  id: 'booking-1',
  status: 'requested',
  scheduled_date: '2026-11-01',
  customer_name: 'Jordan',
};

function client(rows: unknown[]) {
  const selectChain = {
    eq: vi.fn(() => selectChain),
    lt: vi.fn(() => selectChain),
    order: vi.fn(() => selectChain),
    limit: vi.fn(async () => ({ data: rows, error: null })),
  };
  const updateChain = {
    eq: vi.fn(() => updateChain),
    select: vi.fn(() => updateChain),
    maybeSingle: vi.fn(async () => ({
      data: { ...pastRequest, status: 'expired' },
      error: null,
    })),
  };
  let selected = false;
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => {
        if (selected) {
          return {
            ...selectChain,
            limit: vi.fn(async () => ({ data: [], error: null })),
          };
        }
        selected = true;
        return selectChain;
      }),
      update: vi.fn(() => updateChain),
    })),
  };
}

describe('expirePastAppointmentRequests', () => {
  beforeEach(() => {
    notify.mockClear();
  });

  it('marks a past request expired and tells the customer once', async () => {
    const supabase = client([pastRequest]);

    const result = await expirePastAppointmentRequests(supabase as never, {
      asOf: '2026-11-09',
      businessId: 'biz-1',
    });

    expect(result).toEqual({ expired: 1 });
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('ignores an as-of date that is not a calendar day', async () => {
    const supabase = client([pastRequest]);

    const result = await expirePastAppointmentRequests(supabase as never, {
      asOf: 'today',
    });

    expect(result).toEqual({ expired: 0 });
    expect(notify).not.toHaveBeenCalled();
  });
});
