/**
 * Supabase-backed Instagram DM conversation state (Step 3).
 */

import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { ConversationIntent } from '@/services/ai/intentParser';
import {
  hasCompleteCustomer,
  hasCompleteSchedule,
  isDetailsAskSent,
  isFinalRecapSent,
} from '@/services/meta/instagramDmBookingState';

export const CONVERSATION_STAGES = [
  'greeting',
  'qualifying',
  'offering',
  'awaiting_confirmation',
  'collecting_customer',
  'ready_to_book',
  'booked',
] as const;

export type ConversationStage = (typeof CONVERSATION_STAGES)[number];

export type InstagramDmConversation = {
  id: string;
  businessId: string;
  instagramSenderId: string;
  stage: ConversationStage;
  collectedService: string | null;
  collectedServiceId: string | null;
  collectedVehicle: string | null;
  collectedVehicleYear: string | null;
  collectedVehicleMake: string | null;
  collectedVehicleModel: string | null;
  collectedDate: string | null;
  collectedNotes: string | null;
  collectedName: string | null;
  collectedPhone: string | null;
  collectedEmail: string | null;
  collectedStreet: string | null;
  collectedUnit: string | null;
  collectedCity: string | null;
  collectedState: string | null;
  collectedZip: string | null;
  bookingId: string | null;
  lastOutboundText: string | null;
  lastActivityAt: Date | null;
};

type ConversationRow = {
  id: string;
  business_id: string;
  instagram_sender_id: string;
  stage: string;
  collected_service: string | null;
  collected_service_id?: string | null;
  collected_vehicle: string | null;
  collected_vehicle_year?: string | null;
  collected_vehicle_make?: string | null;
  collected_vehicle_model?: string | null;
  collected_date: string | null;
  collected_notes: string | null;
  collected_name?: string | null;
  collected_phone?: string | null;
  collected_email?: string | null;
  collected_street?: string | null;
  collected_unit?: string | null;
  collected_city?: string | null;
  collected_state?: string | null;
  collected_zip?: string | null;
  booking_id?: string | null;
  last_outbound_text: string | null;
  updated_at?: string | null;
};

const EXTENDED_SELECT =
  'collected_service_id, collected_name, collected_phone, collected_email, collected_street, collected_unit, collected_city, collected_state, collected_zip, collected_vehicle_year, collected_vehicle_make, collected_vehicle_model, booking_id';

function mapRow(row: ConversationRow): InstagramDmConversation {
  const stage = CONVERSATION_STAGES.includes(row.stage as ConversationStage)
    ? (row.stage as ConversationStage)
    : 'greeting';

  return {
    id: row.id,
    businessId: row.business_id,
    instagramSenderId: row.instagram_sender_id,
    stage,
    collectedService: row.collected_service?.trim() || null,
    collectedServiceId: row.collected_service_id?.trim() || null,
    collectedVehicle: row.collected_vehicle?.trim() || null,
    collectedVehicleYear: row.collected_vehicle_year?.trim() || null,
    collectedVehicleMake: row.collected_vehicle_make?.trim() || null,
    collectedVehicleModel: row.collected_vehicle_model?.trim() || null,
    collectedDate: row.collected_date ?? null,
    collectedNotes: row.collected_notes?.trim() || null,
    collectedName: row.collected_name?.trim() || null,
    collectedPhone: row.collected_phone?.trim() || null,
    collectedEmail: row.collected_email?.trim() || null,
    collectedStreet: row.collected_street?.trim() || null,
    collectedUnit: row.collected_unit?.trim() || null,
    collectedCity: row.collected_city?.trim() || null,
    collectedState: row.collected_state?.trim() || null,
    collectedZip: row.collected_zip?.trim() || null,
    bookingId: row.booking_id?.trim() || null,
    lastOutboundText: row.last_outbound_text?.trim() || null,
    lastActivityAt: row.updated_at ? new Date(row.updated_at) : null,
  };
}

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function loadInstagramDmConversation(
  businessId: string,
  instagramSenderId: string
): Promise<InstagramDmConversation | null> {
  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const baseSelect =
    'id, business_id, instagram_sender_id, stage, collected_service, collected_vehicle, collected_date, collected_notes, last_outbound_text';

  const trySelect = async (select: string) =>
    db
      .from('instagram_dm_conversations')
      .select(select)
      .eq('business_id', businessId)
      .eq('instagram_sender_id', instagramSenderId)
      .maybeSingle();

  let { data, error } = await trySelect(
    `${baseSelect}, ${EXTENDED_SELECT}, updated_at`
  );

  if (error?.message) {
    ({ data, error } = await trySelect(`${baseSelect}, updated_at`));
  }
  if (error?.message?.includes('updated_at')) {
    ({ data, error } = await trySelect(baseSelect));
  }

  if (error) {
    throw new Error(
      `Failed to load instagram_dm_conversations: ${error.message}`
    );
  }

  if (!data) {
    return null;
  }

  return mapRow(data as ConversationRow);
}

