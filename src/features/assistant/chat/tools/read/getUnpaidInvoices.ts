import { businessCanUseInvoices } from '@/features/invoices/server/requireInvoicePro';
import { mapInvoiceListRow } from '@/features/invoices/server/mapInvoiceListRow';
import type { InvoiceListItem } from '@/features/invoices/types';
import { formatPaymentDollars } from '@/features/payments/utils/formatPaymentMoney';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export type GetUnpaidInvoicesResult =
  | {
      ok: true;
      unpaidCount: number;
      outstandingCents: number;
      outstandingLabel: string;
      invoices: Array<{
        customerName: string;
        amountLabel: string;
        dueOn: string | null;
        invoiceNumber: number | null;
      }>;
    }
  | { ok: false; error: string };

export async function executeGetUnpaidInvoices(args: {
  businessId: string;
  limit?: number;
}): Promise<GetUnpaidInvoicesResult> {
  const allowed = await businessCanUseInvoices(args.businessId);
  if (!allowed) {
    return {
      ok: false,
      error: 'Invoices are a Pro feature. Upgrade to Pro to send invoices.',
    };
  }

  const limit = Math.min(Math.max(args.limit ?? 10, 1), 10);

  try {
    const admin = createSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from('invoices')
      .select(
        'id, status, customer_name, total_cents, due_on, created_at, invoice_number'
      )
      .eq('business_id', args.businessId)
      .eq('status', 'sent')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[assistant:chat] getUnpaidInvoices', error);
      return { ok: false, error: 'Could not load unpaid invoices right now.' };
    }

    const invoices = ((data ?? []) as unknown[])
      .map(row =>
        mapInvoiceListRow(
          row as Parameters<typeof mapInvoiceListRow>[0]
        )
      )
      .filter((row): row is InvoiceListItem => row != null);

    const outstandingCents = invoices.reduce(
      (sum, invoice) => sum + invoice.totalCents,
      0
    );

    return {
      ok: true,
      unpaidCount: invoices.length,
      outstandingCents,
      outstandingLabel: formatPaymentDollars(outstandingCents),
      invoices: invoices.slice(0, limit).map(invoice => ({
        customerName: invoice.customerName,
        amountLabel: formatPaymentDollars(invoice.totalCents),
        dueOn: invoice.dueOn,
        invoiceNumber: invoice.invoiceNumber,
      })),
    };
  } catch (error) {
    console.error('[assistant:chat] getUnpaidInvoices', error);
    return { ok: false, error: 'Could not load unpaid invoices right now.' };
  }
}
