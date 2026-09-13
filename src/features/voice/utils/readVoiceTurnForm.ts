import {
  VOICE_TURN_AUDIO_FIELD,
  VOICE_TURN_DRAFT_FIELD,
  VOICE_TURN_MAX_AUDIO_BYTES,
} from '../constants/voiceTurnEcho';
import type { VoiceDraft } from '../types/voiceDraft';
import { parseVoiceDraft } from './parseVoiceDraft';

export type VoiceTurnForm =
  | {
      ok: true;
      audio: Blob;
      audioName: string;
      audioType: string;
      draftRaw: string | null;
      draft: VoiceDraft;
    }
  | {
      ok: false;
      status: 400 | 413;
      error: string;
    };

function isAudioBlob(value: FormDataEntryValue | null): value is Blob {
  return value instanceof Blob && value.size > 0;
}

async function draftFieldToUnknown(
  value: FormDataEntryValue | null
): Promise<unknown> {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Blob) {
    try {
      return await value.text();
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Pull `audio` + `draft` from multipart form data.
 * Invalid draft → empty draft. Missing / empty audio → 400.
 */
export async function readVoiceTurnForm(
  request: Request
): Promise<VoiceTurnForm> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return {
      ok: false,
      status: 400,
      error: 'Expected multipart/form-data with audio and draft',
    };
  }

  const audio = formData.get(VOICE_TURN_AUDIO_FIELD);
  if (!isAudioBlob(audio)) {
    return {
      ok: false,
      status: 400,
      error: 'audio file is required',
    };
  }

  if (audio.size > VOICE_TURN_MAX_AUDIO_BYTES) {
    return {
      ok: false,
      status: 413,
      error: 'audio file is too large',
    };
  }

  const draftRaw = await draftFieldToUnknown(
    formData.get(VOICE_TURN_DRAFT_FIELD)
  );
  const draftRawString = typeof draftRaw === 'string' ? draftRaw : null;
  const draft = parseVoiceDraft(draftRaw);

  return {
    ok: true,
    audio,
    audioName: audio instanceof File ? audio.name : '',
    audioType: audio.type || '',
    draftRaw: draftRawString,
    draft,
  };
}
