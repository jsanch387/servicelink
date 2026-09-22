import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendJobAssignedEmailMock = vi.hoisted(() => vi.fn());
const sendExpoPushToUserMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/email/job-assigned/sendJobAssignedEmail', () => ({
  sendJobAssignedEmail: sendJobAssignedEmailMock,
}));

vi.mock('@/features/email/services/resendClient', () => ({
  getAppBaseUrl: () => 'https://myservicelink.app',
}));

vi.mock('@/features/push/server/sendExpoPushToUser', () => ({
  sendExpoPushToUser: sendExpoPushToUserMock,
}));

import { notifyAssigneeForJobAssigned } from '../server/notifyAssigneeForJobAssigned';

function createAdmin(options?: {
  booking?: Record<string, string> | null;
  shop?: { business_name: string } | null;
  email?: string | null;
}) {
  const insertNotification = vi.fn().mockResolvedValue({ error: null });
  const admin = {
    from: vi.fn((table: string) => {
      if (table === 'notifications') {
        return { insert: insertNotification };
      }
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
          data: {
            user:
              options?.email === null
                ? null
                : { email: options?.email ?? 'jose@example.com' },
          },
          error: null,
        }),
      },
    },
    insertNotification,
  };
  return admin;
}

describe('notifyAssigneeForJobAssigned', () => {
  beforeEach(() => {
    sendJobAssignedEmailMock.mockReset();
    sendJobAssignedEmailMock.mockResolvedValue({
      sent: true,
      messageId: 're_1',
    });
    sendExpoPushToUserMock.mockReset();
    sendExpoPushToUserMock.mockResolvedValue(undefined);
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
    expect(sendExpoPushToUserMock).not.toHaveBeenCalled();
    expect(admin.insertNotification).not.toHaveBeenCalled();
  });

  it('emails, inserts inbox, and pushes when someone else assigns them', async () => {
    const admin = createAdmin();

    await notifyAssigneeForJobAssigned({
      admin: admin as never,
      businessId: 'biz',
      bookingId: 'b1',
      actorUserId: 'owner',
      previousAssignedUserId: null,
      nextAssignedUserId: 'jose',
    });

    expect(admin.insertNotification).toHaveBeenCalledWith({
      user_id: 'jose',
      type: 'job_assigned',
      reference_type: 'booking',
      reference_id: 'b1',
      title: 'Job assigned',
      body: 'Alex Rivera · Full detail',
      metadata: {
        customerName: 'Alex Rivera',
        serviceName: 'Full detail',
      },
    });
    expect(sendExpoPushToUserMock).toHaveBeenCalledWith(expect.anything(), {
      userId: 'jose',
      title: 'Job assigned',
      body: 'Alex Rivera · Full detail',
      data: { reference_type: 'booking', reference_id: 'b1' },
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

  it('still notifies inbox and push when the assignee has no email', async () => {
    const admin = createAdmin({ email: null });

    await notifyAssigneeForJobAssigned({
      admin: admin as never,
      businessId: 'biz',
      bookingId: 'b1',
      actorUserId: 'owner',
      previousAssignedUserId: null,
      nextAssignedUserId: 'jose',
    });

    expect(admin.insertNotification).toHaveBeenCalled();
    expect(sendExpoPushToUserMock).toHaveBeenCalled();
    expect(sendJobAssignedEmailMock).not.toHaveBeenCalled();
  });
});
