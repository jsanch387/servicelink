import { emptyVoiceDraft } from '../constants/voiceTurnEcho';
import { parseVoiceTurn } from '../server/parseVoiceTurn';
import { afterEach, describe, expect, it } from 'vitest';

describe('parseVoiceTurn', () => {
  const previousKey = process.env.OPENAI_API_KEY;

  afterEach(() => {
    if (previousKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = previousKey;
    }
  });

  it('fills name and schedule from the transcript when OpenAI is missing', async () => {
    delete process.env.OPENAI_API_KEY;

    const parsed = await parseVoiceTurn({
      transcript:
        'Hey. Can you create an appointment for Jesus tomorrow at 3PM for the signature shine on an SUV?',
      draft: emptyVoiceDraft(),
    });

    expect(parsed.draft.customer).toBe('Jesus');
    expect(parsed.draft.time).toBe('3:00 PM');
    expect(parsed.missing[0]).toBe('phone');
    expect(parsed.ask).toMatch(/phone/i);
  });

  it('repeats the next gap when the transcript is empty', async () => {
    const draft = {
      ...emptyVoiceDraft(),
      phone: '5805553232',
      service: 'Full detail',
      pricing: '$89',
      addons: [
        { id: '1', name: 'Ceramic coat', priceLabel: '$149' },
        { id: 'ceramic-coat', name: 'Ceramic coat', priceLabel: '$149' },
      ],
      vehicleYear: '2017',
      vehicleMake: 'Toyota',
      vehicleModel: 'Tacoma',
      date: '2026-09-12',
      time: '15:00',
    };

    const parsed = await parseVoiceTurn({ transcript: '   ', draft });

    expect(parsed.draft.customer).toBe('');
    expect(parsed.draft.addons).toEqual([
      { id: 'ceramic-coat', name: 'Ceramic coat', priceLabel: '$149' },
    ]);
    expect(parsed.missing[0]).toBe('customer');
    expect(parsed.ask).toBe("What's the customer's name?");
    expect(parsed.speak).toMatch(/didn't catch that/i);
    expect(parsed.speak).toMatch(/customer/i);
  });
});
