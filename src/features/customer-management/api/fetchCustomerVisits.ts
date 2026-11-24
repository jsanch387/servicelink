import { API_ROUTES } from '@/constants/routes';
import type { CustomerVisit } from '@/features/customer-management/types';

export type FetchCustomerVisitsResult =
  | { ok: true; visits: CustomerVisit[] }
  | { ok: false; error: string };

function isVisit(value: unknown): value is CustomerVisit {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as CustomerVisit;
  return (
    typeof row.id === 'string' &&
    typeof row.scheduledDate === 'string' &&
    typeof row.serviceName === 'string' &&
    (typeof row.price === 'number' || row.price === null)
  );
}

export async function fetchCustomerVisits(
  customerId: string
): Promise<FetchCustomerVisitsResult> {
  try {
    const res = await fetch(API_ROUTES.customerVisits(customerId), {
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
    if (
      typeof data !== 'object' ||
      data === null ||
      !('visits' in data) ||
      !Array.isArray((data as { visits: unknown }).visits) ||
      !(data as { visits: unknown[] }).visits.every(isVisit)
    ) {
      return { ok: false, error: 'Invalid response from server' };
    }
    return { ok: true, visits: (data as { visits: CustomerVisit[] }).visits };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}
