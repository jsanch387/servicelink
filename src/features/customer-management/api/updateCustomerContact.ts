import { API_ROUTES } from '@/constants/routes';
import type { CustomerAddress } from '@/features/customer-management/types';

async function patchCustomer(
  customerId: string,
  body: Record<string, unknown>
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  try {
    const res = await fetch(
      `${API_ROUTES.CUSTOMERS}/${encodeURIComponent(customerId)}`,
      {
        credentials: 'include',
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
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
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export async function updateCustomerPhone(
  customerId: string,
  phone: string
): Promise<{ ok: true; phone: string } | { ok: false; error: string }> {
  const result = await patchCustomer(customerId, { phone });
  if (!result.ok) return result;
  const phoneValue =
    typeof result.data === 'object' &&
    result.data !== null &&
    'phone' in result.data &&
    typeof (result.data as { phone: unknown }).phone === 'string'
      ? (result.data as { phone: string }).phone
      : phone;
  return { ok: true, phone: phoneValue };
}

export async function updateCustomerEmail(
  customerId: string,
  email: string
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const result = await patchCustomer(customerId, { email });
  if (!result.ok) return result;
  const emailValue =
    typeof result.data === 'object' &&
    result.data !== null &&
    'email' in result.data &&
    typeof (result.data as { email: unknown }).email === 'string'
      ? (result.data as { email: string }).email
      : email;
  return { ok: true, email: emailValue };
}

export async function updateCustomerAddress(
  customerId: string,
  address: CustomerAddress
): Promise<
  { ok: true; address: CustomerAddress } | { ok: false; error: string }
> {
  const result = await patchCustomer(customerId, { address });
  if (!result.ok) return result;
  return { ok: true, address };
}

export type SavedCustomerProfile = {
  name: string;
  phone: string;
  email: string;
  address: CustomerAddress | null;
  note: string;
};

export async function updateCustomerProfile(
  customerId: string,
  input: {
    name: string;
    phone: string;
    email: string;
    street: string;
    unit: string;
    city: string;
    state: string;
    zip: string;
    note: string;
  }
): Promise<
  { ok: true; profile: SavedCustomerProfile } | { ok: false; error: string }
> {
  const result = await patchCustomer(customerId, {
    fullName: input.name,
    phone: input.phone,
    email: input.email,
    address: {
      street: input.street,
      unit: input.unit,
      city: input.city,
      state: input.state,
      zip: input.zip,
    },
    note: input.note,
  });
  if (!result.ok) return result;
  const data = result.data;
  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'Failed to save customer' };
  }
  const row = data as Record<string, unknown>;
  const addressRaw =
    row.address && typeof row.address === 'object'
      ? (row.address as Record<string, unknown>)
      : null;
  return {
    ok: true,
    profile: {
      name: typeof row.name === 'string' ? row.name : input.name.trim(),
      phone: typeof row.phone === 'string' ? row.phone : '',
      email: typeof row.email === 'string' ? row.email : '',
      note: typeof row.note === 'string' ? row.note : '',
      address: addressRaw
        ? {
            street:
              typeof addressRaw.street === 'string' ? addressRaw.street : '',
            unit: typeof addressRaw.unit === 'string' ? addressRaw.unit : '',
            city: typeof addressRaw.city === 'string' ? addressRaw.city : '',
            state: typeof addressRaw.state === 'string' ? addressRaw.state : '',
            zip: typeof addressRaw.zip === 'string' ? addressRaw.zip : '',
          }
        : null,
    },
  };
}
