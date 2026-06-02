import { describe, expect, it } from 'vitest';

import { downgradeProfileFromSubscriptionEnd } from '../server/downgradeProfileFromSubscriptionEnd';
import { syncProfileFromSubscriptionUpdated } from '../server/syncProfileFromSubscriptionUpdated';

type MockProfilesUpdateResult = {
  data: Array<{ user_id: string }> | null;
  error: { message: string } | null;
};

function buildSupabaseMock(result: MockProfilesUpdateResult) {
  const select = async () => result;
  const update = (updates: Record<string, unknown>) => ({
    eq: (_field: string, _value: string) => {
      void _field;
      void _value;
      return { select, updates };
    },
  });
  const from = (_table: string) => ({ update });
  return { from };
}

describe('stripe cancellation flows', () => {
  it('downgrades paid subscription profiles on subscription.deleted', async () => {
    const supabase = buildSupabaseMock({
      data: [{ user_id: 'user-1' }],
      error: null,
    });

    const result = await downgradeProfileFromSubscriptionEnd(
      supabase as never,
      'sub_paid_123'
    );

    expect(result).toEqual({ success: true });
  });

  it('downgrades free-trial profiles on subscription.deleted', async () => {
    const supabase = buildSupabaseMock({
      data: [{ user_id: 'user-2' }],
      error: null,
    });

    const result = await downgradeProfileFromSubscriptionEnd(
      supabase as never,
      'sub_trial_123'
    );

    expect(result).toEqual({ success: true });
  });

  it('marks tier free when Stripe status is canceled in subscription.updated sync', async () => {
    let capturedUpdates: Record<string, unknown> | null = null;
    const select = async () => ({ data: [{ user_id: 'user-3' }], error: null });
    const eq = () => ({ select });
    const update = (updates: Record<string, unknown>) => {
      capturedUpdates = updates;
      return { eq };
    };
    const supabase = {
      from: () => ({ update }),
    };

    const result = await syncProfileFromSubscriptionUpdated(supabase as never, {
      stripeSubscriptionId: 'sub_cancel_123',
      subscriptionStatus: 'canceled',
      currentPeriodEndUnix: null,
      cancelAtPeriodEnd: false,
    });

    expect(result).toEqual({ success: true });
    expect(capturedUpdates).toMatchObject({
      subscription_status: 'canceled',
      subscription_tier: 'free',
      subscription_cancel_at_period_end: false,
    });
  });
});
