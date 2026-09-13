import { emptyVoiceDraft } from '../constants/voiceTurnEcho';
import type { VoiceDraft, VoiceDraftAddon } from '../types/voiceDraft';

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function parseAddon(value: unknown): VoiceDraftAddon | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const o = value as Record<string, unknown>;
  return {
    id: asString(o.id),
    name: asString(o.name),
    priceLabel: asString(o.priceLabel),
  };
}

function parseAddons(value: unknown): VoiceDraftAddon[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(parseAddon)
    .filter((addon): addon is VoiceDraftAddon => addon !== null);
}

/**
 * Coerce a JSON string or object into the full draft shape.
 * Missing / invalid input becomes an empty draft — never a 400.
 */
export function parseVoiceDraft(raw: unknown): VoiceDraft {
  let value: unknown = raw;

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return emptyVoiceDraft();
    try {
      value = JSON.parse(trimmed) as unknown;
    } catch {
      return emptyVoiceDraft();
    }
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return emptyVoiceDraft();
  }

  const o = value as Record<string, unknown>;
  return {
    customer: asString(o.customer),
    phone: asString(o.phone),
    service: asString(o.service),
    pricing: asString(o.pricing),
    addons: parseAddons(o.addons),
    vehicleYear: asString(o.vehicleYear),
    vehicleMake: asString(o.vehicleMake),
    vehicleModel: asString(o.vehicleModel),
    address: asString(o.address),
    date: asString(o.date),
    time: asString(o.time),
  };
}
