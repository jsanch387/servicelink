import { getServicePriceOptions } from '@/features/services/api/getServicePriceOptions';
import { saveServicePriceOptions } from '@/features/services/api/saveServicePriceOptions';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/libs/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

describe('[Services] saveServicePriceOptions', () => {
  it('returns success after delete when options list is empty', async () => {
    const eqBusiness = vi.fn().mockResolvedValue({ error: null });
    const eqService = vi.fn(() => ({ eq: eqBusiness }));
    const deleteMock = vi.fn(() => ({ eq: eqService }));
    const insertMock = vi.fn();
    const supabase = {
      from: vi.fn(() => ({
        delete: deleteMock,
        insert: insertMock,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const result = await saveServicePriceOptions(
      supabase,
      'svc-1',
      'biz-1',
      []
    );

    expect(result).toEqual({ success: true, error: null });
    expect(supabase.from).toHaveBeenCalledWith('service_price_options');
    expect(deleteMock).toHaveBeenCalledOnce();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('inserts normalized rows with defaults for sort_order and is_active', async () => {
    const eqBusiness = vi.fn().mockResolvedValue({ error: null });
    const eqService = vi.fn(() => ({ eq: eqBusiness }));
    const deleteMock = vi.fn(() => ({ eq: eqService }));
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn(() => ({
        delete: deleteMock,
        insert: insertMock,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const result = await saveServicePriceOptions(supabase, 'svc-1', 'biz-1', [
      {
        label: 'Sedan',
        price_cents: 5000,
        duration_minutes: 60,
        sort_order: 5,
      },
      { label: 'SUV', price_cents: 7000, duration_minutes: 90, sort_order: 1 },
      {
        label: 'Truck',
        price_cents: 8000,
        duration_minutes: 120,
        sort_order: 2,
      },
      {
        label: 'Van',
        price_cents: 7500,
        duration_minutes: 90,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sort_order: undefined as any,
      },
      { label: 'Coupe', price_cents: 5500, duration_minutes: 60 },
    ]);

    expect(result).toEqual({ success: true, error: null });
    expect(insertMock).toHaveBeenCalledOnce();
    expect(insertMock).toHaveBeenCalledWith([
      {
        service_id: 'svc-1',
        business_id: 'biz-1',
        label: 'Sedan',
        price_cents: 5000,
        duration_minutes: 60,
        sort_order: 5,
        is_active: true,
      },
      {
        service_id: 'svc-1',
        business_id: 'biz-1',
        label: 'SUV',
        price_cents: 7000,
        duration_minutes: 90,
        sort_order: 1,
        is_active: true,
      },
      {
        service_id: 'svc-1',
        business_id: 'biz-1',
        label: 'Truck',
        price_cents: 8000,
        duration_minutes: 120,
        sort_order: 2,
        is_active: true,
      },
      {
        service_id: 'svc-1',
        business_id: 'biz-1',
        label: 'Van',
        price_cents: 7500,
        duration_minutes: 90,
        sort_order: 3,
        is_active: true,
      },
      {
        service_id: 'svc-1',
        business_id: 'biz-1',
        label: 'Coupe',
        price_cents: 5500,
        duration_minutes: 60,
        sort_order: 4,
        is_active: true,
      },
    ]);
  });

  it('returns a failure when delete step fails', async () => {
    const eqBusiness = vi.fn().mockResolvedValue({
      error: { message: 'delete failed' },
    });
    const eqService = vi.fn(() => ({ eq: eqBusiness }));
    const deleteMock = vi.fn(() => ({ eq: eqService }));
    const insertMock = vi.fn();
    const supabase = {
      from: vi.fn(() => ({
        delete: deleteMock,
        insert: insertMock,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const result = await saveServicePriceOptions(
      supabase,
      'svc-1',
      'biz-1',
      []
    );

    expect(result).toEqual({ success: false, error: 'delete failed' });
    expect(insertMock).not.toHaveBeenCalled();
  });
});

describe('[Services] getServicePriceOptions', () => {
  it('returns rows from supabase on success', async () => {
    const rows = [
      {
        id: 'opt-1',
        service_id: 'svc-1',
        business_id: 'biz-1',
        label: 'Sedan',
        price_cents: 5000,
        duration_minutes: 60,
        sort_order: 0,
        is_active: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ];

    const orderCreated = vi.fn().mockResolvedValue({ data: rows, error: null });
    const orderSort = vi.fn(() => ({ order: orderCreated }));
    const eqBusiness = vi.fn(() => ({ order: orderSort }));
    const eqService = vi.fn(() => ({ eq: eqBusiness }));
    const selectMock = vi.fn(() => ({ eq: eqService }));
    const fromMock = vi.fn(() => ({ select: selectMock }));

    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: fromMock,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const result = await getServicePriceOptions('svc-1', 'biz-1');

    expect(result).toEqual({ success: true, data: rows, error: null });
    expect(fromMock).toHaveBeenCalledWith('service_price_options');
    expect(selectMock).toHaveBeenCalledOnce();
  });

  it('returns a failure response when supabase query fails', async () => {
    const orderCreated = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'query failed' } });
    const orderSort = vi.fn(() => ({ order: orderCreated }));
    const eqBusiness = vi.fn(() => ({ order: orderSort }));
    const eqService = vi.fn(() => ({ eq: eqBusiness }));
    const selectMock = vi.fn(() => ({ eq: eqService }));
    const fromMock = vi.fn(() => ({ select: selectMock }));

    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: fromMock,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const result = await getServicePriceOptions('svc-1', 'biz-1');

    expect(result).toEqual({
      success: false,
      data: null,
      error: 'query failed',
    });
  });
});
