import { API_ROUTES } from '@/constants/routes';
import { createCustomerRequest } from '@/features/customer-management/api/createCustomer';
import { DUPLICATE_CUSTOMER_MESSAGE } from '@/features/customer-management/utils/parseCreateCustomerBody';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('createCustomerRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not call fetch when validation fails', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await createCustomerRequest({
      name: '',
      email: '',
      phone: '',
      notes: '',
    });

    expect(result).toEqual({ ok: false, error: 'Name is required' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns ok true when POST succeeds', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await createCustomerRequest({
      name: 'Jane Doe',
      email: '',
      phone: '',
      notes: '',
    });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      API_ROUTES.CUSTOMERS,
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );

    const [, init] = fetchMock.mock.calls[0] as [
      string,
      RequestInit | undefined,
    ];
    const body = JSON.parse(init?.body as string) as Record<string, unknown>;
    expect(body.fullName).toBe('Jane Doe');
    expect(body.email).toBe('');
    expect(body.phone).toBe('');
    expect(body.notes).toBe('');
  });

  it('surfaces server error body on conflict', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        success: false,
        error: DUPLICATE_CUSTOMER_MESSAGE,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await createCustomerRequest({
      name: 'Jane',
      email: 'dup@example.com',
      phone: '',
      notes: '',
    });

    expect(result).toEqual({
      ok: false,
      error: DUPLICATE_CUSTOMER_MESSAGE,
    });
  });

  it('returns network error when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const result = await createCustomerRequest({
      name: 'Jane',
      email: '',
      phone: '',
      notes: '',
    });

    expect(result).toEqual({ ok: false, error: 'Network error' });
  });

  it('returns error when success flag missing on 200', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: false }),
      })
    );

    const result = await createCustomerRequest({
      name: 'Jane',
      email: '',
      phone: '',
      notes: '',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Unexpected response from server');
    }
  });
});
