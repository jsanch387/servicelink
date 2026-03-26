import { API_ROUTES } from '@/constants/routes';

export async function updateCustomerNote(
  customerId: string,
  note: string
): Promise<{ ok: true; note: string } | { ok: false; error: string }> {
  const url = `${API_ROUTES.CUSTOMERS}/${encodeURIComponent(customerId)}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ note }),
  });

  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    note?: string;
    error?: string;
  } | null;

  if (!res.ok) {
    return {
      ok: false,
      error: json?.error || `Failed to save note (${res.status})`,
    };
  }

  return { ok: true, note: typeof json?.note === 'string' ? json.note : note };
}
