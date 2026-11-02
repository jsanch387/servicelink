import type { SupabaseClient } from '@supabase/supabase-js';

export type InvoiceEditorKind = 'draft' | 'bill';

const BILL_STATUSES = new Set(['sent', 'paid', 'void']);

/** Drafts open the editor. Sent, paid, and void invoices open the bill. */
export async function loadInvoiceEditorKind(
  supabase: SupabaseClient,
  businessId: string,
  invoiceId: string
): Promise<InvoiceEditorKind | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from('invoices')
    .select('status')
    .eq('id', invoiceId)
    .eq('business_id', businessId)
    .maybeSingle();

  if (error) {
    console.error('load invoice editor kind:', error);
    return null;
  }

  const status = typeof data?.status === 'string' ? data.status : '';
  if (status === 'draft') return 'draft';
  if (BILL_STATUSES.has(status)) return 'bill';
  return null;
}
