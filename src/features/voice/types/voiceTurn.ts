import type { VoiceDraft } from './voiceDraft';

/** Deepgram Speak clip for the orb to play instead of device TTS. */
export type VoiceSpeakAudio = {
  mimeType: string;
  base64: string;
};

export type VoiceTurnResponse = {
  transcript: string;
  draft: VoiceDraft;
  missing: string[];
  ask: string;
  speak: string;
  speakAudio: VoiceSpeakAudio | null;
  ready: boolean;
};
