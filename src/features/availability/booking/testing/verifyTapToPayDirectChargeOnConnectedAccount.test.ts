import { verifyTapToPayDirectChargeOnConnectedAccount } from '@/features/availability/booking/server/verifyTapToPayDirectChargeOnConnectedAccount';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const connectRetrieve = vi.fn();
const platformRetrieve = vi.fn();

vi.mock('@/libs/stripe', () => ({
  getStripeConnectClient: vi.fn(() => ({
    paymentIntents: { retrieve: connectRetrieve },
  })),
  getStripePlatform: vi.fn(() => ({
    paymentIntents: { retrieve: platformRetrieve },
  })),
}));

describe('verifyTapToPayDirectChargeOnConnectedAccount', () => {
  beforeEach(() => {
    connectRetrieve.mockReset();
    platformRetrieve.mockReset();
  });

  it('accepts a direct charge PI on the connected account', async () => {
    connectRetrieve.mockResolvedValueOnce({
      id: 'pi_test',
      on_behalf_of: null,
      transfer_data: null,
    });
    platformRetrieve.mockRejectedValueOnce(new Error('not found'));

    const result = await verifyTapToPayDirectChargeOnConnectedAccount({
      paymentIntentId: 'pi_test',
      stripeAccountId: 'acct_test',
    });

    expect(result.ok).toBe(true);
  });

  it('rejects platform PI with on_behalf_of', async () => {
    connectRetrieve.mockResolvedValueOnce({
      id: 'pi_test',
      on_behalf_of: 'acct_test',
    });
    platformRetrieve.mockRejectedValueOnce(new Error('not found'));

    const result = await verifyTapToPayDirectChargeOnConnectedAccount({
      paymentIntentId: 'pi_test',
      stripeAccountId: 'acct_test',
    });

    expect(result.ok).toBe(false);
  });

  it('rejects PI retrievable on the platform account', async () => {
    connectRetrieve.mockResolvedValueOnce({
      id: 'pi_test',
      on_behalf_of: null,
      transfer_data: null,
    });
    platformRetrieve.mockResolvedValueOnce({ id: 'pi_test' });

    const result = await verifyTapToPayDirectChargeOnConnectedAccount({
      paymentIntentId: 'pi_test',
      stripeAccountId: 'acct_test',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/platform account/i);
    }
  });
});
