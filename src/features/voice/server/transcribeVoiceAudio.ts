import { DEEPGRAM_LISTEN_URL, getDeepgramApiKey } from './deepgramConfig';

export type TranscribeVoiceAudioResult =
  | { ok: true; transcript: string }
  | { ok: false; status: 500 | 502; error: string };

function listenContentType(contentType: string): string {
  const t = contentType.trim().toLowerCase();
  if (!t || t === 'application/octet-stream') return 'audio/mp4';
  return t;
}

/** Pull the first alternative from a Deepgram Listen JSON body. */
export function transcriptFromDeepgramListenBody(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const results = (body as { results?: unknown }).results;
  if (!results || typeof results !== 'object') return '';
  const channels = (results as { channels?: unknown }).channels;
  if (
    !Array.isArray(channels) ||
    !channels[0] ||
    typeof channels[0] !== 'object'
  ) {
    return '';
  }
  const alternatives = (channels[0] as { alternatives?: unknown }).alternatives;
  if (
    !Array.isArray(alternatives) ||
    !alternatives[0] ||
    typeof alternatives[0] !== 'object'
  ) {
    return '';
  }
  const transcript = (alternatives[0] as { transcript?: unknown }).transcript;
  return typeof transcript === 'string' ? transcript.trim() : '';
}

/**
 * Pre-recorded Listen (Nova-3). Not the live WebSocket sample.
 * Does not persist the clip.
 */
export async function transcribeVoiceAudio(input: {
  bytes: ArrayBuffer;
  contentType: string;
}): Promise<TranscribeVoiceAudioResult> {
  const apiKey = getDeepgramApiKey();
  if (!apiKey) {
    console.warn('[voice-turn] DEEPGRAM_API_KEY is missing');
    return {
      ok: false,
      status: 500,
      error: 'Voice transcription is not configured',
    };
  }

  const url = new URL(DEEPGRAM_LISTEN_URL);
  url.searchParams.set('model', 'nova-3');
  url.searchParams.set('smart_format', 'true');
  url.searchParams.set('language', 'en');

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': listenContentType(input.contentType),
      },
      body: input.bytes,
    });
  } catch (err) {
    console.warn('[voice-turn] deepgram request failed', {
      error: err instanceof Error ? err.message : 'network error',
    });
    return {
      ok: false,
      status: 502,
      error: 'Could not transcribe audio',
    };
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const errMsg =
      body &&
      typeof body === 'object' &&
      typeof (body as { err_msg?: unknown }).err_msg === 'string'
        ? (body as { err_msg: string }).err_msg
        : `HTTP ${response.status}`;
    console.warn('[voice-turn] deepgram listen failed', {
      status: response.status,
      error: errMsg,
    });
    return {
      ok: false,
      status: 502,
      error: 'Could not transcribe audio',
    };
  }

  return { ok: true, transcript: transcriptFromDeepgramListenBody(body) };
}
