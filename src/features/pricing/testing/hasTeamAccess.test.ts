import { describe, expect, it } from 'vitest';
import {
  hasTeamAccess,
  platformPlanFromStripeMetadata,
} from '../utils/hasTeamAccess';
import { platformPlanFromStripeSubscription } from '../utils/platformPlanFromStripeSubscription';
import { portalProductsForPlanSwitch } from '../server/portalProductsForPlanSwitch';
import { teamInviteWouldExceedSeatLimit } from '../utils/teamSeatCapacity';

describe('hasTeamAccess', () => {
  it('keeps shops that already used Team, even when billing is off', () => {
    expect(
      hasTeamAccess({
        teamIncluded: true,
        subscriptionPlan: null,
        grantsPaidAccess: false,
      })
    ).toBe(true);
  });

  it('requires a live Team subscription when the shop was never on Team', () => {
    expect(
      hasTeamAccess({
        teamIncluded: false,
        subscriptionPlan: 'pro',
        grantsPaidAccess: true,
      })
    ).toBe(false);
    expect(
      hasTeamAccess({
        teamIncluded: false,
        subscriptionPlan: 'team',
        grantsPaidAccess: true,
      })
    ).toBe(true);
    expect(
      hasTeamAccess({
        teamIncluded: false,
        subscriptionPlan: 'team',
        grantsPaidAccess: false,
      })
    ).toBe(false);
  });
});

describe('platformPlanFromStripeMetadata', () => {
  it('reads the team mark and treats everything else as pro', () => {
    expect(platformPlanFromStripeMetadata({ platform_plan: 'team' })).toBe(
      'team'
    );
    expect(platformPlanFromStripeMetadata({ platform_plan: 'pro' })).toBe(
      'pro'
    );
    expect(platformPlanFromStripeMetadata(null)).toBe('pro');
  });
});

describe('platformPlanFromStripeSubscription', () => {
  const teamPriceIds = ['price_team_month', 'price_team_year'];
  const proPriceIds = ['price_pro_month', 'price_pro_year'];

  it('uses the Team price even when metadata still says pro', () => {
    expect(
      platformPlanFromStripeSubscription({
        priceId: 'price_team_month',
        metadata: { platform_plan: 'pro' },
        teamPriceIds,
        proPriceIds,
      })
    ).toBe('team');
  });

  it('uses a known Pro price over stale team metadata', () => {
    expect(
      platformPlanFromStripeSubscription({
        priceId: 'price_pro_year',
        metadata: { platform_plan: 'team' },
        teamPriceIds,
        proPriceIds,
      })
    ).toBe('pro');
  });

  it('falls back to metadata for a legacy price', () => {
    expect(
      platformPlanFromStripeSubscription({
        priceId: 'price_legacy_10',
        metadata: { platform_plan: 'team' },
        teamPriceIds,
        proPriceIds,
      })
    ).toBe('team');
  });
});

describe('portalProductsForPlanSwitch', () => {
  it('lists only the Team catalog price', () => {
    expect(
      portalProductsForPlanSwitch({
        nextProductId: 'prod_team',
        nextPriceId: 'price_team',
      })
    ).toEqual([{ product: 'prod_team', prices: ['price_team'] }]);
  });
});

describe('teamInviteWouldExceedSeatLimit', () => {
  it('counts the owner, active hires, and pending invites', () => {
    expect(
      teamInviteWouldExceedSeatLimit({
        activeMemberCount: 2,
        pendingInviteCount: 1,
        seatLimit: 4,
        resendingPendingInvite: false,
      })
    ).toBe(true);
    expect(
      teamInviteWouldExceedSeatLimit({
        activeMemberCount: 2,
        pendingInviteCount: 0,
        seatLimit: 4,
        resendingPendingInvite: false,
      })
    ).toBe(false);
  });

  it('lets a pending invite be resent at the cap', () => {
    expect(
      teamInviteWouldExceedSeatLimit({
        activeMemberCount: 3,
        pendingInviteCount: 1,
        seatLimit: 4,
        resendingPendingInvite: true,
      })
    ).toBe(false);
  });
});
