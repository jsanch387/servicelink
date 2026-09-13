import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEEPGRAM_SPEAK_MODEL } from '../server/deepgramConfig';
import { speakVoiceText } from '../server/speakVoiceText';

describe('speakVoiceText', () => {
  const originalKey = process.env.DEEPGRAM_API_KEY;

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalKey === undefined) {
      delete process.env.DEEPGRAM_API_KEY;
    } else {
      process.env.DEEPGRAM_API_KEY = originalKey;
    }
  });

  it('returns an error when the API key is missing', async () => {
    delete process.env.DEEPGRAM_API_KEY;
    const result = await speakVoiceText('Got the audio. AI comes next.');
    expect(result.ok).toBe(false);
  });

  it('posts text to Deepgram Speak and returns base64 audio', async () => {
    process.env.DEEPGRAM_API_KEY = 'test-key';
    const audio = new Uint8Array([1, 2, 3, 4]);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => audio.buffer,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await speakVoiceText('Got the audio. AI comes next.');

    expect(result).toEqual({
      ok: true,
      mimeType: 'audio/mpeg',
      base64: Buffer.from(audio).toString('base64'),
      byteLength: 4,
    });
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(String(url)).toContain('https://api.deepgram.com/v1/speak');
    expect(String(url)).toContain(`model=${DEEPGRAM_SPEAK_MODEL}`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(
      JSON.stringify({ text: 'Got the audio. AI comes next.' })
    );
  });
});
