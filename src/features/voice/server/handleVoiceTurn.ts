import type { NextRequest, NextResponse } from 'next/server';
import { buildVoiceTurnResponse } from '../constants/voiceTurnEcho';
import { readVoiceTurnForm } from '../utils/readVoiceTurnForm';
import { DEEPGRAM_SPEAK_MODEL } from './deepgramConfig';
import { parseVoiceTurn } from './parseVoiceTurn';
import { requireVoiceOwner } from './requireVoiceOwner';
import { speakVoiceText } from './speakVoiceText';
import { transcribeVoiceAudio } from './transcribeVoiceAudio';
import { voiceError, voiceOk } from './voiceJson';

/**
 * Owner voice turn — Listen → parse → Speak.
 * Does not persist or create a booking.
 */
export async function handleVoiceTurn(
  request: NextRequest | Request
): Promise<NextResponse> {
  const owner = await requireVoiceOwner(request);
  if (!owner.ok) return owner.response;

  const form = await readVoiceTurnForm(request);
  if (!form.ok) {
    console.warn('[voice-turn] bad form', {
      status: form.status,
      error: form.error,
    });
    return voiceError(form.status, form.error);
  }

  console.info('[voice-turn] received from mobile', {
    auth: owner.authMethod,
    businessId: owner.businessId,
    audioName: form.audioName || '(no name)',
    audioType: form.audioType || '(no type)',
    audioBytes: form.audio.size,
    draftRaw: form.draftRaw,
    draft: form.draft,
  });

  let stt;
  try {
    stt = await transcribeVoiceAudio({
      bytes: await form.audio.arrayBuffer(),
      contentType: form.audioType,
    });
  } catch (err) {
    console.warn('[voice-turn] transcribe threw', {
      error: err instanceof Error ? err.message : 'unknown',
    });
    return voiceError(502, 'Could not transcribe audio');
  }
  if (!stt.ok) {
    return voiceError(stt.status, stt.error);
  }

  console.info('[voice-turn] transcript', { transcript: stt.transcript });

  const parsed = await parseVoiceTurn({
    transcript: stt.transcript,
    draft: form.draft,
  });

  console.info('[voice-turn] parse', {
    ready: parsed.ready,
    missing: parsed.missing,
    ask: parsed.ask,
    draft: parsed.draft,
  });

  let speakAudio = null;
  try {
    const spoken = await speakVoiceText(parsed.speak);
    if (spoken.ok) {
      speakAudio = { mimeType: spoken.mimeType, base64: spoken.base64 };
      console.info('[voice-turn] speak', {
        model: DEEPGRAM_SPEAK_MODEL,
        bytes: spoken.byteLength,
      });
    } else {
      console.warn('[voice-turn] speak skipped', { error: spoken.error });
    }
  } catch (err) {
    console.warn('[voice-turn] speak threw', {
      error: err instanceof Error ? err.message : 'unknown',
    });
  }

  return voiceOk(
    buildVoiceTurnResponse({
      transcript: stt.transcript,
      draft: parsed.draft,
      missing: parsed.missing,
      ask: parsed.ask,
      speak: parsed.speak,
      speakAudio,
      ready: parsed.ready,
    })
  );
}
