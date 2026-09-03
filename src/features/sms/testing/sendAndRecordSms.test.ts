import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendAndRecordSms } from '../services/sendAndRecordSms';

const {
  sendSmsMock,
  canBusinessSendCustomerSmsMock,
  isSmsOutboundEnabledMock,
  isTelnyxSmsConfiguredMock,
} = vi.hoisted(() => ({
  sendSmsMock: vi.fn(),
  canBusinessSendCustomerSmsMock: vi.fn(),
  isSmsOutboundEnabledMock: vi.fn(() => true),
  isTelnyxSmsConfiguredMock: vi.fn(() => true),
}));

// Mock only the low-level provider send; keep the real toE164 + logging.
vi.mock('@/features/sms/services/sendSms', () => ({
  sendSms: sendSmsMock,
}));

vi.mock('@/features/sms/server/canBusinessSendCustomerSms', () => ({
  canBusinessSendCustomerSms: canBusinessSendCustomerSmsMock,
}));

vi.mock('@/features/sms/config/isSmsOutboundEnabled', () => ({
  isSmsOutboundEnabled: isSmsOutboundEnabledMock,
  SMS_OUTBOUND_ENABLED: true,
}));

vi.mock('@/features/sms/services/telnyxClient', () => ({
  isTelnyxSmsConfigured: isTelnyxSmsConfiguredMock,
}));

vi.mock('@/features/customer-management/server/loadCustomerSmsOptIn', () => ({
  loadCustomerSmsOptIn: vi.fn(async () => true),
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

beforeEach(async () => {
  vi.clearAllMocks();
  isSmsOutboundEnabledMock.mockReturnValue(true);
  isTelnyxSmsConfiguredMock.mockReturnValue(true);
  sendSmsMock.mockResolvedValue({ sent: true, providerMessageId: 'telnyx-1' });
  canBusinessSendCustomerSmsMock.mockResolvedValue({ ok: true });
  const { loadCustomerSmsOptIn } = await import(
    '@/features/customer-management/server/loadCustomerSmsOptIn'
  );
  vi.mocked(loadCustomerSmsOptIn).mockResolvedValue(true);
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
      quote_id: null,
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

  it('outbound disabled: skips send and log with not_configured', async () => {
    isSmsOutboundEnabledMock.mockReturnValue(false);
    const { admin, inserts } = makeAdmin();

    const res = await sendAndRecordSms(baseParams(admin));

    expect(res).toEqual({ sent: false, reason: 'not_configured' });
    expect(inserts).toHaveLength(0);
    expect(sendSmsMock).not.toHaveBeenCalled();
  });

  it('not eligible (not Pro): skips send and log with not_eligible', async () => {
    canBusinessSendCustomerSmsMock.mockResolvedValue({
      ok: false,
      reason: 'not_pro',
    });
    const { admin, inserts } = makeAdmin();

    const res = await sendAndRecordSms(baseParams(admin));

    expect(res).toEqual({ sent: false, reason: 'not_eligible' });
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

  it('send failure: records provider detail and clears dedupe key (retryable)', async () => {
    sendSmsMock.mockResolvedValue({
      sent: false,
      reason: 'error',
      detail: 'HTTP 400: code=40001: Invalid destination',
    });
    const { admin, updates } = makeAdmin();

    const res = await sendAndRecordSms(baseParams(admin));

    expect(res).toEqual({ sent: false, reason: 'error' });
    expect(updates[0].patch).toMatchObject({
      status: 'failed',
      error: 'HTTP 400: code=40001: Invalid destination',
      dedupe_key: null,
    });
  });

  it('send failure without detail: stores reason code', async () => {
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

  it('carrier_opt_out: records skipped_opt_out status', async () => {
    sendSmsMock.mockResolvedValue({
      sent: false,
      reason: 'carrier_opt_out',
      detail: 'HTTP 403: code=40300: Blocked due to STOP message',
    });
    const { admin, updates } = makeAdmin();

    const res = await sendAndRecordSms(baseParams(admin));

    expect(res).toEqual({ sent: false, reason: 'carrier_opt_out' });
    expect(updates[0].patch).toMatchObject({
      status: 'skipped_opt_out',
      error: 'HTTP 403: code=40300: Blocked due to STOP message',
      dedupe_key: null,
    });
  });

  it('sms_opt_out: skips send when customer opted out of SMS consent', async () => {
    const { loadCustomerSmsOptIn } = await import(
      '@/features/customer-management/server/loadCustomerSmsOptIn'
    );
    vi.mocked(loadCustomerSmsOptIn).mockResolvedValueOnce(false);
    const { admin, inserts } = makeAdmin();

    const res = await sendAndRecordSms(
      baseParams(admin, { customerId: 'cust-1' })
    );

    expect(res).toEqual({ sent: false, reason: 'sms_opt_out' });
    expect(inserts).toHaveLength(0);
    expect(sendSmsMock).not.toHaveBeenCalled();
  });

  it('not_configured (missing Telnyx): skips send and log without inserting', async () => {
    isTelnyxSmsConfiguredMock.mockReturnValue(false);
    const { admin, inserts } = makeAdmin();

    const res = await sendAndRecordSms(baseParams(admin));

    expect(res).toEqual({ sent: false, reason: 'not_configured' });
    expect(inserts).toHaveLength(0);
    expect(sendSmsMock).not.toHaveBeenCalled();
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

  it('stores quote_id when the SMS belongs to a quote', async () => {
    const { admin, inserts } = makeAdmin();

    await sendAndRecordSms(
      baseParams(admin, { bookingId: null, quoteId: 'quote-1' })
    );

    expect(inserts[0]).toMatchObject({
      booking_id: null,
      quote_id: 'quote-1',
    });
  });
});
