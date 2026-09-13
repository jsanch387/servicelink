import type { AuthenticatedRequestError } from '@/libs/api/getAuthenticatedUser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_VOICE_DRAFT } from '../constants/voiceTurnEcho';
import { handleVoiceTurn } from '../server/handleVoiceTurn';

const {
  getAuthenticatedUserMock,
  resolveCurrentBusinessIdMock,
  transcribeVoiceAudioMock,
  speakVoiceTextMock,
  parseVoiceTurnMock,
} = vi.hoisted(() => ({
  getAuthenticatedUserMock: vi.fn(),
  resolveCurrentBusinessIdMock: vi.fn(),
  transcribeVoiceAudioMock: vi.fn(),
  speakVoiceTextMock: vi.fn(),
  parseVoiceTurnMock: vi.fn(),
}));

vi.mock('@/libs/api/getAuthenticatedUser', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}));

vi.mock('@/server/resolveCurrentBusinessId', () => ({
  resolveCurrentBusinessId: resolveCurrentBusinessIdMock,
}));

vi.mock('../server/transcribeVoiceAudio', () => ({
  transcribeVoiceAudio: transcribeVoiceAudioMock,
}));

vi.mock('../server/speakVoiceText', () => ({
  speakVoiceText: speakVoiceTextMock,
}));

vi.mock('../server/parseVoiceTurn', () => ({
  parseVoiceTurn: parseVoiceTurnMock,
}));

function dummyAudio(name = 'clip.m4a') {
  return new File(['dummy-audio'], name, { type: 'audio/mp4' });
}

/** NextRequest + File hangs in Vitest; stub formData like a real multipart parse. */
function makeTurnRequest(opts?: {
  draft?: string;
  audio?: File | null;
  omitAudio?: boolean;
}): Request {
  const form = new FormData();
  if (!opts?.omitAudio && opts?.audio !== null) {
    form.append('audio', opts?.audio ?? dummyAudio());
  }
  if (opts?.draft !== undefined) {
    form.append('draft', opts.draft);
  }
  return {
    headers: new Headers(),
    formData: async () => form,
  } as Request;
}

describe('handleVoiceTurn', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when the session is missing or invalid', async () => {
    const authError: AuthenticatedRequestError = {
      status: 401,
      code: 'UNAUTHORIZED',
      error: 'Invalid or expired session',
    };
    getAuthenticatedUserMock.mockResolvedValue(authError);

    const res = await handleVoiceTurn(makeTurnRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({
      success: false,
      error: 'Invalid or expired session',
    });
    expect(resolveCurrentBusinessIdMock).not.toHaveBeenCalled();
    expect(transcribeVoiceAudioMock).not.toHaveBeenCalled();
  });

  it('returns 403 when the user is signed in but not an owner', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      authMethod: 'bearer',
      user: { id: 'user-1' },
      supabase: {},
    });
    resolveCurrentBusinessIdMock.mockResolvedValue({
      ok: false,
      status: 404,
      error: 'Business profile not found',
    });

    const res = await handleVoiceTurn(makeTurnRequest());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toEqual({ success: false, error: 'Forbidden' });
    expect(transcribeVoiceAudioMock).not.toHaveBeenCalled();
  });

  it('returns 400 when audio is missing', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      authMethod: 'bearer',
      user: { id: 'user-1' },
      supabase: {},
    });
    resolveCurrentBusinessIdMock.mockResolvedValue({
      ok: true,
      businessId: 'biz-1',
    });

    const res = await handleVoiceTurn(makeTurnRequest({ omitAudio: true }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ success: false, error: 'audio file is required' });
    expect(transcribeVoiceAudioMock).not.toHaveBeenCalled();
  });

  it('returns the parsed draft and next ask when token + file are valid', async () => {
    const draft = {
      customer: 'Jane',
      phone: '',
      service: 'Full detail',
      pricing: '$89',
      addons: [
        { id: 'ceramic-coat', name: 'Ceramic coat', priceLabel: '$149' },
      ],
      vehicleYear: '2020',
      vehicleMake: 'Honda',
      vehicleModel: 'Civic',
      address: '1 Main St',
      date: '2026-09-14',
      time: '10:00',
    };
    getAuthenticatedUserMock.mockResolvedValue({
      authMethod: 'bearer',
      user: { id: 'user-1' },
      supabase: {},
    });
    resolveCurrentBusinessIdMock.mockResolvedValue({
      ok: true,
      businessId: 'biz-1',
    });
    transcribeVoiceAudioMock.mockResolvedValue({
      ok: true,
      transcript: 'book a full detail saturday at ten',
    });
    parseVoiceTurnMock.mockResolvedValue({
      draft,
      missing: ['phone'],
      ask: "What's their 10-digit phone number?",
      speak: "What's their 10-digit phone number?",
      ready: false,
    });
    speakVoiceTextMock.mockResolvedValue({
      ok: true,
      mimeType: 'audio/mpeg',
      base64: 'ZmFrZS1tcDM=',
      byteLength: 8,
    });

    const res = await handleVoiceTurn(
      makeTurnRequest({ draft: JSON.stringify(draft) })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      transcript: 'book a full detail saturday at ten',
      draft,
      missing: ['phone'],
      ask: "What's their 10-digit phone number?",
      speak: "What's their 10-digit phone number?",
      speakAudio: { mimeType: 'audio/mpeg', base64: 'ZmFrZS1tcDM=' },
      ready: false,
    });
    expect(speakVoiceTextMock).toHaveBeenCalledWith(
      "What's their 10-digit phone number?"
    );
  });

  it('uses an empty full draft when draft is missing or invalid', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      authMethod: 'bearer',
      user: { id: 'user-1' },
      supabase: {},
    });
    resolveCurrentBusinessIdMock.mockResolvedValue({
      ok: true,
      businessId: 'biz-1',
    });
    transcribeVoiceAudioMock.mockResolvedValue({
      ok: true,
      transcript: 'hello',
    });
    parseVoiceTurnMock.mockResolvedValue({
      draft: { ...EMPTY_VOICE_DRAFT, addons: [] },
      missing: [
        'customer',
        'phone',
        'service',
        'pricing',
        'vehicleYear',
        'vehicleMake',
        'vehicleModel',
        'address',
        'date',
        'time',
      ],
      ask: "What's the customer's name?",
      speak: "What's the customer's name?",
      ready: false,
    });
    speakVoiceTextMock.mockResolvedValue({
      ok: false,
      error: 'Could not synthesize speech',
    });

    const res = await handleVoiceTurn(makeTurnRequest({ draft: '{bad' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.draft).toEqual({ ...EMPTY_VOICE_DRAFT, addons: [] });
    expect(body.ready).toBe(false);
    expect(body.transcript).toBe('hello');
    expect(body.speakAudio).toBeNull();
  });

  it('returns 502 when transcription fails', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      authMethod: 'bearer',
      user: { id: 'user-1' },
      supabase: {},
    });
    resolveCurrentBusinessIdMock.mockResolvedValue({
      ok: true,
      businessId: 'biz-1',
    });
    transcribeVoiceAudioMock.mockResolvedValue({
      ok: false,
      status: 502,
      error: 'Could not transcribe audio',
    });

    const res = await handleVoiceTurn(makeTurnRequest());
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body).toEqual({
      success: false,
      error: 'Could not transcribe audio',
    });
  });
});
