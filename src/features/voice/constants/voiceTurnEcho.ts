import type { VoiceDraft } from '../types/voiceDraft';
import type { VoiceSpeakAudio, VoiceTurnResponse } from '../types/voiceTurn';

export const VOICE_TURN_AUDIO_FIELD = 'audio';
export const VOICE_TURN_DRAFT_FIELD = 'draft';

/** Generous cap for a short voice clip. Reject before we hold the bytes. */
export const VOICE_TURN_MAX_AUDIO_BYTES = 15 * 1024 * 1024;

export const EMPTY_VOICE_DRAFT: VoiceDraft = {
  customer: '',
  phone: '',
  service: '',
  pricing: '',
  addons: [],
  vehicleYear: '',
  vehicleMake: '',
  vehicleModel: '',
  address: '',
  date: '',
  time: '',
};

export function emptyVoiceDraft(): VoiceDraft {
  return {
    ...EMPTY_VOICE_DRAFT,
    addons: [],
  };
}

export function buildVoiceTurnResponse(input: {
  transcript: string;
  draft: VoiceDraft;
  missing: string[];
  ask: string;
  speak: string;
  speakAudio: VoiceSpeakAudio | null;
  ready: boolean;
}): VoiceTurnResponse {
  return {
    transcript: input.transcript,
    draft: input.draft,
    missing: input.missing,
    ask: input.ask,
    speak: input.speak,
    speakAudio: input.speakAudio,
    ready: input.ready,
  };
}
