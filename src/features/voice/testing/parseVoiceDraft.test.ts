import { emptyVoiceDraft } from '../constants/voiceTurnEcho';
import { parseVoiceDraft } from '../utils/parseVoiceDraft';
import { describe, expect, it } from 'vitest';

describe('parseVoiceDraft', () => {
  it('returns an empty draft for missing or invalid input', () => {
    const empty = emptyVoiceDraft();
    expect(parseVoiceDraft(null)).toEqual(empty);
    expect(parseVoiceDraft(undefined)).toEqual(empty);
    expect(parseVoiceDraft('')).toEqual(empty);
    expect(parseVoiceDraft('   ')).toEqual(empty);
    expect(parseVoiceDraft('not-json')).toEqual(empty);
    expect(parseVoiceDraft('[]')).toEqual(empty);
    expect(parseVoiceDraft(12)).toEqual(empty);
  });

  it('fills the full draft from a partial object', () => {
    expect(parseVoiceDraft({ customer: 'Jane', phone: '5551234567' })).toEqual({
      ...emptyVoiceDraft(),
      customer: 'Jane',
      phone: '5551234567',
    });
  });

  it('parses a JSON string and keeps known string fields unchanged', () => {
    const raw = JSON.stringify({
      customer: ' Jane ',
      phone: '5551234567',
      extra: 'ignored',
    });
    expect(parseVoiceDraft(raw)).toEqual({
      ...emptyVoiceDraft(),
      customer: ' Jane ',
      phone: '5551234567',
    });
  });

  it('parses later-shape add-ons and drops non-objects', () => {
    expect(
      parseVoiceDraft({
        addons: [
          { id: 'ceramic-coat', name: 'Ceramic coat', priceLabel: '$149' },
          'skip',
          { id: 'wax' },
        ],
      })
    ).toEqual({
      ...emptyVoiceDraft(),
      addons: [
        { id: 'ceramic-coat', name: 'Ceramic coat', priceLabel: '$149' },
        { id: 'wax', name: '', priceLabel: '' },
      ],
    });
  });

  it('coerces non-string fields to empty strings', () => {
    expect(parseVoiceDraft({ customer: 12, phone: null })).toEqual(
      emptyVoiceDraft()
    );
  });
});
