export const DEEPGRAM_LISTEN_URL = 'https://api.deepgram.com/v1/listen';
export const DEEPGRAM_SPEAK_URL = 'https://api.deepgram.com/v1/speak';

/** Clear, conversational Aura-2 voice. Same account as Listen. */
export const DEEPGRAM_SPEAK_MODEL = 'aura-2-thalia-en';
export const DEEPGRAM_SPEAK_MIME_TYPE = 'audio/mpeg';

export function getDeepgramApiKey(): string | null {
  return process.env.DEEPGRAM_API_KEY?.trim() || null;
}
