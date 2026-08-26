import { describe, expect, it } from 'vitest';
import {
  buildPaymentsTransactionsCursor,
  isPaymentsTransactionsCursor,
  parsePaymentsTransactionsCursor,
} from '../parseTransactionsCursor';

describe('parsePaymentsTransactionsCursor', () => {
  it('accepts a Stripe txn id', () => {
    expect(parsePaymentsTransactionsCursor('txn_abc123')).toEqual({
      stripeAfter: 'txn_abc123',
    });
  });

  it('accepts a composite cursor', () => {
    expect(
      parsePaymentsTransactionsCursor('2026-08-24T17:00:00.000Z|txn_abc123')
    ).toEqual({
      beforeIso: '2026-08-24T17:00:00.000Z',
      stripeAfter: 'txn_abc123',
    });
  });

  it('accepts a local-only cursor', () => {
    expect(
      parsePaymentsTransactionsCursor('2026-08-24T17:00:00.000Z|')
    ).toEqual({
      beforeIso: '2026-08-24T17:00:00.000Z',
      stripeAfter: undefined,
    });
  });

  it('builds the same shape the list returns', () => {
    expect(
      buildPaymentsTransactionsCursor({
        beforeIso: '2026-08-24T17:00:00.000Z',
        stripeAfter: 'txn_1',
      })
    ).toBe('2026-08-24T17:00:00.000Z|txn_1');
  });

  it('rejects garbage', () => {
    expect(isPaymentsTransactionsCursor('not-a-txn')).toBe(false);
  });
});
