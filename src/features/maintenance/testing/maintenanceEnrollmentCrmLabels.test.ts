import type { CustomerMaintenanceEnrollmentSummary } from '@/features/customer-management/types';
import {
  customerMaintenanceAnchorDisplay,
  customerMaintenanceEnrollmentCardSubtitle,
  customerMaintenancePlanChipVariant,
  maintenanceEnrollmentBlocksNewOwnerInvite,
} from '@/features/customer-management/utils/customerMaintenanceEnrollmentLabels';
import { describe, expect, it } from 'vitest';

function enrollment(
  overrides: Partial<CustomerMaintenanceEnrollmentSummary>
): CustomerMaintenanceEnrollmentSummary {
  return {
    enrollmentId: 'e1',
    status: 'enrolled_pending_customer',
    paymentStatus: 'pending',
    serviceNameSnapshot: 'Maintenance detail',
    priceCents: 10000,
    frequencyWeeks: 2,
    durationMinutes: 120,
    anchorDate: null,
    anchorTime: null,
    inviteToken: null,
    ...overrides,
  };
}

describe('[Maintenance] customerMaintenancePlanChipVariant', () => {
  it('maps statuses to chip variants', () => {
    expect(customerMaintenancePlanChipVariant(enrollment({}))).toBe('pending');
    expect(
      customerMaintenancePlanChipVariant(
        enrollment({ status: 'accepted' })
      )
    ).toBe('confirmed');
    expect(
      customerMaintenancePlanChipVariant(
        enrollment({ status: 'cancelled' })
      )
    ).toBe('cancelled');
    expect(
      customerMaintenancePlanChipVariant(
        enrollment({ status: 'visit_completed' })
      )
    ).toBe('visit_completed');
  });
});

describe('[Maintenance] maintenanceEnrollmentBlocksNewOwnerInvite', () => {
  it('blocks when pending and invite token exists', () => {
    expect(
      maintenanceEnrollmentBlocksNewOwnerInvite(
        enrollment({ inviteToken: 'abc' })
      )
    ).toBe(true);
  });

  it('does not block pending without token (legacy retry)', () => {
    expect(maintenanceEnrollmentBlocksNewOwnerInvite(enrollment({}))).toBe(
      false
    );
  });

  it('does not block when accepted even with token', () => {
    expect(
      maintenanceEnrollmentBlocksNewOwnerInvite(
        enrollment({ status: 'accepted', inviteToken: 'abc' })
      )
    ).toBe(false);
  });

  it('is false for null enrollment', () => {
    expect(maintenanceEnrollmentBlocksNewOwnerInvite(null)).toBe(false);
  });
});

describe('[Maintenance] customerMaintenanceEnrollmentCardSubtitle', () => {
  it('describes pending and accepted paths', () => {
    expect(customerMaintenanceEnrollmentCardSubtitle(enrollment({}))).toBe(
      'Waiting on customer'
    );
    expect(
      customerMaintenanceEnrollmentCardSubtitle(
        enrollment({ status: 'accepted', paymentStatus: 'paid' })
      )
    ).toBe('Paid · card');
    expect(
      customerMaintenanceEnrollmentCardSubtitle(
        enrollment({ status: 'accepted', paymentStatus: 'pay_in_person' })
      )
    ).toBe('Confirmed · pay in person');
  });
});

describe('[Maintenance] customerMaintenanceAnchorDisplay', () => {
  it('shows Not set yet when anchor missing', () => {
    expect(customerMaintenanceAnchorDisplay(enrollment({}))).toBe('Not set yet');
  });

  it('shows a formatted line when anchor is scheduled', () => {
    const line = customerMaintenanceAnchorDisplay(
      enrollment({
        anchorDate: '2026-06-01',
        anchorTime: '14:30',
      })
    );
    expect(line).not.toBe('Not set yet');
    expect(line).toContain('June');
    expect(line).toContain('2026');
    expect(line).toContain('2:30');
    expect(line).toContain('PM');
  });
});
