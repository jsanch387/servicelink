/**
 * In-app notice and Expo push when a customer invoice becomes paid.
 * Best-effort: a duplicate or a failed insert does not undo the payment.
 * A duplicate notice does not send a second push.
 */

import { notificationMinimalDisplayTitle } from '@/features/notifications/utils/notificationMinimalDisplayTitle';
import { sendExpoPushToUser } from '@/features/push/server/sendExpoPushToUser';
import type { SupabaseClient } from '@supabase/supabase-js';

import { formatInvoiceCents } from '../utils/invoiceDraft';

export async function notifyOwnerInvoicePaid(
  admin: SupabaseClient,
  input: { businessId: string; invoiceId: string }
): Promise<void> {
  const businessId = input.businessId.trim();
  const invoiceId = input.invoiceId.trim();
  if (!businessId || !invoiceId) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  try {
    const [{ data: invoice }, { data: profile, error: profileError }] =
      await Promise.all([
        db
          .from('invoices')
          .select('customer_name, total_cents')
          .eq('id', invoiceId)
          .eq('business_id', businessId)
          .maybeSingle(),
        db
          .from('business_profiles')
          .select('profile_id')
          .eq('id', businessId)
          .maybeSingle(),
      ]);

    const profileId =
      typeof profile?.profile_id === 'string' ? profile.profile_id.trim() : '';
    if (profileError || !profileId) {
      console.error('invoice paid notification: no owner', {
        invoiceId,
        profileError,
      });
      return;
    }

    const customerName =
      typeof invoice?.customer_name === 'string'
        ? invoice.customer_name.trim()
        : '';
    const amount = formatInvoiceCents(Number(invoice?.total_cents) || 0);
    const title = notificationMinimalDisplayTitle(
      'customer_invoice_paid',
      'invoice',
      'Invoice paid',
      'Invoice paid'
    );

    const body = customerName ? `${customerName} · ${amount}` : amount;
    const { error } = await db.from('notifications').insert({
      user_id: profileId,
      type: 'customer_invoice_paid',
      reference_type: 'invoice',
      reference_id: invoiceId,
      title,
      body,
      dedupe_key: `customer_invoice_paid:${invoiceId}`,
    });

    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code?: unknown }).code ?? '')
        : '';
    if (error) {
      if (code !== '23505') {
        console.error('invoice paid notification:', error);
      }
      return;
    }

    await sendExpoPushToUser(admin, {
      userId: profileId,
      title,
      body,
      data: { reference_type: 'invoice', reference_id: invoiceId },
    });
  } catch (error) {
    console.error('invoice paid notification:', error);
  }
}
