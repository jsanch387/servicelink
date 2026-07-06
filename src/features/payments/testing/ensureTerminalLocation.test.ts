import { ensureTerminalLocation } from '@/features/payments/server/ensureTerminalLocation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRetrieveLocation = vi.fn();
const mockCreateLocation = vi.fn();
const mockRetrieveAccount = vi.fn();

vi.mock('@/libs/stripe', () => ({
  getStripeConnectClient: () => ({
    terminal: {
      locations: {
        retrieve: mockRetrieveLocation,
        create: mockCreateLocation,
      },
    },
  }),
  getStripePlatform: () => ({
    accounts: {
      retrieve: mockRetrieveAccount,
    },
  }),
}));

function makeSupabase(opts: {
  account?: Record<string, unknown> | null;
  profile?: Record<string, unknown> | null;
  accountError?: { message: string } | null;
  updateError?: { message: string } | null;
}) {
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: opts.updateError ?? null }),
  });

  const paymentAccountsChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: opts.account ?? null,
      error: opts.accountError ?? null,
    }),
    update,
  };

  const businessProfilesChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: opts.profile ?? null,
      error: null,
    }),
  };

  const from = vi.fn((table: string) => {
    if (table === 'payment_accounts') {
      return paymentAccountsChain;
    }
    if (table === 'business_profiles') {
      return businessProfilesChain;
    }
    throw new Error(`unexpected table ${table}`);
  });

  return { supabase: { from } as never, update };
}

describe('ensureTerminalLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an existing location id without creating a new one', async () => {
    mockRetrieveLocation.mockResolvedValue({ id: 'tml_existing' });

    const { supabase } = makeSupabase({
      account: {
        stripe_account_id: 'acct_123',
        stripe_terminal_location_id: 'tml_existing',
        charges_enabled: true,
      },
      profile: { business_name: 'Acme', service_area: 'Austin, TX' },
    });

    const result = await ensureTerminalLocation({
      supabase,
      businessId: 'biz-1',
    });

    expect(result).toEqual({
      ok: true,
      terminalLocationId: 'tml_existing',
      stripeAccountId: 'acct_123',
      merchantDisplayName: 'Acme',
    });
    expect(mockCreateLocation).not.toHaveBeenCalled();
  });

  it('creates a location when none is stored', async () => {
    mockRetrieveAccount.mockResolvedValue({
      id: 'acct_123',
      company: {
        address: {
          line1: '123 Main St',
          city: 'Austin',
          state: 'TX',
          postal_code: '78701',
          country: 'US',
        },
      },
    });
    mockCreateLocation.mockResolvedValue({ id: 'tml_new' });

    const { supabase, update } = makeSupabase({
      account: {
        stripe_account_id: 'acct_123',
        stripe_terminal_location_id: null,
        charges_enabled: true,
      },
      profile: { business_name: 'Acme Detailing', service_area: 'Austin, TX' },
    });

    const result = await ensureTerminalLocation({
      supabase,
      businessId: 'biz-1',
    });

    expect(result).toEqual({
      ok: true,
      terminalLocationId: 'tml_new',
      stripeAccountId: 'acct_123',
      merchantDisplayName: 'Acme Detailing',
    });
    expect(mockCreateLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        display_name: 'Acme Detailing',
        address: expect.objectContaining({ line1: '123 Main St' }),
      })
    );
    expect(update).toHaveBeenCalledWith({
      stripe_terminal_location_id: 'tml_new',
      tap_to_pay_ready: true,
    });
  });

  it('rejects when Connect is not ready', async () => {
    const { supabase } = makeSupabase({
      account: {
        stripe_account_id: 'acct_123',
        charges_enabled: false,
      },
    });

    const result = await ensureTerminalLocation({
      supabase,
      businessId: 'biz-1',
    });

    expect(result).toEqual({
      ok: false,
      httpStatus: 422,
      error: 'Set up Stripe payments to use Tap to Pay.',
    });
  });

  it('fails when the location id cannot be persisted', async () => {
    mockRetrieveAccount.mockResolvedValue({ id: 'acct_123' });
    mockCreateLocation.mockResolvedValue({ id: 'tml_new' });

    const { supabase } = makeSupabase({
      account: {
        stripe_account_id: 'acct_123',
        stripe_terminal_location_id: null,
        charges_enabled: true,
      },
      profile: { business_name: 'Acme', service_area: 'Austin, TX' },
      updateError: { message: 'write failed' },
    });

    const result = await ensureTerminalLocation({
      supabase,
      businessId: 'biz-1',
    });

    expect(result).toEqual({
      ok: false,
      httpStatus: 500,
      error: "Couldn't set up Tap to Pay. Try again or mark as paid.",
    });
  });
});
