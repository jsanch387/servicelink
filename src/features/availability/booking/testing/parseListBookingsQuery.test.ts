import { describe, expect, it } from 'vitest';

import { parseListBookingsQuery } from '../server/parseListBookingsQuery';

describe('parseListBookingsQuery', () => {
  it('defaults to the upcoming page', () => {
    expect(parseListBookingsQuery(new URLSearchParams())).toEqual({
      ok: true,
      query: {
        kind: 'page',
        limit: 15,
        filter: 'upcoming',
        asOf: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        assignedToMe: false,
      },
    });
  });

  it('reads filter and asOf for a list page', () => {
    expect(
      parseListBookingsQuery(new URLSearchParams('filter=past&asOf=2026-09-15'))
    ).toEqual({
      ok: true,
      query: {
        kind: 'page',
        limit: 15,
        filter: 'past',
        asOf: '2026-09-15',
        assignedToMe: false,
      },
    });
  });

  it('reads assignedToMe for a list page', () => {
    expect(
      parseListBookingsQuery(new URLSearchParams('assignedToMe=1'))
    ).toEqual({
      ok: true,
      query: {
        kind: 'page',
        limit: 15,
        filter: 'upcoming',
        asOf: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        assignedToMe: true,
      },
    });
  });

  it('rejects an unknown filter or asOf', () => {
    expect(parseListBookingsQuery(new URLSearchParams('filter=all'))).toEqual({
      ok: false,
      error: 'filter must be upcoming, past, or cancelled.',
    });
    expect(
      parseListBookingsQuery(new URLSearchParams('asOf=09-15-2026'))
    ).toEqual({ ok: false, error: 'asOf must be YYYY-MM-DD.' });
  });

  it('caps page size and reads a cursor', () => {
    const result = parseListBookingsQuery(
      new URLSearchParams(
        'limit=200&cursor=2026-09-14|14:00:00|11111111-1111-1111-1111-111111111111'
      )
    );
    expect(result).toEqual({
      ok: true,
      query: {
        kind: 'page',
        limit: 50,
        filter: 'upcoming',
        asOf: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        assignedToMe: false,
        cursor: {
          scheduledDate: '2026-09-14',
          startTime: '14:00:00',
          id: '11111111-1111-1111-1111-111111111111',
        },
      },
    });
  });

  it('accepts a bounded calendar range', () => {
    expect(
      parseListBookingsQuery(
        new URLSearchParams('from=2026-08-30&to=2026-10-10')
      )
    ).toEqual({
      ok: true,
      query: {
        kind: 'range',
        from: '2026-08-30',
        to: '2026-10-10',
        assignedToMe: false,
      },
    });
  });

  it('reads assignedToMe on a calendar range', () => {
    expect(
      parseListBookingsQuery(
        new URLSearchParams('from=2026-08-30&to=2026-10-10&assignedToMe=1')
      )
    ).toEqual({
      ok: true,
      query: {
        kind: 'range',
        from: '2026-08-30',
        to: '2026-10-10',
        assignedToMe: true,
      },
    });
  });

  it('rejects an incomplete or oversized range', () => {
    expect(
      parseListBookingsQuery(new URLSearchParams('from=2026-09-01'))
    ).toEqual({ ok: false, error: 'from and to are required together.' });
    expect(
      parseListBookingsQuery(
        new URLSearchParams('from=2026-01-01&to=2026-03-01')
      ).ok
    ).toBe(false);
  });

  it('rejects mixing a cursor with a date range', () => {
    const result = parseListBookingsQuery(
      new URLSearchParams(
        'from=2026-09-01&to=2026-09-07&cursor=2026-09-14|14:00:00|11111111-1111-1111-1111-111111111111'
      )
    );
    expect(result.ok).toBe(false);
  });
});
