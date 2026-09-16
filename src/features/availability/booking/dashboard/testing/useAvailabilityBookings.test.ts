import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAvailabilityBookings } from '../hooks/useAvailabilityBookings';

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: async () => body,
  };
}

describe('useAvailabilityBookings', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches a newest page without loading the full table', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toContain('limit=15');
      expect(url).toContain('filter=upcoming');
      expect(url).toContain('asOf=');
      expect(url).not.toContain('from=');
      return jsonResponse({
        success: true,
        data: [{ id: 'bk-1' }],
        hasMore: true,
        nextCursor: '2026-09-14|14:00:00|bk-1',
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAvailabilityBookings());
    await act(async () => {
      await result.current.loadListPage();
    });

    expect(result.current.bookings).toEqual([{ id: 'bk-1' }]);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('loads the next page with the cursor from the previous response', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: [{ id: 'bk-1' }],
          hasMore: true,
          nextCursor: '2026-09-14|14:00:00|bk-1',
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: [{ id: 'bk-2' }],
          hasMore: false,
          nextCursor: null,
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAvailabilityBookings());
    await act(async () => {
      await result.current.loadListPage();
    });
    await act(async () => {
      await result.current.loadMore();
    });

    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
      'cursor=2026-09-14%7C14%3A00%3A00%7Cbk-1'
    );
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('filter=upcoming');
    expect(result.current.bookings.map(item => item.id)).toEqual([
      'bk-1',
      'bk-2',
    ]);
    expect(result.current.hasMore).toBe(false);
  });

  it('fetches only the visible calendar range', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toContain('from=2026-09-01');
      expect(url).toContain('to=2026-09-07');
      expect(url).not.toContain('cursor=');
      return jsonResponse({
        success: true,
        data: [{ id: 'bk-week' }],
        hasMore: false,
        nextCursor: null,
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAvailabilityBookings());
    await act(async () => {
      await result.current.loadRange('2026-09-01', '2026-09-07');
    });

    await waitFor(() => {
      expect(result.current.bookings).toEqual([{ id: 'bk-week' }]);
    });
  });

  it('refetches the list when the status filter changes', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        success: true,
        data: [{ id: 'bk-past' }],
        hasMore: false,
        nextCursor: null,
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAvailabilityBookings());
    await act(async () => {
      await result.current.loadListPage('past');
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('filter=past');
    expect(result.current.bookings).toEqual([{ id: 'bk-past' }]);
  });
});
