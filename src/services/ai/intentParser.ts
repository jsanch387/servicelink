/**
 * Instagram DM → structured booking intent + assistant reply (OpenAI + Zod).
 */

import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

/** Cheapest model that supports structured outputs (Zod) for this flow. */
const INTENT_MODEL = 'gpt-4.1-nano';
/** Cap reply + JSON fields; keeps DM replies short and cost low. */
const INTENT_MAX_OUTPUT_TOKENS = 300;
const CURRENT_YEAR = 2026;

export const ConversationIntentSchema = z.object({
  isBookingInquiry: z
    .boolean()
    .describe(
      'True if the user is asking about booking, pricing, packages, availability, or scheduling. False for spam, casual greetings, or unrelated chat.'
    ),
  packageName: z
    .string()
    .nullable()
    .describe(
      'Matched service/package name from business context when the user asked about one specific service; null for general pricing/menu questions.'
    ),
  requestedDate: z
    .string()
    .nullable()
    .describe(
      `Requested appointment date as YYYY-MM-DD only (calendar year ${CURRENT_YEAR} unless they clearly mean another year), or null if not specified.`
    ),
  extractedTime: z
    .string()
    .nullable()
    .describe(
      'Preferred appointment time from this message only (e.g. "9 am", "2:30 PM"). Null if not mentioned this turn.'
    ),
  extractedVehicle: z
    .string()
    .nullable()
    .describe(
      'Vehicle description mentioned this turn (e.g. 2017 Toyota Tacoma). Null if not mentioned this turn.'
    ),
  extractedVehicleYear: z.string().nullable(),
  extractedVehicleMake: z.string().nullable(),
  extractedVehicleModel: z.string().nullable(),
  extractedFullName: z.string().nullable(),
  extractedPhone: z.string().nullable(),
  extractedEmail: z.string().nullable(),
  extractedStreetAddress: z.string().nullable(),
  extractedUnitApt: z.string().nullable(),
  extractedCity: z.string().nullable(),
  extractedState: z
    .string()
    .nullable()
    .describe('US state 2-letter if mentioned.'),
  extractedZip: z.string().nullable(),
  extractedNotes: z
    .string()
    .nullable()
    .describe(
      'Any extra detail from this message worth remembering (location nuance, add-on interest). Null if none.'
    ),
  customerConfirmedBooking: z
    .boolean()
    .describe(
      'True only if the customer clearly confirms the booking summary (yes, sounds good, confirm, etc.) in this message.'
    ),
  customerDeclinedBooking: z
    .boolean()
    .describe(
      'True if they reject or want to change the summary (no, wrong date, different time, etc.).'
    ),
  conversationStage: z
    .enum([
      'greeting',
      'qualifying',
      'offering',
      'awaiting_confirmation',
      'collecting_customer',
      'ready_to_book',
      'booked',
    ])
    .describe(
      'Thread stage after this turn. qualifying while collecting; awaiting_confirmation when recap sent and waiting for agreement; ready_to_book only after they confirmed.'
    ),
  shouldIncludeBookingLink: z
    .boolean()
    .describe(
      'True when the reply should include the official ServiceLink booking URL from context (general pricing/menu, booking, payments, or sending the website). False for narrow one-service quotes or casual greetings without those topics.'
    ),
  aiReplyText: z
    .string()
    .describe(
      'Friendly Instagram DM reply. Short, human, like a shop owner texting — 1-3 sentences. Helpful answer first, then at most ONE clarifying question. Never reply with only a link. When agentFlowActive / bookingLinkAlreadyShared: you are booking in this chat only — do NOT mention booking online, a booking link, website, or "if you prefer". When shouldIncludeBookingLink is true: do NOT paste the URL (the server appends it); invite them to tell you what they need in chat.'
    ),
});

export type ConversationIntent = z.infer<typeof ConversationIntentSchema>;

export type ConversationalBusinessContext = {
  businessName: string;
  serviceArea: string | null;
  bookingLink: string | null;
  services: Array<{
    name: string;
    description: string | null;
    basePriceCents: number | null;
    durationMinutes: number | null;
    priceOptions: Array<{
      label: string;
      priceCents: number;
      durationMinutes: number;
    }>;
    addOns: Array<{
      name: string;
      priceCents: number;
      durationMinutes: number | null;
    }>;
  }>;
  availability: {
    accept_bookings: boolean;
    minimum_notice: string;
  } | null;
  /** Prior turns for this customer — do not re-ask filled fields. */
  conversationStateSummary: string;
  /** What to collect next (server-computed). */
  bookingGapsSummary: string;
  /** True if we already sent the official booking URL in a prior reply. */
  bookingLinkAlreadyShared: boolean;
  /** True when customer is in the in-chat booking flow (not first menu/link intro). */
  agentFlowActive: boolean;
  /** True after the first customer message in this thread (not a brand-new DM). */
  isOngoingConversation: boolean;
  /** When true, extract vehicle year/make/model for auto/detail businesses. */
  requireVehicleFields: boolean;
};

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

