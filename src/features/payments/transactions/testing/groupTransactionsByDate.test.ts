import { describe, expect, it } from 'vitest';
import { groupTransactionsByDate } from '../publicTransaction';
import type { PaymentsTransactionListItem } from '../publicTransaction';

function row(
  overrides: Partial<PaymentsTransactionListItem>
): PaymentsTransactionListItem {
  return {
    id: 'txn_1',
    kind: 'payment',
    title: 'Lights',
    extraCount: 0,
    subtitle: 'Jordan · Cash',
    methodLabel: 'Cash',
    statusLabel: 'Paid',
    amountLabel: '+$40.00',
    tone: 'in',
    dateLabel: 'Aug 24',
    feeLabel: null,
    bookingId: null,
    ...overrides,
  };
}

describe('groupTransactionsByDate', () => {
  it('keeps API order and groups matching day labels', () => {
    const groups = groupTransactionsByDate([
      row({ id: 'a', dateLabel: 'Aug 28' }),
      row({ id: 'b', dateLabel: 'Aug 28', title: 'Wax' }),
      row({ id: 'c', dateLabel: 'Aug 24' }),
    ]);
    expect(groups.map(group => group.dateLabel)).toEqual(['Aug 28', 'Aug 24']);
    expect(groups[0]?.items.map(item => item.id)).toEqual(['a', 'b']);
  });
});
