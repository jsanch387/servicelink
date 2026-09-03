import type { QuoteCommunication } from '@/features/quotes/shared/quoteOutboundEvents';
import type { QuoteDbRow } from '../api/types';
import type {
  DashboardQuote,
  DashboardQuoteSource,
  DashboardQuoteStatus,
} from '../types';
import { normalizeQuoteAddonDetails } from '@/features/quotes/shared/quoteServiceSnapshot';
import {
  formatQuoteAssetLine,
  formatQuoteVehicleLine,
  normalizeQuoteAssets,
  quoteAssetFromDisplayLine,
  quoteAssetFromVehicleParts,
  type QuoteAsset,
} from '@/features/quotes/shared/quoteAssets';
import { parsePublicQuoteRequestNote } from '../utils/parsePublicQuoteRequestNote';

const VALID_STATUSES: DashboardQuoteStatus[] = [
  'requested',
  'draft',
  'sent',
  'viewed',
  'approved',
  'declined',
  'expired',
  'cancelled',
];

const VALID_SOURCES: DashboardQuoteSource[] = [
  'owner_created',
  'customer_requested',
];

function asDashboardStatus(value: string): DashboardQuoteStatus {
  if (VALID_STATUSES.includes(value as DashboardQuoteStatus)) {
    return value as DashboardQuoteStatus;
  }
  return 'draft';
}

function asDashboardSource(value: string): DashboardQuoteSource {
  if (VALID_SOURCES.includes(value as DashboardQuoteSource)) {
    return value as DashboardQuoteSource;
  }
  return 'owner_created';
}

function asIsoOrNull(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function resolveQuoteAssets(row: QuoteDbRow): QuoteAsset[] | null {
  const stored = normalizeQuoteAssets(row.assets);
  const first =
    stored?.[0] ??
    quoteAssetFromVehicleParts(
      row.vehicle_year,
      row.vehicle_make,
      row.vehicle_model
    );
  const extra = stored && stored.length > 1 ? stored.slice(1) : [];
  const fromNote = quoteAssetFromDisplayLine(
    parsePublicQuoteRequestNote(row.request_message).secondVehicleLine
  );
  const second = extra[0] ?? fromNote;
  const assets = [first, second, ...extra.slice(1)].filter(
    (asset): asset is QuoteAsset => asset != null
  );
  return assets.length > 0 ? assets : null;
}

export function mapQuoteRowToDashboardQuote(
  row: QuoteDbRow,
  publicToken: string,
  publicLinkExpiresAt: string | null = null,
  communications: readonly QuoteCommunication[] = []
): DashboardQuote {
  const duration =
    row.duration_minutes != null && row.duration_minutes > 0
      ? row.duration_minutes
      : 60;
  const assets = resolveQuoteAssets(row);
  const firstAssetLine =
    formatQuoteVehicleLine(
      row.vehicle_year,
      row.vehicle_make,
      row.vehicle_model
    ) ?? formatQuoteAssetLine(assets?.[0]);

  return {
    id: row.id,
    status: asDashboardStatus(row.status),
    source: asDashboardSource(row.source),
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    serviceName: row.service_name?.trim() || 'Untitled service',
    totalCents: row.price_cents ?? 0,
    durationMinutes: duration,
    activityAt: row.updated_at || row.created_at,
    createdAt: row.created_at,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_start_time,
    note: row.note,
    requestMessage: row.request_message ?? null,
    vehicleYear: row.vehicle_year,
    vehicleMake: row.vehicle_make,
    vehicleModel: row.vehicle_model,
    assets,
    vehicleLine: firstAssetLine,
    serviceStreet: row.customer_street_address,
    serviceUnit: row.customer_unit_apt,
    serviceCity: row.customer_city,
    serviceState: row.customer_state,
    serviceZip: row.customer_zip,
    serviceAddressLine: row.service_address,
    serviceId: row.service_id?.trim() || null,
    servicePriceOptionId: row.service_price_option_id?.trim() || null,
    servicePriceCents:
      row.service_price_cents != null &&
      Number.isFinite(row.service_price_cents)
        ? row.service_price_cents
        : null,
    addonDetails: normalizeQuoteAddonDetails(row.addon_details),
    /**
     * Token string used for `/q/[token]`.
     * We support token hash format too (see `resolveQuoteTokenHash`).
     */
    publicToken: publicToken.trim(),
    publicLinkExpiresAt: publicLinkExpiresAt?.trim() || null,
    viewedAt: asIsoOrNull(row.viewed_at),
    customerReminderSentAt: asIsoOrNull(row.customer_reminder_sent_at),
    communications: [...communications],
  };
}