export type MergeConversationInput = {
  existing: InstagramDmConversation | null;
  parsed: ConversationIntent;
  collectedServiceId?: string | null;
  requireVehicleFields: boolean;
};

export type MergedConversationState = {
  stage: ConversationStage;
  collectedService: string | null;
  collectedServiceId: string | null;
  collectedVehicle: string | null;
  collectedVehicleYear: string | null;
  collectedVehicleMake: string | null;
  collectedVehicleModel: string | null;
  collectedDate: string | null;
  collectedNotes: string | null;
  collectedName: string | null;
  collectedPhone: string | null;
  collectedEmail: string | null;
  collectedStreet: string | null;
  collectedUnit: string | null;
  collectedCity: string | null;
  collectedState: string | null;
  collectedZip: string | null;
  bookingId: string | null;
};

export function getPreferredTimeFromNotes(
  notes: string | null | undefined
): string | null {
  if (!notes?.trim()) {
    return null;
  }
  const match = notes.match(/preferred time:\s*([^;]+)/i);
  return match?.[1]?.trim() || null;
}

function mergePreferredTimeIntoNotes(
  existingNotes: string | null | undefined,
  extractedTime: string | null | undefined
): string | null {
  const time = nonEmpty(extractedTime);
  if (!time) {
    return nonEmpty(existingNotes);
  }

  const withoutTime = (existingNotes ?? '')
    .replace(/preferred time:\s*[^;]+;?\s*/gi, '')
    .trim();
  return withoutTime
    ? `preferred time: ${time}; ${withoutTime}`
    : `preferred time: ${time}`;
}

function pickMoreSpecificVehicle(
  existing: string | null | undefined,
  incoming: string | null
): string | null {
  if (!incoming) {
    return nonEmpty(existing);
  }
  if (!existing?.trim()) {
    return incoming;
  }
  return incoming.length >= existing.length ? incoming : existing;
}

function inferStage(args: {
  bookingId: string | null;
  isBookingInquiry: boolean;
  conversation: Omit<MergedConversationState, 'stage'>;
  existingStage?: ConversationStage;
  customerDeclinedBooking: boolean;
  requireVehicleFields: boolean;
}): ConversationStage {
  if (args.bookingId) {
    return 'booked';
  }

  if (!args.isBookingInquiry && !args.conversation.collectedService) {
    return args.existingStage ?? 'greeting';
  }

  if (args.customerDeclinedBooking) {
    return 'qualifying';
  }

  const scheduleComplete = hasCompleteSchedule(args.conversation, {
    requireVehicleFields: args.requireVehicleFields,
  });

  if (!scheduleComplete) {
    return 'qualifying';
  }

  if (!hasCompleteCustomer(args.conversation)) {
    return 'collecting_customer';
  }

  if (isFinalRecapSent(args.conversation.collectedNotes)) {
    return 'ready_to_book';
  }

  return 'collecting_customer';
}

export function mergeConversationState(
  input: MergeConversationInput
): MergedConversationState {
  const { existing, parsed, collectedServiceId } = input;

  const collectedService =
    nonEmpty(parsed.packageName) ?? existing?.collectedService ?? null;
  const collectedVehicle = pickMoreSpecificVehicle(
    existing?.collectedVehicle,
    nonEmpty(parsed.extractedVehicle)
  );
  const collectedVehicleYear =
    nonEmpty(parsed.extractedVehicleYear) ??
    existing?.collectedVehicleYear ??
    null;
  const collectedVehicleMake =
    nonEmpty(parsed.extractedVehicleMake) ??
    existing?.collectedVehicleMake ??
    null;
  const collectedVehicleModel =
    nonEmpty(parsed.extractedVehicleModel) ??
    existing?.collectedVehicleModel ??
    null;
  const collectedDate =
    nonEmpty(parsed.requestedDate) ?? existing?.collectedDate ?? null;
  const collectedNotes = mergePreferredTimeIntoNotes(
    nonEmpty(parsed.extractedNotes) ?? existing?.collectedNotes ?? null,
    parsed.extractedTime
  );

  const merged: Omit<MergedConversationState, 'stage'> = {
    collectedService,
    collectedServiceId:
      collectedServiceId ?? existing?.collectedServiceId ?? null,
    collectedVehicle,
    collectedVehicleYear,
    collectedVehicleMake,
    collectedVehicleModel,
    collectedDate,
    collectedNotes,
    collectedName:
      nonEmpty(parsed.extractedFullName) ?? existing?.collectedName ?? null,
    collectedPhone:
      nonEmpty(parsed.extractedPhone) ?? existing?.collectedPhone ?? null,
    collectedEmail:
      nonEmpty(parsed.extractedEmail) ?? existing?.collectedEmail ?? null,
    collectedStreet:
      nonEmpty(parsed.extractedStreetAddress) ??
      existing?.collectedStreet ??
      null,
    collectedUnit:
      nonEmpty(parsed.extractedUnitApt) ?? existing?.collectedUnit ?? null,
    collectedCity:
      nonEmpty(parsed.extractedCity) ?? existing?.collectedCity ?? null,
    collectedState:
      nonEmpty(parsed.extractedState) ?? existing?.collectedState ?? null,
    collectedZip:
      nonEmpty(parsed.extractedZip) ?? existing?.collectedZip ?? null,
    bookingId: existing?.bookingId ?? null,
  };

  const stage = inferStage({
    bookingId: merged.bookingId,
    isBookingInquiry: parsed.isBookingInquiry,
    conversation: merged,
    existingStage: existing?.stage,
    customerDeclinedBooking: parsed.customerDeclinedBooking,
    requireVehicleFields: input.requireVehicleFields,
  });

  return { ...merged, stage };
}

