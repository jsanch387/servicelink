import {
  DEEPGRAM_SPEAK_MIME_TYPE,
  DEEPGRAM_SPEAK_MODEL,
  DEEPGRAM_SPEAK_URL,
  getDeepgramApiKey,
} from './deepgramConfig';

export type SpeakVoiceTextResult =
  | {
      ok: true;
      mimeType: string;
      base64: string;
      byteLength: number;
    }
  | { ok: false; error: string };

/**
 * Pre-recorded Speak (Aura-2). Not a live TTS socket.
 * Does not persist the clip. Failures are soft — caller can still return text.
 */
export async function speakVoiceText(
  text: string
): Promise<SpeakVoiceTextResult> {
  const spoken = text.trim();
  if (!spoken) {
    return { ok: false, error: 'speak text is empty' };
  }

  const apiKey = getDeepgramApiKey();
  if (!apiKey) {
    console.warn('[voice-turn] DEEPGRAM_API_KEY is missing');
    return { ok: false, error: 'Voice speech is not configured' };
  }

  const url = new URL(DEEPGRAM_SPEAK_URL);
  url.searchParams.set('model', DEEPGRAM_SPEAK_MODEL);
  url.searchParams.set('encoding', 'mp3');

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: spoken }),
    });
  } catch (err) {
    console.warn('[voice-turn] deepgram speak request failed', {
      error: err instanceof Error ? err.message : 'network error',
    });
    return { ok: false, error: 'Could not synthesize speech' };
  }

  if (!response.ok) {
    let errMsg = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { err_msg?: unknown };
      if (typeof body.err_msg === 'string') errMsg = body.err_msg;
    } catch {
      // body was audio or empty
    }
    console.warn('[voice-turn] deepgram speak failed', {
      status: response.status,
      error: errMsg,
    });
    return { ok: false, error: 'Could not synthesize speech' };
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength === 0) {
    return { ok: false, error: 'Could not synthesize speech' };
  }

  return {
    ok: true,
    mimeType: DEEPGRAM_SPEAK_MIME_TYPE,
    base64: bytes.toString('base64'),
    byteLength: bytes.byteLength,
  };
}
