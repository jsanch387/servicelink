import {
  MAINTENANCE_ENROLLMENT_PAYMENT_PAID_CARD,
  maintenanceEnrollmentPaidWithCard,
} from '@/features/maintenance/server/maintenanceEnrollmentPaymentStatus';
import { describe, expect, it } from 'vitest';

describe('[Maintenance] maintenanceEnrollmentPaidWithCard', () => {
  it('is true for canonical paid card status', () => {
    expect(maintenanceEnrollmentPaidWithCard(MAINTENANCE_ENROLLMENT_PAYMENT_PAID_CARD)).toBe(
      true
    );
  });

  it('is true for legacy paid_online alias', () => {
    expect(maintenanceEnrollmentPaidWithCard('paid_online')).toBe(true);
  });

  it('is false for pending and pay in person', () => {
    expect(maintenanceEnrollmentPaidWithCard('pending')).toBe(false);
    expect(maintenanceEnrollmentPaidWithCard('pay_in_person')).toBe(false);
    expect(maintenanceEnrollmentPaidWithCard(null)).toBe(false);
    expect(maintenanceEnrollmentPaidWithCard('')).toBe(false);
  });
});
