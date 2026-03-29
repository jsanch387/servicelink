export type MockPaymentTransactionStatus = 'succeeded' | 'pending' | 'refunded';

export type MockPaymentTransaction = {
  id: string;
  dateLabel: string;
  description: string;
  customerName: string | null;
  amountCents: number;
  status: MockPaymentTransactionStatus;
};

/** Mock available balance in cents (UI preview only). */
export const MOCK_AVAILABLE_BALANCE_CENTS = 124_750;

export const MOCK_RECENT_TRANSACTIONS: MockPaymentTransaction[] = [
  {
    id: '1',
    dateLabel: 'Mar 26, 2026',
    description: 'Deep clean — deposit',
    customerName: 'Jordan Lee',
    amountCents: 8500,
    status: 'succeeded',
  },
  {
    id: '2',
    dateLabel: 'Mar 25, 2026',
    description: 'Move-out cleaning',
    customerName: 'Alex Morgan',
    amountCents: 22000,
    status: 'succeeded',
  },
  {
    id: '3',
    dateLabel: 'Mar 24, 2026',
    description: 'Weekly maintenance',
    customerName: 'Sam Rivera',
    amountCents: 12500,
    status: 'pending',
  },
  {
    id: '4',
    dateLabel: 'Mar 22, 2026',
    description: 'Deposit refund',
    customerName: 'Priya Shah',
    amountCents: -5000,
    status: 'refunded',
  },
  {
    id: '5',
    dateLabel: 'Mar 20, 2026',
    description: 'Office sanitization',
    customerName: null,
    amountCents: 18900,
    status: 'succeeded',
  },
];
