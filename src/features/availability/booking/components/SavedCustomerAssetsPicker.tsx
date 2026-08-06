'use client';

import { API_ROUTES } from '@/constants/routes';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { parseVehicleAssetAttributes } from '@/features/customer-management/utils/customerAssetTypes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { useEffect, useState } from 'react';

export type SavedVehicleSelection = {
  year: string;
  make: string;
  model: string;
};

interface SavedCustomerAssetsPickerProps {
  businessSlug: string;
  phone: string;
  bookingFlowLocale?: PublicBookingFlowLocale;
  onSelect: (vehicle: SavedVehicleSelection) => void;
  /** Hide when owner is booking on behalf (they type freely). */
  enabled?: boolean;
}

type SavedAssetChip = {
  id: string;
  label: string;
  vehicle: SavedVehicleSelection;
};

/**
 * One-tap saved vehicles for returning customers (looked up by phone).
 * Compact chip row — does not replace the year/make/model inputs.
 */
export function SavedCustomerAssetsPicker({
  businessSlug,
  phone,
  bookingFlowLocale = 'en',
  onSelect,
  enabled = true,
}: SavedCustomerAssetsPickerProps) {
  const ui = publicBookingUi(bookingFlowLocale);
  const [assets, setAssets] = useState<SavedAssetChip[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setAssets([]);
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (!businessSlug.trim() || digits.length < 10) {
      setAssets([]);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);

    const url = new URL(
      API_ROUTES.PUBLIC_CUSTOMER_ASSETS,
      typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost:3000'
    );
    url.searchParams.set('businessSlug', businessSlug.trim());
    url.searchParams.set('phone', phone.trim());

    void fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then(async res => {
        if (!res.ok) return null;
        return (await res.json()) as {
          success?: boolean;
          assets?: Array<{
            id: string;
            label: string;
            attributes: Record<string, unknown>;
          }>;
        };
      })
      .then(json => {
        if (cancelled || !json?.success || !Array.isArray(json.assets)) {
          if (!cancelled) setAssets([]);
          return;
        }
        const next: SavedAssetChip[] = [];
        for (const row of json.assets) {
          const vehicle = parseVehicleAssetAttributes(row.attributes);
          if (!vehicle) continue;
          next.push({
            id: row.id,
            label:
              row.label?.trim() ||
              `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            vehicle,
          });
        }
        setAssets(next);
      })
      .catch(() => {
        if (!cancelled) setAssets([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [businessSlug, phone, enabled]);

  if (!enabled || (!loading && assets.length === 0)) return null;

  return (
    <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {ui.customerForm.savedVehiclesTitle}
      </p>
      {loading ? (
        <p className="mt-2 text-xs text-zinc-500">
          {ui.customerForm.savedVehiclesLoading}
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {assets.map(asset => (
            <button
              key={asset.id}
              type="button"
              onClick={() => onSelect(asset.vehicle)}
              className="cursor-pointer touch-manipulation rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-left text-xs font-medium text-white transition-colors hover:border-white/30 hover:bg-white/10"
            >
              {asset.label}
            </button>
          ))}
        </div>
      )}
      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
        {ui.customerForm.savedVehiclesHint}
      </p>
    </div>
  );
}
