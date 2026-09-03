import {
  NOTIFICATIONS_MAX_PAGE_SIZE,
  NOTIFICATIONS_PAGE_SIZE,
} from '../constants';
import { parseNotificationListParams } from '../utils/parseNotificationListParams';
import { describe, expect, it } from 'vitest';

describe('parseNotificationListParams', () => {
  it('uses defaults when params are missing', () => {
    expect(parseNotificationListParams(new URLSearchParams())).toEqual({
      limit: NOTIFICATIONS_PAGE_SIZE,
      offset: 0,
      filter: 'new',
    });
  });

  it('clamps limit and offset', () => {
    expect(
      parseNotificationListParams(
        new URLSearchParams({ limit: '999', offset: '-4' })
      )
    ).toEqual({
      limit: NOTIFICATIONS_MAX_PAGE_SIZE,
      offset: 0,
      filter: 'new',
    });
  });

  it('parses valid values', () => {
    expect(
      parseNotificationListParams(
        new URLSearchParams({ limit: '8', offset: '12' })
      )
    ).toEqual({ limit: 8, offset: 12, filter: 'new' });
  });

  it('parses the recent filter', () => {
    expect(
      parseNotificationListParams(new URLSearchParams({ filter: 'recent' }))
    ).toEqual({
      limit: NOTIFICATIONS_PAGE_SIZE,
      offset: 0,
      filter: 'recent',
    });
  });
});
