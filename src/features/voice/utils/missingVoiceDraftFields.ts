import {
  normalizeUsPhoneDigits,
  US_PHONE_DIGIT_COUNT,
} from '@/lib/formatUsPhone';
import {
  VOICE_ASK_GROUPS,
  VOICE_GOT_IT_PREFIX,
  VOICE_MISHEARD_PREFIX,
  VOICE_READY_ASK,
  VOICE_READY_SPEAK,
  type VoiceAskGroup,
  type VoiceDraftField,
} from '../constants/voiceAskGroups';
import type { VoiceDraft } from '../types/voiceDraft';

function isFieldFilled(draft: VoiceDraft, field: VoiceDraftField): boolean {
  const value = draft[field].trim();
  if (!value) return false;
  if (field === 'phone') {
    return normalizeUsPhoneDigits(value).length === US_PHONE_DIGIT_COUNT;
  }
  return true;
}

export function missingVoiceDraftFields(draft: VoiceDraft): VoiceDraftField[] {
  return VOICE_ASK_GROUPS.flatMap(group =>
    group.fields.filter(field => !isFieldFilled(draft, field))
  );
}

export function nextVoiceAskGroup(draft: VoiceDraft): VoiceAskGroup | null {
  return (
    VOICE_ASK_GROUPS.find(group =>
      group.fields.some(field => !isFieldFilled(draft, field))
    ) ?? null
  );
}

export function voiceTurnReady(draft: VoiceDraft): boolean {
  return missingVoiceDraftFields(draft).length === 0;
}

export function fallbackAskAndSpeak(draft: VoiceDraft): {
  ask: string;
  speak: string;
} {
  const group = nextVoiceAskGroup(draft);
  if (!group) {
    return { ask: VOICE_READY_ASK, speak: VOICE_READY_SPEAK };
  }
  return { ask: group.ask, speak: group.speak };
}

export function voiceDraftProgressed(
  before: VoiceDraft,
  after: VoiceDraft
): boolean {
  if (
    missingVoiceDraftFields(after).length <
    missingVoiceDraftFields(before).length
  ) {
    return true;
  }
  return after.addons.length > before.addons.length;
}

/** Server owns the next question. Do not let the model pick a different gap. */
export function voiceTurnAskAndSpeak(
  draft: VoiceDraft,
  opts?: { misheard?: boolean; progressed?: boolean }
): { ask: string; speak: string } {
  const next = fallbackAskAndSpeak(draft);
  if (voiceTurnReady(draft)) return next;

  if (opts?.misheard) {
    return {
      ask: next.ask,
      speak: `${VOICE_MISHEARD_PREFIX} ${next.speak}`,
    };
  }

  if (opts?.progressed) {
    return {
      ask: next.ask,
      speak: `${VOICE_GOT_IT_PREFIX} ${next.speak}`,
    };
  }

  return next;
}
