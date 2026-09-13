import {
  normalizeUsPhoneDigits,
  US_PHONE_DIGIT_COUNT,
} from '@/lib/formatUsPhone';
import { emptyVoiceDraft } from '../constants/voiceTurnEcho';
import type { VoiceDraft } from '../types/voiceDraft';

const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

const NAME_STOP = new Set([
  ...WEEKDAYS,
  'a',
  'an',
  'the',
  'me',
  'us',
  'him',
  'her',
  'them',
  'this',
  'that',
  'at',
  'on',
  'in',
  'and',
  'or',
  'today',
  'tomorrow',
  'tonight',
  'appointment',
  'booking',
  'detail',
  'full',
  'ceramic',
  'coat',
  'suv',
  'sedan',
  'truck',
  'van',
  'coupe',
  'am',
  'pm',
  'hey',
  'hi',
  'hello',
  'can',
  'you',
  'please',
  'create',
  'make',
  'schedule',
  'book',
]);

function localYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addLocalDays(now: Date, days: number): string {
  return localYmd(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + days)
  );
}

function titleCaseName(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function takeNameTokens(rest: string): string {
  const tokens = rest.match(/[A-Za-z][A-Za-z'-]*/g) ?? [];
  const names: string[] = [];
  for (const token of tokens) {
    if (NAME_STOP.has(token.toLowerCase())) break;
    names.push(token);
    if (names.length >= 3) break;
  }
  return names.length > 0 ? titleCaseName(names.join(' ')) : '';
}

function extractCustomerName(transcript: string): string {
  const prefixes = [
    /(?:customer(?:'s)? name|the name|name)\s+is\s+/i,
    /(?:appointment|booking|book)\s+for\s+/i,
    /\bfor\s+(?!the\b|a\b|an\b)/i,
  ];

  for (const prefix of prefixes) {
    const match = prefix.exec(transcript);
    if (!match) continue;
    const name = takeNameTokens(
      transcript.slice(match.index + match[0].length)
    );
    if (name) return name;
  }

  return '';
}

function extractPhone(transcript: string): string {
  const digits = normalizeUsPhoneDigits(transcript);
  return digits.length === US_PHONE_DIGIT_COUNT ? digits : '';
}

function extractDate(transcript: string, now: Date): string {
  const lower = transcript.toLowerCase();
  if (/\btomorrow\b/.test(lower)) return addLocalDays(now, 1);
  if (/\b(?:today|tonight)\b/.test(lower)) return addLocalDays(now, 0);

  const iso = transcript.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso?.[1]) return iso[1];

  const slash = transcript.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (slash) {
    const month = Number(slash[1]);
    const day = Number(slash[2]);
    const yearRaw = slash[3];
    const year = yearRaw
      ? yearRaw.length === 2
        ? 2000 + Number(yearRaw)
        : Number(yearRaw)
      : now.getFullYear();
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return localYmd(new Date(year, month - 1, day));
    }
  }

  for (const [index, day] of WEEKDAYS.entries()) {
    if (!new RegExp(`\\b${day}\\b`).test(lower)) continue;
    const add = (index - now.getDay() + 7) % 7;
    return addLocalDays(now, add);
  }

  return '';
}

function extractTime(transcript: string): string {
  const match = transcript.match(
    /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\b/i
  );
  if (!match) return '';

  const hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  const meridiemRaw = match[3]?.replace(/\./g, '').toUpperCase();
  const saidAt = /\bat\s+\d/i.test(match[0]);

  if (!meridiemRaw && !saidAt) return '';
  if (!Number.isFinite(hour) || hour < 1 || hour > 23 || minute > 59) return '';

  if (!meridiemRaw && hour > 12) {
    const display = hour % 12 || 12;
    return `${display}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
  }

  if (!meridiemRaw) {
    return `${hour}:${String(minute).padStart(2, '0')}`;
  }

  return `${hour > 12 ? hour % 12 : hour}:${String(minute).padStart(2, '0')} ${meridiemRaw}`;
}

/** Best-effort fields from the clip when the model is down or leaves gaps. */
export function extractVoiceDraftFromTranscript(
  transcript: string,
  now = new Date()
): VoiceDraft {
  return {
    ...emptyVoiceDraft(),
    customer: extractCustomerName(transcript),
    phone: extractPhone(transcript),
    date: extractDate(transcript, now),
    time: extractTime(transcript),
  };
}
