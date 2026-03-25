import { API_ROUTES } from '@/constants/routes';

export async function deleteCustomerById(
  customerId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = `${API_ROUTES.CUSTOMERS}/${encodeURIComponent(customerId)}`;

  const res = await fetch(url, { method: 'DELETE' });
  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
  } | null;

  if (!res.ok) {
    return {
      ok: false,
      error: json?.error || `Failed to delete customer (${res.status})`,
    };
  }

  return { ok: true };
}
