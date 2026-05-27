/**
 * Background pipeline: DM text → OpenAI intent + reply → Meta outbound DM.
 */

import { isVehicleRelatedBusinessType } from '@/constants/businessTypes';
import { parseAndFormulateResponse } from '@/services/ai/intentParser';
import { ensureBookingLinkInReply } from '@/services/meta/ensureBookingLinkInReply';
import {
  buildConversationalFollowUpReply,
  buildFinalRecapReply,
  buildReceptionistDetailsAskReply,
  isAffirmativeConfirmation,
} from '@/services/meta/instagramDmBookingConfirmation';
import {
  hasCompleteCustomer,
  hasCompleteSchedule,
  isDetailsAskSent,
  isFinalRecapSent,
  isReadyToCreateBooking,
  markDetailsAskSentInNotes,
  markFinalRecapSentInNotes,
} from '@/services/meta/instagramDmBookingState';
import { createInstagramDmBooking } from '@/services/meta/createInstagramDmBooking';
import {
  inferBookingLinkAlreadyShared,
  resolveShouldIncludeBookingLink,
  stripBookingLinkFromReply,
} from '@/services/meta/resolveShouldIncludeBookingLink';
import { resolveInstagramServiceMatch } from '@/services/meta/resolveInstagramServiceMatch';
import {
  stripBrokenLinkPlaceholders,
  stripMidConversationGreeting,
  stripOnlineBookingAlternatives,
} from '@/services/meta/sanitizeInstagramDmReply';
import {
  formatConversationStateForPrompt,
  getBookingGapsSummary,
  loadInstagramDmConversation,
  mergeConversationState,
  resetInstagramDmConversation,
  saveInstagramDmConversation,
  type InstagramDmConversation,
  type MergedConversationState,
} from '@/services/meta/instagramDmConversation';
import {
  getConversationResetReason,
  shouldResetInstagramConversation,
} from '@/services/meta/instagramDmConversationReset';
import { loadInstagramBusinessContext } from '@/services/meta/loadInstagramBusinessContext';
import { sendInstagramDM } from '@/services/meta/messenger';

function asConversation(
  merged: MergedConversationState,
  existing: InstagramDmConversation | null,
  ids: { businessId: string; instagramSenderId: string }
): InstagramDmConversation {
  return {
    id: existing?.id ?? '',
    businessId: ids.businessId,
    instagramSenderId: ids.instagramSenderId,
    stage: merged.stage,
    collectedService: merged.collectedService,
    collectedServiceId: merged.collectedServiceId,
    collectedVehicle: merged.collectedVehicle,
    collectedVehicleYear: merged.collectedVehicleYear,
    collectedVehicleMake: merged.collectedVehicleMake,
    collectedVehicleModel: merged.collectedVehicleModel,
    collectedDate: merged.collectedDate,
    collectedNotes: merged.collectedNotes,
    collectedName: merged.collectedName,
    collectedPhone: merged.collectedPhone,
    collectedEmail: merged.collectedEmail,
    collectedStreet: merged.collectedStreet,
    collectedUnit: merged.collectedUnit,
    collectedCity: merged.collectedCity,
    collectedState: merged.collectedState,
    collectedZip: merged.collectedZip,
    bookingId: merged.bookingId,
    lastOutboundText: existing?.lastOutboundText ?? null,
    lastActivityAt: existing?.lastActivityAt ?? null,
  };
}

export type ProcessInstagramIncomingDmOptions = {
  pageAccessToken?: string | null;
};