function formatUsdFromCents(cents: number | null): string {
  if (cents == null) return 'Contact for pricing';
  return `$${(cents / 100).toFixed(2)}`;
}

function compactServiceContext(
  context: ConversationalBusinessContext | null | undefined
): string {
  if (!context || context.services.length === 0) {
    return 'No service catalog data available.';
  }

  return context.services
    .slice(0, 12)
    .map(service => {
      const base = `- ${service.name} | base ${formatUsdFromCents(service.basePriceCents)} | duration ${
        service.durationMinutes != null
          ? `${service.durationMinutes}m`
          : 'unspecified'
      }`;
      const options =
        service.priceOptions.length > 0
          ? `\n  options: ${service.priceOptions
              .slice(0, 6)
              .map(
                option =>
                  `${option.label} (${formatUsdFromCents(option.priceCents)}, ${option.durationMinutes}m)`
              )
              .join(', ')}`
          : '';
      const addOns =
        service.addOns.length > 0
          ? `\n  add-ons: ${service.addOns
              .slice(0, 8)
              .map(
                addOn =>
                  `${addOn.name} (${formatUsdFromCents(addOn.priceCents)}${
                    addOn.durationMinutes != null
                      ? `, +${addOn.durationMinutes}m`
                      : ''
                  })`
              )
              .join(', ')}`
          : '';
      return `${base}${options}${addOns}`;
    })
    .join('\n');
}

function bookingModeLine(
  context: ConversationalBusinessContext | null | undefined
): string {
  const accepts = context?.availability?.accept_bookings ?? true;
  if (accepts) {
    return 'Customers can pick a time and book online at the official link (instant booking).';
  }
  return 'Online booking requests only (not instant calendar booking) — use "request a time" wording, not "book instantly".';
}

