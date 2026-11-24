import { API_ROUTES } from '@/constants/routes';
import type { CustomerVehicle } from '@/features/customer-management/utils/mapCustomerVehicleRows';

export async function createCustomerVehicle(
  customerId: string,
  input: { year: string; make: string; model: string }
): Promise<
  { ok: true; vehicle: CustomerVehicle } | { ok: false; error: string }
> {
  try {
    const res = await fetch(API_ROUTES.customerVehicles(customerId), {
      credentials: 'include',
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
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
    const vehicle =
      typeof data === 'object' && data !== null && 'vehicle' in data
        ? (data as { vehicle: unknown }).vehicle
        : null;
    if (
      typeof vehicle !== 'object' ||
      vehicle === null ||
      typeof (vehicle as CustomerVehicle).id !== 'string' ||
      typeof (vehicle as CustomerVehicle).label !== 'string'
    ) {
      return { ok: false, error: 'Invalid response from server' };
    }
    return { ok: true, vehicle: vehicle as CustomerVehicle };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}
