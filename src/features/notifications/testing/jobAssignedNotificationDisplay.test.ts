import { describe, expect, it } from 'vitest';
import { notificationToDisplay } from '../types/notification';
import type { Notification } from '../types/notification';

function row(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'n1',
    user_id: 'user-1',
    type: 'job_assigned',
    reference_type: 'booking',
    reference_id: 'booking-1',
    title: 'Job assigned',
    body: 'Alex Rivera · Full Detail — Large SUV',
    read: false,
    read_at: null,
    created_at: '2026-09-22T12:00:00.000Z',
    metadata: {
      customerName: 'Alex Rivera',
      serviceName: 'Full Detail — Large SUV',
    },
    dedupe_key: null,
    ...overrides,
  };
}

describe('job assigned bell display', () => {
  it('shows Job assigned and the service name without the pricing option', () => {
    expect(notificationToDisplay(row())).toMatchObject({
      title: 'Job assigned',
      body: 'Full Detail',
    });
  });

  it('uses a stored service-only body when metadata has no service', () => {
    expect(
      notificationToDisplay(
        row({
          body: 'Full Detail',
          metadata: { customerName: 'Alex Rivera' },
        })
      )
    ).toMatchObject({
      title: 'Job assigned',
      body: 'Full Detail',
    });
  });

  it('drops a customer-only body', () => {
    expect(
      notificationToDisplay(
        row({
          body: 'From Alex Rivera',
          metadata: null,
        })
      )
    ).toMatchObject({
      title: 'Job assigned',
      body: null,
    });
  });

  it('leaves other notification types unchanged', () => {
    expect(
      notificationToDisplay(
        row({
          type: 'availability_booking',
          title: 'New appointment',
          body: 'From Jane',
          metadata: null,
        })
      )
    ).toMatchObject({
      title: 'New appointment',
      body: 'From Jane',
    });
  });
});
