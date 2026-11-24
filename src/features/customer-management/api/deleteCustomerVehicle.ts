import { API_ROUTES } from '@/constants/routes';

export async function deleteCustomerVehicle(
  customerId: string,
  vehicleId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(API_ROUTES.customerVehicle(customerId, vehicleId), {
      credentials: 'include',
      method: 'DELETE',
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
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}
