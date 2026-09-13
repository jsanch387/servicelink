import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  transcriptFromDeepgramListenBody,
  transcribeVoiceAudio,
} from '../server/transcribeVoiceAudio';

describe('transcriptFromDeepgramListenBody', () => {
  it('reads the first alternative transcript', () => {
    expect(
      transcriptFromDeepgramListenBody({
        results: {
          channels: [{ alternatives: [{ transcript: '  book Jane  ' }] }],
        },
      })
    ).toBe('book Jane');
  });

  it('returns empty for missing or invalid payloads', () => {
    expect(transcriptFromDeepgramListenBody(null)).toBe('');
    expect(transcriptFromDeepgramListenBody({})).toBe('');
    expect(
      transcriptFromDeepgramListenBody({ results: { channels: [] } })
    ).toBe('');
  });
});

describe('transcribeVoiceAudio', () => {
  const originalKey = process.env.DEEPGRAM_API_KEY;

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalKey === undefined) {
      delete process.env.DEEPGRAM_API_KEY;
    } else {
      process.env.DEEPGRAM_API_KEY = originalKey;
    }
  });

  it('returns 500 when the API key is missing', async () => {
    delete process.env.DEEPGRAM_API_KEY;
    const result = await transcribeVoiceAudio({
      bytes: new ArrayBuffer(8),
      contentType: 'audio/x-m4a',
    });
    expect(result).toEqual({
      ok: false,
      status: 500,
      error: 'Voice transcription is not configured',
    });
  });

  it('posts the clip to Deepgram Listen and returns the transcript', async () => {
    process.env.DEEPGRAM_API_KEY = 'test-key';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: {
          channels: [
            { alternatives: [{ transcript: 'full detail Saturday' }] },
          ],
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const bytes = new Uint8Array([1, 2, 3]).buffer;
    const result = await transcribeVoiceAudio({
      bytes,
      contentType: 'audio/x-m4a',
    });

    expect(result).toEqual({
      ok: true,
      transcript: 'full detail Saturday',
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(String(url)).toContain('https://api.deepgram.com/v1/listen');
    expect(String(url)).toContain('model=nova-3');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      Authorization: 'Token test-key',
      'Content-Type': 'audio/x-m4a',
    });
    expect(init.body).toBe(bytes);
  });

  it('returns 502 when Deepgram responds with an error', async () => {
    process.env.DEEPGRAM_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ err_msg: 'Bad Request: failed to process audio' }),
      })
    );

    const result = await transcribeVoiceAudio({
      bytes: new ArrayBuffer(8),
      contentType: 'audio/mp4',
    });
    expect(result).toEqual({
      ok: false,
      status: 502,
      error: 'Could not transcribe audio',
    });
  });
});
