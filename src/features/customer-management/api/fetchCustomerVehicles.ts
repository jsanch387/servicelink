import { API_ROUTES } from '@/constants/routes';
import type { CustomerVehicle } from '@/features/customer-management/utils/mapCustomerVehicleRows';

export type FetchCustomerVehiclesResult =
  | { ok: true; vehicles: CustomerVehicle[] }
  | { ok: false; error: string };

function isVehicle(value: unknown): value is CustomerVehicle {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as CustomerVehicle;
  return typeof row.id === 'string' && typeof row.label === 'string';
}

export async function fetchCustomerVehicles(
  customerId: string
): Promise<FetchCustomerVehiclesResult> {
  try {
    const res = await fetch(API_ROUTES.customerVehicles(customerId), {
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
      !('vehicles' in data) ||
      !Array.isArray((data as { vehicles: unknown }).vehicles) ||
      !(data as { vehicles: unknown[] }).vehicles.every(isVehicle)
    ) {
      return { ok: false, error: 'Invalid response from server' };
    }
    return {
      ok: true,
      vehicles: (data as { vehicles: CustomerVehicle[] }).vehicles,
    };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}
