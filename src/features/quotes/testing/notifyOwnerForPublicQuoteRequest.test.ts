import { notifyOwnerForPublicQuoteRequest } from '@/features/quotes/public-request/server/notifyOwnerForPublicQuoteRequest';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/push/server/sendExpoPushToUser', () => ({
  sendExpoPushToUser: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/features/email', () => ({
  sendQuoteRequestOwnerNotificationEmail: vi
    .fn()
    .mockResolvedValue({ sent: true }),
}));

import { sendQuoteRequestOwnerNotificationEmail } from '@/features/email';
import { sendExpoPushToUser } from '@/features/push/server/sendExpoPushToUser';

const baseParams = {
  profileId: 'owner-1',
  quoteId: 'quote-1',
  customerName: 'Pat',
  serviceName: 'Detail',
  vehicleYear: null,
  vehicleMake: null,
  vehicleModel: null,
  timeline: null,
  details: 'Wash the car',
};

describe('notifyOwnerForPublicQuoteRequest', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('inserts inbox then push + email once', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ insert });
    const admin = {
      from,
      auth: {
        admin: {
          getUserById: vi
            .fn()
            .mockResolvedValue({ data: { user: { email: 'a@b.com' } } }),
        },
      },
    };

    await notifyOwnerForPublicQuoteRequest(admin as never, baseParams);

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'quote_request',
        reference_id: 'quote-1',
        dedupe_key: 'quote_request:quote-1',
      })
    );
    expect(sendExpoPushToUser).toHaveBeenCalledTimes(1);
    expect(sendQuoteRequestOwnerNotificationEmail).toHaveBeenCalledTimes(1);
  });

  it('does not push or email again for the same quote', async () => {
    const insert = vi.fn().mockResolvedValue({ error: { code: '23505' } });
    const from = vi.fn().mockReturnValue({ insert });
    const admin = {
      from,
      auth: { admin: { getUserById: vi.fn() } },
    };

    await notifyOwnerForPublicQuoteRequest(admin as never, baseParams);

    expect(sendExpoPushToUser).not.toHaveBeenCalled();
    expect(sendQuoteRequestOwnerNotificationEmail).not.toHaveBeenCalled();
    expect(admin.auth.admin.getUserById).not.toHaveBeenCalled();
  });
});
