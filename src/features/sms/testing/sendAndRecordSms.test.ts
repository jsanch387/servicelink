import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendAndRecordSms } from '../services/sendAndRecordSms';

const { sendSmsMock } = vi.hoisted(() => ({ sendSmsMock: vi.fn() }));

// Mock only the low-level provider send; keep the real toE164 + logging.
vi.mock('@/features/sms/services/sendSms', () => ({
  sendSms: sendSmsMock,
}));

interface AdminOpts {
  /** Error returned by the queued-row INSERT (e.g. unique violation). */
  insertError?: { code?: string; message?: string } | null;
}

function makeAdmin(opts: AdminOpts = {}) {
  const inserts: Record<string, unknown>[] = [];
  const updates: { id: string; patch: Record<string, unknown> }[] = [];
  let idCounter = 0;

  const admin = {
    from: vi.fn(() => ({
      insert: (row: Record<string, unknown>) => {
        inserts.push(row);
        return {
          select: () => ({
            single: () => {
              if (opts.insertError) {
                return Promise.resolve({ data: null, error: opts.insertError });
              }
              idCounter += 1;
              return Promise.resolve({
                data: { id: `row-${idCounter}` },
                error: null,
              });
            },
          }),
        };
      },
      update: (patch: Record<string, unknown>) => ({
        eq: (_col: string, id: string) => {
          updates.push({ id, patch });
          return Promise.resolve({ error: null });
        },
      }),
    })),
  };

  return { admin, inserts, updates };
}

function baseParams(admin: unknown, overrides: Record<string, unknown> = {}) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    admin: admin as any,
    businessId: 'biz-1',
    bookingId: 'booking-1',
    customerId: 'cust-1',
    type: 'booking_confirmation',
    to: '5807545207',
    message: 'Your appointment is confirmed. Reply STOP to opt out.',
    dedupeKey: 'booking-1:booking_confirmation',
    correlationId: 'req-1',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  sendSmsMock.mockResolvedValue({ sent: true });
});

describe('sendAndRecordSms', () => {
  it('happy path: logs queued, sends to E.164, marks sent', async () => {
    const { admin, inserts, updates } = makeAdmin();

    const res = await sendAndRecordSms(baseParams(admin));

    expect(res).toEqual({ sent: true, messageId: 'row-1' });

    // Claimed a queued row first with the normalized number + dedupe key.
    expect(inserts).toHaveLength(1);
    expect(inserts[0]).toMatchObject({
      business_id: 'biz-1',
      booking_id: 'booking-1',
      customer_id: 'cust-1',
      type: 'booking_confirmation',
      to_phone: '+15807545207',
      status: 'queued',
      dedupe_key: 'booking-1:booking_confirmation',
    });

    // Sent the normalized number.
    expect(sendSmsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '+15807545207',
        type: 'booking_confirmation',
      })
    );

    // Marked the row sent.
    expect(updates).toHaveLength(1);
    expect(updates[0].id).toBe('row-1');
    expect(updates[0].patch).toMatchObject({ status: 'sent' });
    expect(updates[0].patch.sent_at).toEqual(expect.any(String));
  });

  it('duplicate dedupe key: skips send entirely', async () => {
    const { admin, updates } = makeAdmin({ insertError: { code: '23505' } });

    const res = await sendAndRecordSms(baseParams(admin));

    expect(res).toEqual({ sent: false, reason: 'duplicate' });
    expect(sendSmsMock).not.toHaveBeenCalled();
    expect(updates).toHaveLength(0);
  });

  it('no phone: returns no_phone without logging or sending', async () => {
    const { admin, inserts } = makeAdmin();

    const res = await sendAndRecordSms(baseParams(admin, { to: '   ' }));

    expect(res).toEqual({ sent: false, reason: 'no_phone' });
    expect(inserts).toHaveLength(0);
    expect(sendSmsMock).not.toHaveBeenCalled();
  });

  it('invalid number: records failed, clears dedupe key, does not send', async () => {
    const { admin, inserts, updates } = makeAdmin();

    const res = await sendAndRecordSms(baseParams(admin, { to: '12345' }));

    expect(res).toEqual({ sent: false, reason: 'invalid_number' });
    // Logged the attempt (raw phone snapshot) but never sent.
    expect(inserts[0]).toMatchObject({ to_phone: '12345', status: 'queued' });
    expect(sendSmsMock).not.toHaveBeenCalled();
    // Marked failed + cleared dedupe so the owner can retry after fixing it.
    expect(updates[0].patch).toMatchObject({
      status: 'failed',
      error: 'invalid_number',
      dedupe_key: null,
    });
  });

  it('send failure: records failed and clears dedupe key (retryable)', async () => {
    sendSmsMock.mockResolvedValue({ sent: false, reason: 'error' });
    const { admin, updates } = makeAdmin();

    const res = await sendAndRecordSms(baseParams(admin));

    expect(res).toEqual({ sent: false, reason: 'error' });
    expect(updates[0].patch).toMatchObject({
      status: 'failed',
      error: 'error',
      dedupe_key: null,
    });
  });

  it('not_configured: records failed and clears dedupe key', async () => {
    sendSmsMock.mockResolvedValue({ sent: false, reason: 'not_configured' });
    const { admin, updates } = makeAdmin();

    const res = await sendAndRecordSms(baseParams(admin));

    expect(res).toEqual({ sent: false, reason: 'not_configured' });
    expect(updates[0].patch).toMatchObject({
      status: 'failed',
      error: 'not_configured',
    });
  });

  it('still sends when the log insert fails for a non-duplicate reason', async () => {
    // e.g. table missing / transient DB error — never block the customer SMS.
    const { admin, updates } = makeAdmin({
      insertError: { code: '42P01', message: 'relation does not exist' },
    });

    const res = await sendAndRecordSms(baseParams(admin));

    expect(res).toEqual({ sent: true, messageId: null });
    expect(sendSmsMock).toHaveBeenCalledTimes(1);
    // No row id to update.
    expect(updates).toHaveLength(0);
  });

  it('omits dedupe_key when none is provided (repeatable messages)', async () => {
    const { admin, inserts } = makeAdmin();

    await sendAndRecordSms(baseParams(admin, { dedupeKey: null }));

    expect(inserts[0].dedupe_key).toBeNull();
  });
});
