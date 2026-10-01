import type { SupabaseClient } from '@supabase/supabase-js';

const FIRST_NUMBER = 1001;

/**
 * Claims the next invoice number for a shop. The counter stores the next
 * number to issue, starting at 1001.
 */
export async function allocateInvoiceNumber(
  admin: SupabaseClient,
  businessId: string
): Promise<number | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: row, error: readError } = await db
      .from('invoice_number_counters')
      .select('next_number')
      .eq('business_id', businessId)
      .maybeSingle();

    if (readError) {
      console.error('read invoice number counter:', readError);
      return null;
    }

    if (!row) {
      const { error: insertError } = await db
        .from('invoice_number_counters')
        .insert({
          business_id: businessId,
          next_number: FIRST_NUMBER + 1,
        });

      if (!insertError) return FIRST_NUMBER;
      if (insertError.code === '23505') continue;
      console.error('insert invoice number counter:', insertError);
      return null;
    }

    const current = Number(row.next_number);
    if (!Number.isInteger(current) || current < FIRST_NUMBER) return null;

    const { data: bumped, error: updateError } = await db
      .from('invoice_number_counters')
      .update({ next_number: current + 1 })
      .eq('business_id', businessId)
      .eq('next_number', current)
      .select('next_number')
      .maybeSingle();

    if (updateError) {
      console.error('bump invoice number counter:', updateError);
      return null;
    }
    if (bumped) return current;
  }

  return null;
}
