import type { QuoteDbRow } from '../api/types';
import type {
  DashboardQuote,
  DashboardQuoteSource,
  DashboardQuoteStatus,
} from '../types';

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

function buildVehicleLine(row: QuoteDbRow): string | null {
  const text = [row.vehicle_year, row.vehicle_make, row.vehicle_model]
    .map(part => (part ?? '').trim())
    .filter(Boolean)
    .join(' ');
  return text || null;
}

export function mapQuoteRowToDashboardQuote(
  row: QuoteDbRow,
  publicToken: string
): DashboardQuote {
  const duration =
    row.duration_minutes != null && row.duration_minutes > 0
      ? row.duration_minutes
      : 60;

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
    vehicleYear: row.vehicle_year,
    vehicleMake: row.vehicle_make,
    vehicleModel: row.vehicle_model,
    vehicleLine: buildVehicleLine(row),
    /**
     * Token string used for `/q/[token]`.
     * We support token hash format too (see `resolveQuoteTokenHash`).
     */
    publicToken: publicToken.trim(),
  };
}
