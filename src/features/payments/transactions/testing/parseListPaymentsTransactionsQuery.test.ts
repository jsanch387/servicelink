import { describe, expect, it } from 'vitest';
import { parseListPaymentsTransactionsQuery } from '../parseListPaymentsTransactionsQuery';

describe('parseListPaymentsTransactionsQuery', () => {
  it('defaults limit to 20', () => {
    const result = parseListPaymentsTransactionsQuery(new URLSearchParams());
    expect(result).toEqual({
      ok: true,
      query: { limit: 20, startingAfter: undefined, kind: undefined },
    });
  });

  it('caps limit at 50', () => {
    const result = parseListPaymentsTransactionsQuery(
      new URLSearchParams('limit=200')
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.query.limit).toBe(50);
  });

  it('rejects a bad startingAfter', () => {
    const result = parseListPaymentsTransactionsQuery(
      new URLSearchParams('startingAfter=not-a-txn')
    );
    expect(result.ok).toBe(false);
  });

  it('accepts a composite nextCursor', () => {
    const result = parseListPaymentsTransactionsQuery(
      new URLSearchParams('startingAfter=2026-08-24T17:00:00.000Z|txn_abc123')
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.query.startingAfter).toBe(
      '2026-08-24T17:00:00.000Z|txn_abc123'
    );
  });

  it('accepts kind=payout', () => {
    const result = parseListPaymentsTransactionsQuery(
      new URLSearchParams('kind=payout&startingAfter=txn_abc123')
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.query.kind).toBe('payout');
    expect(result.query.startingAfter).toBe('txn_abc123');
  });
});
