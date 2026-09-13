import type { VoiceDraft } from '../types/voiceDraft';

export type VoiceDraftField = Exclude<keyof VoiceDraft, 'addons'>;

export type VoiceAskGroup = {
  id: string;
  fields: readonly VoiceDraftField[];
  ask: string;
  speak: string;
};

/** Required for ready. Add-ons stay optional. Related fields are asked together. */
export const VOICE_ASK_GROUPS: readonly VoiceAskGroup[] = [
  {
    id: 'customer',
    fields: ['customer'],
    ask: "What's the customer's name?",
    speak: "What's the customer's name?",
  },
  {
    id: 'phone',
    fields: ['phone'],
    ask: "What's their 10-digit phone number?",
    speak: "What's their 10-digit phone number?",
  },
  {
    id: 'service',
    fields: ['service', 'pricing'],
    ask: 'What service and price? Full detail sedan is $89.',
    speak: 'What service and price? Full detail for a sedan is $89.',
  },
  {
    id: 'vehicle',
    fields: ['vehicleYear', 'vehicleMake', 'vehicleModel'],
    ask: "What's the vehicle year, make, and model?",
    speak: "What's the vehicle year, make, and model?",
  },
  {
    id: 'address',
    fields: ['address'],
    ask: "What's the service address?",
    speak: "What's the service address?",
  },
  {
    id: 'schedule',
    fields: ['date', 'time'],
    ask: 'What date and time should I put this on the calendar?',
    speak: 'What date and time should I put this on the calendar?',
  },
] as const;

export const VOICE_READY_ASK =
  "I've got everything I need. Review the details on your phone when you're ready.";
export const VOICE_READY_SPEAK = VOICE_READY_ASK;

export const VOICE_MISHEARD_PREFIX = "I didn't catch that.";
export const VOICE_GOT_IT_PREFIX = 'Got it.';
