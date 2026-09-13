import { emptyVoiceDraft } from '../constants/voiceTurnEcho';
import {
  fallbackAskAndSpeak,
  missingVoiceDraftFields,
  nextVoiceAskGroup,
  voiceTurnAskAndSpeak,
  voiceTurnReady,
} from '../utils/missingVoiceDraftFields';
import { describe, expect, it } from 'vitest';

describe('missingVoiceDraftFields', () => {
  it('lists all required gaps on an empty draft', () => {
    expect(missingVoiceDraftFields(emptyVoiceDraft())).toEqual([
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
    ]);
  });

  it('treats a non-10-digit phone as missing', () => {
    expect(
      missingVoiceDraftFields({
        ...emptyVoiceDraft(),
        customer: 'Jane',
        phone: '555',
      })
    ).toContain('phone');
  });

  it('pairs the next ask group', () => {
    const draft = {
      ...emptyVoiceDraft(),
      customer: 'Jane',
      phone: '5551234567',
    };
    expect(nextVoiceAskGroup(draft)?.id).toBe('service');
    expect(fallbackAskAndSpeak(draft).speak).toMatch(/service and price/i);
  });

  it('is ready when required fields are filled', () => {
    const draft = {
      ...emptyVoiceDraft(),
      customer: 'Jane',
      phone: '5551234567',
      service: 'Full detail',
      pricing: '$89',
      vehicleYear: '2020',
      vehicleMake: 'Honda',
      vehicleModel: 'Civic',
      address: '1 Main St',
      date: '2026-09-14',
      time: '10:00',
    };
    expect(voiceTurnReady(draft)).toBe(true);
    expect(missingVoiceDraftFields(draft)).toEqual([]);
  });

  it('keeps the first missing group when misheard or progressed', () => {
    const draft = {
      ...emptyVoiceDraft(),
      phone: '5551234567',
    };
    expect(voiceTurnAskAndSpeak(draft).ask).toBe("What's the customer's name?");
    expect(voiceTurnAskAndSpeak(draft, { misheard: true }).speak).toMatch(
      /didn't catch that.*customer/i
    );
    expect(voiceTurnAskAndSpeak(draft, { progressed: true }).speak).toMatch(
      /got it.*customer/i
    );
  });
});