export async function processInstagramIncomingDm(
  businessId: string,
  senderId: string,
  messageText: string,
  options?: ProcessInstagramIncomingDmOptions
): Promise<void> {
  const [businessContext, loadedConversation] = await Promise.all([
    loadInstagramBusinessContext(businessId),
    loadInstagramDmConversation(businessId, senderId),
  ]);

  let existingConversation = loadedConversation;
  const resetReason = getConversationResetReason(
    existingConversation,
    messageText,
    { lastActivityAt: existingConversation?.lastActivityAt ?? null }
  );

  if (
    shouldResetInstagramConversation(existingConversation, messageText, {
      lastActivityAt: existingConversation?.lastActivityAt ?? null,
    })
  ) {
    console.log(
      `🔄 [conversation] Reset stale thread | reason=${resetReason} sender=${senderId}`
    );
    await resetInstagramDmConversation(businessId, senderId);
    existingConversation = null;
  }

  const requireVehicleFields = isVehicleRelatedBusinessType(
    businessContext.businessType
  );
  const acceptBookings = businessContext.availability?.accept_bookings ?? true;

  const conversationStateSummary =
    formatConversationStateForPrompt(existingConversation);
  const bookingGapsSummary = getBookingGapsSummary(existingConversation, {
    requireVehicleFields,
  });
  const isOngoingConversation = Boolean(existingConversation?.lastOutboundText);

  const bookingLink = businessContext.bookingLink;
  const bookingLinkAlreadyShared = inferBookingLinkAlreadyShared(
    existingConversation,
    bookingLink
  );
  const agentFlowActive = Boolean(
    existingConversation &&
      (bookingLinkAlreadyShared ||
        existingConversation.collectedService ||
        existingConversation.collectedVehicle ||
        existingConversation.collectedDate ||
        existingConversation.bookingId ||
        existingConversation.stage === 'collecting_customer' ||
        existingConversation.stage === 'ready_to_book')
  );

  const parsed = await parseAndFormulateResponse(messageText, {
    businessName: businessContext.businessName,
    serviceArea: businessContext.serviceArea,
    bookingLink,
    services: businessContext.services,
    availability: businessContext.availability
      ? {
          accept_bookings: acceptBookings,
          minimum_notice: businessContext.availability.minimum_notice,
        }
      : null,
    conversationStateSummary,
    bookingGapsSummary,
    bookingLinkAlreadyShared,
    agentFlowActive,
    isOngoingConversation,
    requireVehicleFields,
  });

  const serviceMatch = resolveInstagramServiceMatch(
    businessContext,
    parsed.packageName ?? existingConversation?.collectedService
  );

  const customerConfirmed =
    parsed.customerConfirmedBooking || isAffirmativeConfirmation(messageText);

  let mergedState = mergeConversationState({
    existing: existingConversation,
    parsed: {
      ...parsed,
      customerConfirmedBooking: customerConfirmed,
    },
    collectedServiceId: serviceMatch?.serviceId ?? null,
    requireVehicleFields,
  });

  const threadIds = { businessId, instagramSenderId: senderId };
  let conversation = asConversation(
    mergedState,
    existingConversation,
    threadIds
  );

  const shouldIncludeLink = resolveShouldIncludeBookingLink({
    bookingLink,
    existing: existingConversation,
    lastOutboundText: existingConversation?.lastOutboundText ?? null,
    messageText,
    parsed,
  });

  let replyText: string;

  if (conversation.bookingId) {
    replyText = `You're already on the schedule from this chat — message us if anything needs to change, or say "new appointment" to start fresh.`;
  } else if (
    isReadyToCreateBooking(conversation, { requireVehicleFields }) &&
    isFinalRecapSent(conversation.collectedNotes) &&
    customerConfirmed
  ) {
    const businessSlug = businessContext.businessSlug?.trim() || 'book';
    const result = await createInstagramDmBooking({
      businessContext,
      businessSlug,
      conversation,
      requireVehicleFields,
    });
    replyText = result.customerFacingMessage;
    if (result.ok) {
      mergedState = {
        ...mergedState,
        bookingId: result.bookingId,
        stage: 'booked',
      };
      conversation = asConversation(
        mergedState,
        existingConversation,
        threadIds
      );
    }
  } else if (
    isReadyToCreateBooking(conversation, { requireVehicleFields }) &&
    !isFinalRecapSent(conversation.collectedNotes)
  ) {
    replyText = buildFinalRecapReply(businessContext, conversation);
    mergedState.collectedNotes = markFinalRecapSentInNotes(
      mergedState.collectedNotes
    );
    mergedState.stage = 'ready_to_book';
    conversation = asConversation(mergedState, existingConversation, threadIds);
  } else if (
    hasCompleteSchedule(conversation, { requireVehicleFields }) &&
    !hasCompleteCustomer(conversation) &&
    !isDetailsAskSent(conversation.collectedNotes)
  ) {
    replyText = buildReceptionistDetailsAskReply(businessContext, conversation);
    mergedState.collectedNotes = markDetailsAskSentInNotes(
      mergedState.collectedNotes
    );
    mergedState.stage = 'collecting_customer';
    conversation = asConversation(mergedState, existingConversation, threadIds);
  } else if (
    hasCompleteSchedule(conversation, { requireVehicleFields }) &&
    !hasCompleteCustomer(conversation) &&
    isDetailsAskSent(conversation.collectedNotes)
  ) {
    const followUp = buildConversationalFollowUpReply(conversation);
    if (followUp) {
      replyText = followUp;
    } else {
      replyText = stripBrokenLinkPlaceholders(parsed.aiReplyText);
      replyText = stripBookingLinkFromReply(replyText, bookingLink);
      replyText = stripOnlineBookingAlternatives(replyText);
      if (isOngoingConversation) {
        replyText = stripMidConversationGreeting(replyText);
      }
      replyText = ensureBookingLinkInReply(replyText, bookingLink, {
        shouldInclude: shouldIncludeLink,
        acceptBookings,
      });
    }
    mergedState.stage = 'collecting_customer';
  } else {
    replyText = stripBrokenLinkPlaceholders(parsed.aiReplyText);
    replyText = stripBookingLinkFromReply(replyText, bookingLink);
    if (!shouldIncludeLink) {
      replyText = stripOnlineBookingAlternatives(replyText);
    }
    if (isOngoingConversation) {
      replyText = stripMidConversationGreeting(replyText);
    }
    replyText = ensureBookingLinkInReply(replyText, bookingLink, {
      shouldInclude: shouldIncludeLink,
      acceptBookings,
    });
  }

  const savedConversation = await saveInstagramDmConversation({
    businessId,
    instagramSenderId: senderId,
    state: mergedState,
    lastInboundText: messageText,
    lastOutboundText: replyText,
  });

  console.log('🧠 [AI EXTRACTED INTENT]:', {
    businessId,
    businessName: businessContext.businessName,
    conversationStage: savedConversation.stage,
    collected: {
      service: savedConversation.collectedService,
      vehicle: savedConversation.collectedVehicle,
      date: savedConversation.collectedDate,
      name: savedConversation.collectedName,
      phone: savedConversation.collectedPhone,
      street: savedConversation.collectedStreet,
    },
    bookingId: savedConversation.bookingId,
    shouldIncludeBookingLink: shouldIncludeLink,
    aiReplyText: replyText,
  });

  const sendResult = await sendInstagramDM(senderId, replyText, {
    pageAccessToken: options?.pageAccessToken,
  });

  console.log(
    `📤 [DM SENT] To ID: ${senderId} | Reply: "${replyText}"`,
    sendResult.metaResponse
  );
}
