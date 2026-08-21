import { describe, expect, it } from 'vitest';
import {
  BOOKING_LINK_V2_MOCK_SERVICE_IMAGES,
  getBookingLinkV2MockServiceImage,
} from '../utils/serviceCardImage';

describe('getBookingLinkV2MockServiceImage', () => {
  it('uses a stable marketplace mock for the same service id', () => {
    const first = getBookingLinkV2MockServiceImage('svc-a');
    const second = getBookingLinkV2MockServiceImage('svc-a');

    expect(BOOKING_LINK_V2_MOCK_SERVICE_IMAGES).toContain(first);
    expect(second).toBe(first);
  });

  it('picks different mocks for different service ids', () => {
    const images = ['svc-1', 'svc-2', 'svc-3', 'svc-4', 'svc-5'].map(id =>
      getBookingLinkV2MockServiceImage(id)
    );
    expect(new Set(images).size).toBeGreaterThan(1);
  });
});
