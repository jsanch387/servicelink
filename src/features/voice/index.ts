/**
 * Owner-only AI scheduling voice. Extractable: types + parse live here;
 * the App Router file is a thin adapter. Do not create bookings from this feature.
 */

export type { VoiceDraft, VoiceDraftAddon } from './types/voiceDraft';
export type { VoiceSpeakAudio, VoiceTurnResponse } from './types/voiceTurn';
export {
  EMPTY_VOICE_DRAFT,
  VOICE_TURN_AUDIO_FIELD,
  VOICE_TURN_DRAFT_FIELD,
  emptyVoiceDraft,
} from './constants/voiceTurnEcho';
export { parseVoiceDraft } from './utils/parseVoiceDraft';
export { missingVoiceDraftFields } from './utils/missingVoiceDraftFields';
