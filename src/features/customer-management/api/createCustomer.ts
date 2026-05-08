import { API_ROUTES } from '@/constants/routes';
import type { AddCustomerDraft } from '@/features/customer-management/types';
import { parseCreateCustomerBody } from '@/features/customer-management/utils/parseCreateCustomerBody';

export type CreateCustomerResult = { ok: true } | { ok: false; error: string };

export async function createCustomerRequest(
  draft: AddCustomerDraft
): Promise<CreateCustomerResult> {
  const parsed = parseCreateCustomerBody({
    fullName: draft.name,
    email: draft.email,
    phone: draft.phone,
    notes: draft.notes,
  });
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  try {
    const res = await fetch(API_ROUTES.CUSTOMERS, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: parsed.fullName,
        email: draft.email.trim(),
        phone: draft.phone,
        notes: draft.notes,
      }),
    });

    const json = (await res.json().catch(() => null)) as {
      success?: boolean;
      error?: string;
    } | null;

    if (!res.ok) {
      const message =
        typeof json?.error === 'string'
          ? json.error
          : `Request failed (${res.status})`;
      return { ok: false, error: message };
    }

    if (json?.success !== true) {
      return {
        ok: false,
        error:
          typeof json?.error === 'string'
            ? json.error
            : 'Unexpected response from server',
      };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}