function buildAssistantSystemPrompt(
  context?: ConversationalBusinessContext
): string {
  const today = new Date().toISOString().slice(0, 10);
  const businessName =
    context?.businessName?.trim() || 'this detailing business';
  const serviceArea = context?.serviceArea?.trim() || 'their local area';
  const bookingLink = context?.bookingLink?.trim() || null;

  const linkRules = bookingLink
    ? context?.bookingLinkAlreadyShared || context?.agentFlowActive
      ? [
          `Official ServiceLink booking URL (for reference only — do NOT paste in this reply): ${bookingLink}`,
          'bookingLinkAlreadyShared or agentFlowActive is true: the customer already saw the link or is telling you what they need.',
          'Set shouldIncludeBookingLink to false. Do NOT include the URL in aiReplyText.',
          'You are now the in-chat booking assistant: confirm service/vehicle, ask for the next missing detail (usually preferred day/time), be warm and specific.',
          'Never mention booking online, "our booking link", website, or "if you prefer" — they are already booking with you here.',
          'Follow bookingGapsSummary. Talk like a receptionist taking an order (pizza shop style) — casual sentences, not form fields. Extract every detail they give in one message (address, name, phone, vehicle, day, time). Never use bullet lists or "reply YES".',
          'Price questions mid-booking: answer with the matched package price from context, then continue collecting the next missing detail — do not restart with a menu or link.',
          'Never invent prices; use catalog context for the service they mentioned.',
        ]
      : [
          `Official ServiceLink booking URL (server appends when shouldIncludeBookingLink is true): ${bookingLink}`,
          'Do NOT paste the URL in aiReplyText — the system adds it. Never write placeholders like "here: .".',
          'First-touch / general pricing: briefly explain packages vary, and invite them to tell you what they need so you can help get them scheduled in chat.',
          'Set shouldIncludeBookingLink true only for broad menu/pricing/payment questions on the first exchange — not when they already said what service/vehicle they want.',
          'Do NOT list every service — say prices vary by service/vehicle and that you can help in chat.',
        ]
    : [
        'No official booking link is configured for this business. Do not invent URLs. Offer to help in chat and collect vehicle/service/date details.',
      ];

  return [
    `You are the friendly Instagram booking assistant for ${businessName}, a mobile auto detailing business.`,
    `Write naturally like a human shop owner/secretary texting a customer in ${serviceArea}. Keep it warm, short, and conversational.`,
    context?.isOngoingConversation
      ? 'This is mid-conversation — do NOT start with Hi, Hey, or Hello. Continue the thread naturally.'
      : 'First reply in thread — a brief thanks is fine, but stay concise.',
    'This is a mobile detailing business — we come to the customer. Never say "drop off" or imply they bring the vehicle to a shop.',
    context?.requireVehicleFields
      ? 'For vehicle: extract year, make, model when the customer mentions them.'
      : 'Vehicle can be a short description (truck, SUV).',
    'Extract address fields when they give a location. Parse US addresses into street, city, state, zip when possible.',
    `Today's reference date is ${today}. Resolve relative dates ("next Friday", "March 2") to YYYY-MM-DD using calendar year ${CURRENT_YEAR} unless they clearly mean another year.`,
    'requestedDate must be strictly YYYY-MM-DD or null — never free text.',
    'packageName: match a specific service from context when they asked about one package; null for broad pricing questions.',
    'aiReplyText: no markdown; 1-3 short sentences like texting. Combine questions when natural ("what day and time works?"). Never label fields ("Street address:", "ZIP:").',
    'Use ONLY the business context below for service names/pricing. Never invent prices, packages, or durations.',
    bookingModeLine(context),
    ...linkRules,
    'If the message is only a greeting, reply warmly and invite them to share what they need (no link unless they ask).',
    'Conversation memory: do NOT re-ask for fields already collected below.',
    '',
    'Next action for this reply:',
    context?.bookingGapsSummary?.trim() ||
      'Figure out what they need and respond naturally.',
    '',
    'Already collected for this customer:',
    context?.conversationStateSummary?.trim() ||
      'New conversation — nothing collected yet.',
    '',
    'Business catalog context:',
    compactServiceContext(context),
    '',
    'Availability context:',
    context?.availability
      ? `accept_bookings: ${context.availability.accept_bookings} | minimum_notice: ${context.availability.minimum_notice}`
      : 'not configured',
  ].join('\n');
}

function emptyMessageFallback(
  context?: ConversationalBusinessContext
): ConversationIntent {
  const link = context?.bookingLink?.trim();
  const aiReplyText = link
    ? `Hey! Thanks for reaching out — happy to help. Tell me what you're looking for (service, vehicle, or day) and I can help get you scheduled. You can also browse and book here: ${link}`
    : "Hey! Thanks for reaching out. Tell me what you're looking for and we'll help get you scheduled.";

  return {
    isBookingInquiry: false,
    packageName: null,
    requestedDate: null,
    extractedTime: null,
    extractedVehicle: null,
    extractedVehicleYear: null,
    extractedVehicleMake: null,
    extractedVehicleModel: null,
    extractedFullName: null,
    extractedPhone: null,
    extractedEmail: null,
    extractedStreetAddress: null,
    extractedUnitApt: null,
    extractedCity: null,
    extractedState: null,
    extractedZip: null,
    extractedNotes: null,
    customerConfirmedBooking: false,
    customerDeclinedBooking: false,
    conversationStage: 'greeting',
    shouldIncludeBookingLink: Boolean(link),
    aiReplyText,
  };
}

/**
 * Parses an incoming DM and returns structured booking fields plus a customer-ready reply.
 */
export async function parseAndFormulateResponse(
  messageText: string,
  context?: ConversationalBusinessContext
): Promise<ConversationIntent> {
  const trimmed = messageText.trim();
  if (!trimmed) {
    return emptyMessageFallback(context);
  }

  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.parse({
    model: INTENT_MODEL,
    max_tokens: INTENT_MAX_OUTPUT_TOKENS,
    messages: [
      { role: 'system', content: buildAssistantSystemPrompt(context) },
      { role: 'user', content: trimmed },
    ],
    response_format: zodResponseFormat(
      ConversationIntentSchema,
      'conversation_intent'
    ),
  });

  const parsed = completion.choices[0]?.message?.parsed;
  if (!parsed) {
    const refusal = completion.choices[0]?.message?.refusal;
    throw new Error(
      refusal
        ? `OpenAI refused to parse intent: ${refusal}`
        : 'OpenAI returned no parsed conversation intent'
    );
  }

  return parsed;
}
