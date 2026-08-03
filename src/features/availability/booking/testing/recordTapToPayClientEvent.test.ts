import { recordTapToPayClientEvent } from '@/features/availability/booking/server/recordTapToPayClientEvent';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const maybeSingle = vi.fn();
const updateEq = vi.fn();
const update = vi.fn(() => ({ eq: updateEq }));
const selectEq3 = vi.fn(() => ({ maybeSingle }));
const selectEq2 = vi.fn(() => ({ eq: selectEq3 }));
const selectEq1 = vi.fn(() => ({ eq: selectEq2 }));
const select = vi.fn(() => ({ eq: selectEq1 }));
const from = vi.fn(() => ({ select, update }));

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({ from }),
}));

describe('recordTapToPayClientEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    maybeSingle.mockResolvedValue({
      data: { id: 'row-1', client_report_count: 0 },
      error: null,
    });
    updateEq.mockResolvedValue({ error: null });
  });

  it('stores failure diagnostics on the matching intent row', async () => {
    const result = await recordTapToPayClientEvent({
      businessId: 'biz-1',
      bookingId: 'book-1',
      outcome: 'failure',
      body: {
        stage: 'collect',
        code: 'READER_NOT_CONNECTED',
        message: 'No reader is connected.',
        paymentIntentId: 'pi_123',
        durationMs: 1200,
        diagnostics: {
          appVersion: '1.0.7',
          osVersion: '18.5',
          platform: 'ios',
          readerWarm: true,
        },
      },
    });

    expect(result).toEqual({ ok: true, updated: true });
    expect(update).toHaveBeenCalled();
    const patch = update.mock.calls[0][0];
    expect(patch.client_stage).toBe('collect');
    expect(patch.client_error_code).toBe('READER_NOT_CONNECTED');
    expect(patch.client_error_message).toBe('No reader is connected.');
    expect(patch.client_error_at).toBeTruthy();
    expect(patch.client_report_count).toBe(1);
    expect(patch.client_diagnostics.appVersion).toBe('1.0.7');
    expect(patch.client_diagnostics.outcome).toBe('failure');
  });

  it('stores success without clearing prior error fields', async () => {
    const result = await recordTapToPayClientEvent({
      businessId: 'biz-1',
      bookingId: 'book-1',
      outcome: 'success',
      body: {
        stage: 'success',
        paymentIntentId: 'pi_123',
        diagnostics: { appVersion: '1.0.7', platform: 'ios' },
      },
    });

    expect(result).toEqual({ ok: true, updated: true });
    const patch = update.mock.calls[0][0];
    expect(patch.client_success_at).toBeTruthy();
    expect(patch.client_error_code).toBeUndefined();
    expect(patch.client_diagnostics.outcome).toBe('success');
  });

  it('no-ops update when paymentIntentId is missing', async () => {
    const result = await recordTapToPayClientEvent({
      businessId: 'biz-1',
      bookingId: 'book-1',
      outcome: 'failure',
      body: { stage: 'intent', message: 'offline' },
    });
    expect(result).toEqual({ ok: true, updated: false });
    expect(from).not.toHaveBeenCalled();
  });

  it('no-ops when paymentIntentId has no matching intent row', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const result = await recordTapToPayClientEvent({
      businessId: 'biz-1',
      bookingId: 'book-1',
      outcome: 'failure',
      body: {
        stage: 'collect',
        paymentIntentId: 'pi_orphaned',
        code: 'READER_NOT_CONNECTED',
      },
    });
    expect(result).toEqual({ ok: true, updated: false });
    expect(update).not.toHaveBeenCalled();
  });

  it('strips nested objects and secrets from diagnostics', async () => {
    const result = await recordTapToPayClientEvent({
      businessId: 'biz-1',
      bookingId: 'book-1',
      outcome: 'failure',
      body: {
        stage: 'connect',
        paymentIntentId: 'pi_123',
        diagnostics: {
          appVersion: '1.0.7',
          nested: { a: 1 },
          secret: 'pst_xxx',
          readerWarm: false,
        },
      },
    });

    expect(result).toEqual({ ok: true, updated: true });
    const patch = update.mock.calls[0][0];
    expect(patch.client_diagnostics.appVersion).toBe('1.0.7');
    expect(patch.client_diagnostics.readerWarm).toBe(false);
    expect(patch.client_diagnostics.nested).toBeUndefined();
    expect(patch.client_diagnostics.secret).toBeUndefined();
  });
});
