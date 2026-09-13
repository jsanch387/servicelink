import { extractVoiceDraftFromTranscript } from '../utils/extractVoiceDraftFromTranscript';
import { describe, expect, it } from 'vitest';

describe('extractVoiceDraftFromTranscript', () => {
  const now = new Date(2026, 8, 12);

  it('fills name, tomorrow, and 3PM from a booking sentence', () => {
    const extracted = extractVoiceDraftFromTranscript(
      'Hey. Can you create an appointment for Jesus tomorrow at 3PM for the signature shine on an SUV?',
      now
    );

    expect(extracted.customer).toBe('Jesus');
    expect(extracted.date).toBe('2026-09-13');
    expect(extracted.time).toBe('3:00 PM');
    expect(extracted.service).toBe('');
  });

  it('does not treat "for the" as a customer name', () => {
    const extracted = extractVoiceDraftFromTranscript(
      'book the signature shine for the SUV tomorrow',
      now
    );
    expect(extracted.customer).toBe('');
    expect(extracted.date).toBe('2026-09-13');
  });
});
