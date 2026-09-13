import { createOpenAI } from '@ai-sdk/openai';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { VOICE_FROZEN_CATALOG_PROMPT } from '../constants/frozenCatalog';
import type { VoiceDraft } from '../types/voiceDraft';
import { emptyVoiceDraft } from '../constants/voiceTurnEcho';
import { mergeVoiceDraft } from '../utils/mergeVoiceDraft';
import {
  missingVoiceDraftFields,
  voiceDraftProgressed,
  voiceTurnAskAndSpeak,
  voiceTurnReady,
} from '../utils/missingVoiceDraftFields';
import { parseVoiceDraft } from '../utils/parseVoiceDraft';

export const VOICE_PARSE_MODEL = 'gpt-4o-mini';

const extractedDraftSchema = z.object({
  customer: z.string(),
  phone: z.string(),
  service: z.string(),
  pricing: z.string(),
  addons: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      priceLabel: z.string(),
    })
  ),
  vehicleYear: z.string(),
  vehicleMake: z.string(),
  vehicleModel: z.string(),
  address: z.string(),
  date: z.string(),
  time: z.string(),
});

export type VoiceTurnParse = {
  draft: VoiceDraft;
  missing: string[];
  ask: string;
  speak: string;
  ready: boolean;
};

function getOpenAiApiKey(): string | null {
  return process.env.OPENAI_API_KEY?.trim() || null;
}

function assembleParse(
  current: VoiceDraft,
  incoming: VoiceDraft,
  transcript: string
): VoiceTurnParse {
  const draft = mergeVoiceDraft(current, incoming, transcript);
  const next = voiceTurnAskAndSpeak(draft, {
    progressed: voiceDraftProgressed(current, draft),
  });

  return {
    draft,
    missing: missingVoiceDraftFields(draft),
    ask: next.ask,
    speak: next.speak,
    ready: voiceTurnReady(draft),
  };
}

/**
 * Merge transcript into the draft. Server owns missing + ready.
 * Does not create a booking.
 */
export async function parseVoiceTurn(input: {
  transcript: string;
  draft: VoiceDraft;
}): Promise<VoiceTurnParse> {
  if (!input.transcript.trim()) {
    const draft = mergeVoiceDraft(input.draft, emptyVoiceDraft(), '');
    const next = voiceTurnAskAndSpeak(draft, { misheard: true });
    console.warn('[voice-turn] empty transcript');
    return {
      draft,
      missing: missingVoiceDraftFields(draft),
      ask: next.ask,
      speak: next.speak,
      ready: voiceTurnReady(draft),
    };
  }

  const fallback = assembleParse(
    input.draft,
    emptyVoiceDraft(),
    input.transcript
  );

  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    console.warn('[voice-turn] OPENAI_API_KEY is missing');
    return fallback;
  }

  try {
    const openai = createOpenAI({ apiKey });
    const result = await generateText({
      model: openai(VOICE_PARSE_MODEL),
      output: Output.object({ schema: extractedDraftSchema }),
      system: [
        'You help a business owner fill an appointment draft from a short voice transcript.',
        'They are booking on behalf of a customer. Do not create a booking.',
        VOICE_FROZEN_CATALOG_PROMPT,
        'Return only fields you heard or can safely infer. Use "" when unknown.',
        'Do not clear fields that are already in the current draft unless the owner corrects them.',
        'date: YYYY-MM-DD when you can resolve it from today. time: like 10:00 or 10:00 AM.',
        'phone: digits only if possible.',
        'Do not invent add-ons they did not say.',
      ].join(' '),
      prompt: [
        `Today: ${new Date().toISOString().slice(0, 10)}`,
        `Transcript: ${input.transcript.trim() || '(empty)'}`,
        `Current draft JSON: ${JSON.stringify(input.draft)}`,
      ].join('\n'),
    });

    const output = result.output;
    if (!output) return fallback;

    return assembleParse(
      input.draft,
      parseVoiceDraft(output),
      input.transcript
    );
  } catch (err) {
    console.warn('[voice-turn] parse failed', {
      error: err instanceof Error ? err.message : 'unknown',
    });
    return fallback;
  }
}
