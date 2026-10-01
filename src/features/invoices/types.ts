export type InvoiceListFilterId = 'all' | 'draft' | 'sent' | 'paid';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void';

export type InvoiceListItem = {
  id: string;
  status: InvoiceStatus;
  customerName: string;
  totalCents: number;
  /** `YYYY-MM-DD`, or null when there is no due date. */
  dueOn: string | null;
  createdAt: string;
  invoiceNumber: number | null;
};

export type InvoiceLineDraft = {
  id: string;
  description: string;
  quantity: string;
  /** Unit price, dollars string from MoneyInput. */
  amount: string;
};

export type InvoiceDraft = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  /** `YYYY-MM-DD`, empty means no due date. */
  dueDate: string;
  note: string;
  lines: InvoiceLineDraft[];
};
