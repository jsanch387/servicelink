import { emptyVoiceDraft } from '../constants/voiceTurnEcho';
import { mergeVoiceDraft } from '../utils/mergeVoiceDraft';
import { describe, expect, it } from 'vitest';

describe('mergeVoiceDraft', () => {
  it('keeps current values when incoming fields are empty', () => {
    const current = { ...emptyVoiceDraft(), customer: 'Jane' };
    const merged = mergeVoiceDraft(current, emptyVoiceDraft(), '');
    expect(merged.customer).toBe('Jane');
  });

  it('fills Full detail + $89 from the transcript', () => {
    const merged = mergeVoiceDraft(
      emptyVoiceDraft(),
      emptyVoiceDraft(),
      'book a full detail saturday'
    );
    expect(merged.service).toBe('Full detail');
    expect(merged.pricing).toBe('$89');
  });

  it('adds ceramic coat when mentioned', () => {
    const merged = mergeVoiceDraft(
      emptyVoiceDraft(),
      emptyVoiceDraft(),
      'add ceramic coat'
    );
    expect(merged.addons).toEqual([
      { id: 'ceramic-coat', name: 'Ceramic coat', priceLabel: '$149' },
    ]);
  });

  it('adds pet hair and does not invent ceramic', () => {
    const merged = mergeVoiceDraft(
      emptyVoiceDraft(),
      {
        ...emptyVoiceDraft(),
        addons: [{ id: '1', name: 'Ceramic coat', priceLabel: '$149' }],
      },
      'add the pet hair removal add on'
    );
    expect(merged.addons).toEqual([
      { id: 'pet-hair', name: 'Pet hair removal', priceLabel: '' },
    ]);
  });

  it('dedupes ceramic add-ons', () => {
    const merged = mergeVoiceDraft(
      {
        ...emptyVoiceDraft(),
        addons: [
          { id: '1', name: 'Ceramic coat', priceLabel: '$149' },
          { id: 'ceramic-coat', name: 'Ceramic coat', priceLabel: '$149' },
        ],
      },
      emptyVoiceDraft(),
      ''
    );
    expect(merged.addons).toEqual([
      { id: 'ceramic-coat', name: 'Ceramic coat', priceLabel: '$149' },
    ]);
  });

  it('fills customer, date, and time from the transcript', () => {
    const merged = mergeVoiceDraft(
      emptyVoiceDraft(),
      emptyVoiceDraft(),
      'appointment for Jesus tomorrow at 3PM',
      new Date(2026, 8, 12)
    );
    expect(merged.customer).toBe('Jesus');
    expect(merged.date).toBe('2026-09-13');
    expect(merged.time).toBe('3:00 PM');
  });

  it('normalizes a 10-digit phone', () => {
    const merged = mergeVoiceDraft(
      emptyVoiceDraft(),
      { ...emptyVoiceDraft(), phone: '(555) 123-4567' },
      ''
    );
    expect(merged.phone).toBe('5551234567');
  });
});
