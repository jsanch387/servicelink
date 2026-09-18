import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendJobAssignedEmailMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/email/job-assigned/sendJobAssignedEmail', () => ({
  sendJobAssignedEmail: sendJobAssignedEmailMock,
}));

vi.mock('@/features/email/services/resendClient', () => ({
  getAppBaseUrl: () => 'https://myservicelink.app',
}));

import { notifyAssigneeForJobAssigned } from '../server/notifyAssigneeForJobAssigned';

function createAdmin(options?: {
  booking?: Record<string, string> | null;
  shop?: { business_name: string } | null;
  email?: string;
}) {
  return {
    from: vi.fn((table: string) => {
      const data =
        table === 'bookings'
          ? (options?.booking ?? {
              customer_name: 'Alex Rivera',
              service_name: 'Full detail',
              scheduled_date: '2026-09-18',
              start_time: '09:00:00',
            })
          : (options?.shop ?? { business_name: 'Sparkle Mobile' });
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
            }),
            maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
          }),
        }),
      };
    }),
    auth: {
      admin: {
        getUserById: vi.fn().mockResolvedValue({
          data: { user: { email: options?.email ?? 'jose@example.com' } },
          error: null,
        }),
      },
    },
  };
}

describe('notifyAssigneeForJobAssigned', () => {
  beforeEach(() => {
    sendJobAssignedEmailMock.mockReset();
    sendJobAssignedEmailMock.mockResolvedValue({
      sent: true,
      messageId: 're_1',
    });
  });

  it('skips self-assign and unassign', async () => {
    const admin = createAdmin();

    await notifyAssigneeForJobAssigned({
      admin: admin as never,
      businessId: 'biz',
      bookingId: 'b1',
      actorUserId: 'jose',
      previousAssignedUserId: null,
      nextAssignedUserId: 'jose',
    });
    await notifyAssigneeForJobAssigned({
      admin: admin as never,
      businessId: 'biz',
      bookingId: 'b1',
      actorUserId: 'owner',
      previousAssignedUserId: 'jose',
      nextAssignedUserId: null,
    });

    expect(sendJobAssignedEmailMock).not.toHaveBeenCalled();
  });

  it('emails the teammate when someone else assigns them', async () => {
    const admin = createAdmin();

    await notifyAssigneeForJobAssigned({
      admin: admin as never,
      businessId: 'biz',
      bookingId: 'b1',
      actorUserId: 'owner',
      previousAssignedUserId: null,
      nextAssignedUserId: 'jose',
    });

    expect(sendJobAssignedEmailMock).toHaveBeenCalledWith(
      'jose@example.com',
      expect.objectContaining({
        businessName: 'Sparkle Mobile',
        customerName: 'Alex Rivera',
        serviceName: 'Full detail',
        bookingsUrl: 'https://myservicelink.app/dashboard/bookings',
      })
    );
  });
});
