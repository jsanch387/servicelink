import { API_ROUTES } from '@/constants/routes';
import type { CustomerImportRecord } from '@/features/customer-management/utils/buildCustomerImportPreview';

export type ImportCustomersResult =
  | { ok: true; created: number; skipped: number; failed: number }
  | { ok: false; error: string };

export async function importCustomersRequest(
  customers: readonly CustomerImportRecord[]
): Promise<ImportCustomersResult> {
  try {
    const res = await fetch(API_ROUTES.CUSTOMERS_IMPORT, {
      credentials: 'include',
      method: 'POST',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customers: customers.map(customer => ({
          fullName: customer.fullName,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          notes: customer.notes,
          vehicles: customer.vehicles,
        })),
      }),
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
      !('created' in data) ||
      typeof (data as { created: unknown }).created !== 'number'
    ) {
      return { ok: false, error: 'Invalid response from server' };
    }
    const result = data as {
      created: number;
      skipped?: number;
      failed?: number;
    };
    return {
      ok: true,
      created: result.created,
      skipped: typeof result.skipped === 'number' ? result.skipped : 0,
      failed: typeof result.failed === 'number' ? result.failed : 0,
    };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}
