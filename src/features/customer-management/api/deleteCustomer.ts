import { API_ROUTES } from '@/constants/routes';

export async function deleteCustomerById(
  customerId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = `${API_ROUTES.CUSTOMERS}/${encodeURIComponent(customerId)}`;

  const res = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
  } | null;

  if (!res.ok || json?.success === false) {
    return {
      ok: false,
      error: json?.error || `Failed to delete customer (${res.status})`,
    };
  }

  return { ok: true };
}
