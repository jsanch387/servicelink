import { API_ROUTES } from '@/constants/routes';
import type { CustomerRecord } from '@/features/customer-management/types';
import { isListCustomersSuccess } from './listCustomersResponse';

export type FetchCustomersResult =
  | { ok: true; customers: CustomerRecord[] }
  | { ok: false; error: string };

export async function fetchCustomersList(): Promise<FetchCustomersResult> {
  try {
    const res = await fetch(API_ROUTES.CUSTOMERS, {
      credentials: 'include',
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const data: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        typeof data === 'object' &&
        data !== null &&
        'error' in data &&
        typeof (data as { error: unknown }).error === 'string'
          ? (data as { error: string }).error
          : `Request failed (${res.status})`;
      return { ok: false, error: message };
    }

    if (!isListCustomersSuccess(data)) {
      return { ok: false, error: 'Invalid response from server' };
    }

    return { ok: true, customers: data.customers };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}
