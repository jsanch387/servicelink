import {
  normalizeUsPhoneDigits,
  US_PHONE_DIGIT_COUNT,
} from '@/lib/formatUsPhone';
import {
  VOICE_FROZEN_ADDON,
  VOICE_FROZEN_PET_HAIR_ADDON,
  VOICE_FROZEN_SERVICE,
} from '../constants/frozenCatalog';
import type { VoiceDraft, VoiceDraftAddon } from '../types/voiceDraft';
import { extractVoiceDraftFromTranscript } from './extractVoiceDraftFromTranscript';

function preferIncoming(current: string, incoming: string): string {
  const next = incoming.trim();
  return next ? next : current;
}

function normalizePhone(raw: string): string {
  const digits = normalizeUsPhoneDigits(raw);
  return digits.length === US_PHONE_DIGIT_COUNT ? digits : '';
}

function looksLikeFullDetail(value: string): boolean {
  const t = value.trim().toLowerCase();
  return t.includes('full detail') || t === 'full' || t === 'detail';
}

function looksLikeCeramic(value: string): boolean {
  const t = value.trim().toLowerCase();
  return t.includes('ceramic');
}

function looksLikePetHair(value: string): boolean {
  const t = value.trim().toLowerCase();
  return t.includes('pet hair') || t.includes('pet-hair');
}

function addonKey(addon: VoiceDraftAddon): string {
  if (looksLikeCeramic(addon.name) || addon.id === VOICE_FROZEN_ADDON.id) {
    return VOICE_FROZEN_ADDON.id;
  }
  if (
    looksLikePetHair(addon.name) ||
    addon.id === VOICE_FROZEN_PET_HAIR_ADDON.id
  ) {
    return VOICE_FROZEN_PET_HAIR_ADDON.id;
  }
  return (addon.id || addon.name).trim().toLowerCase();
}

function normalizeAddon(addon: VoiceDraftAddon): VoiceDraftAddon | null {
  if (!addon.id.trim() && !addon.name.trim()) return null;
  const key = addonKey(addon);
  if (key === VOICE_FROZEN_ADDON.id) return { ...VOICE_FROZEN_ADDON };
  if (key === VOICE_FROZEN_PET_HAIR_ADDON.id) {
    return { ...VOICE_FROZEN_PET_HAIR_ADDON };
  }
  return addon;
}

function mergeAddons(
  current: VoiceDraftAddon[],
  incoming: VoiceDraftAddon[],
  transcript: string
): VoiceDraftAddon[] {
  const mentionedCeramic = looksLikeCeramic(transcript);
  const mentionedPetHair = looksLikePetHair(transcript);
  const byKey = new Map<string, VoiceDraftAddon>();

  for (const addon of current) {
    const normalized = normalizeAddon(addon);
    if (!normalized) continue;
    byKey.set(addonKey(normalized), normalized);
  }

  for (const addon of incoming) {
    const normalized = normalizeAddon(addon);
    if (!normalized) continue;
    const key = addonKey(normalized);
    if (key === VOICE_FROZEN_ADDON.id && !mentionedCeramic && !byKey.has(key)) {
      continue;
    }
    if (
      key === VOICE_FROZEN_PET_HAIR_ADDON.id &&
      !mentionedPetHair &&
      !byKey.has(key)
    ) {
      continue;
    }
    if (!byKey.has(key)) byKey.set(key, normalized);
  }

  if (mentionedCeramic && !byKey.has(VOICE_FROZEN_ADDON.id)) {
    byKey.set(VOICE_FROZEN_ADDON.id, { ...VOICE_FROZEN_ADDON });
  }
  if (mentionedPetHair && !byKey.has(VOICE_FROZEN_PET_HAIR_ADDON.id)) {
    byKey.set(VOICE_FROZEN_PET_HAIR_ADDON.id, {
      ...VOICE_FROZEN_PET_HAIR_ADDON,
    });
  }

  return [...byKey.values()];
}

function applyFrozenCatalog(draft: VoiceDraft, transcript: string): VoiceDraft {
  let service = draft.service;
  let pricing = draft.pricing;

  if (looksLikeFullDetail(service) || looksLikeFullDetail(transcript)) {
    if (!service.trim()) service = VOICE_FROZEN_SERVICE.name;
    if (!pricing.trim()) pricing = VOICE_FROZEN_SERVICE.priceLabel;
  }

  return { ...draft, service, pricing };
}

export function mergeVoiceDraft(
  current: VoiceDraft,
  incoming: VoiceDraft,
  transcript: string,
  now = new Date()
): VoiceDraft {
  const phoneFromIncoming = normalizePhone(incoming.phone);
  const phone =
    phoneFromIncoming || normalizePhone(current.phone) || current.phone;

  const extracted = extractVoiceDraftFromTranscript(transcript, now);

  const merged: VoiceDraft = {
    customer:
      preferIncoming(current.customer, incoming.customer) || extracted.customer,
    phone: phone || extracted.phone,
    service: preferIncoming(current.service, incoming.service),
    pricing: preferIncoming(current.pricing, incoming.pricing),
    addons: mergeAddons(current.addons, incoming.addons, transcript),
    vehicleYear: preferIncoming(current.vehicleYear, incoming.vehicleYear),
    vehicleMake: preferIncoming(current.vehicleMake, incoming.vehicleMake),
    vehicleModel: preferIncoming(current.vehicleModel, incoming.vehicleModel),
    address: preferIncoming(current.address, incoming.address),
    date: preferIncoming(current.date, incoming.date) || extracted.date,
    time: preferIncoming(current.time, incoming.time) || extracted.time,
  };

  return applyFrozenCatalog(merged, transcript);
}