export async function saveInstagramDmConversation(args: {
  businessId: string;
  instagramSenderId: string;
  state: MergedConversationState;
  lastInboundText: string;
  lastOutboundText: string;
}): Promise<InstagramDmConversation> {
  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const row = {
    business_id: args.businessId,
    instagram_sender_id: args.instagramSenderId,
    stage: args.state.stage,
    collected_service: args.state.collectedService,
    collected_service_id: args.state.collectedServiceId,
    collected_vehicle: args.state.collectedVehicle,
    collected_vehicle_year: args.state.collectedVehicleYear,
    collected_vehicle_make: args.state.collectedVehicleMake,
    collected_vehicle_model: args.state.collectedVehicleModel,
    collected_date: args.state.collectedDate,
    collected_notes: args.state.collectedNotes,
    collected_name: args.state.collectedName,
    collected_phone: args.state.collectedPhone,
    collected_email: args.state.collectedEmail,
    collected_street: args.state.collectedStreet,
    collected_unit: args.state.collectedUnit,
    collected_city: args.state.collectedCity,
    collected_state: args.state.collectedState,
    collected_zip: args.state.collectedZip,
    booking_id: args.state.bookingId,
    last_inbound_text: args.lastInboundText.slice(0, 4000),
    last_outbound_text: args.lastOutboundText.slice(0, 4000),
  };

  const selectCols = `${'id, business_id, instagram_sender_id, stage, collected_service, collected_vehicle, collected_date, collected_notes, last_outbound_text'}, ${EXTENDED_SELECT}, updated_at`;

  const { data, error } = await db
    .from('instagram_dm_conversations')
    .upsert(row, { onConflict: 'business_id,instagram_sender_id' })
    .select(selectCols)
    .single();

  if (error) {
    throw new Error(
      `Failed to save instagram_dm_conversations: ${error.message}`
    );
  }

  return mapRow(data as ConversationRow);
}

export async function resetInstagramDmConversation(
  businessId: string,
  instagramSenderId: string
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { error } = await db
    .from('instagram_dm_conversations')
    .delete()
    .eq('business_id', businessId)
    .eq('instagram_sender_id', instagramSenderId);

  if (error) {
    throw new Error(
      `Failed to reset instagram_dm_conversations: ${error.message}`
    );
  }
}

export function formatConversationStateForPrompt(
  conversation: InstagramDmConversation | null
): string {
  if (!conversation) {
    return 'New conversation — nothing collected yet.';
  }

  const preferredTime = getPreferredTimeFromNotes(conversation.collectedNotes);
  const lines = [
    `stage: ${conversation.stage}`,
    `service: ${conversation.collectedService ?? '(not yet)'}`,
    `vehicle: ${conversation.collectedVehicle ?? '(not yet)'}`,
    `vehicle ymm: ${conversation.collectedVehicleYear ?? '-'} ${conversation.collectedVehicleMake ?? '-'} ${conversation.collectedVehicleModel ?? '-'}`,
    `preferred date: ${conversation.collectedDate ?? '(not yet)'}`,
    `preferred time: ${preferredTime ?? '(not yet)'}`,
    `name: ${conversation.collectedName ?? '(not yet)'}`,
    `phone: ${conversation.collectedPhone ?? '(not yet)'}`,
    `email: ${conversation.collectedEmail ?? '(optional, not yet)'}`,
    `address: ${conversation.collectedStreet ?? '(not yet)'}, ${conversation.collectedCity ?? ''} ${conversation.collectedState ?? ''} ${conversation.collectedZip ?? ''}`,
    `booking_id: ${conversation.bookingId ?? '(not created)'}`,
  ];
  if (conversation.collectedNotes) {
    lines.push(`flags/notes: ${conversation.collectedNotes}`);
  }
  return lines.join('\n');
}

// Re-export for callers that imported from here.
export { getBookingGapsSummary } from '@/services/meta/instagramDmBookingState';
