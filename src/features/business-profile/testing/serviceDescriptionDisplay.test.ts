import {
  flattenServiceDescriptionForCardPreview,
  parseServiceDescriptionLine,
  parseServiceDescriptionLines,
  serviceCardDescriptionNeedsExpand,
  truncateServiceDescriptionForCardPreview,
} from '@/features/business-profile/utils/serviceDescriptionDisplay';
import { describe, expect, it } from 'vitest';

describe('parseServiceDescriptionLine', () => {
  it('detects bullet lines', () => {
    expect(parseServiceDescriptionLine('• Exterior wash')).toEqual({
      kind: 'bullet',
      text: 'Exterior wash',
    });
  });

  it('detects plain text lines', () => {
    expect(parseServiceDescriptionLine('Includes wax and sealant')).toEqual({
      kind: 'text',
      text: 'Includes wax and sealant',
    });
  });

  it('detects empty lines', () => {
    expect(parseServiceDescriptionLine('')).toEqual({ kind: 'empty' });
  });
});

describe('parseServiceDescriptionLines', () => {
  it('splits multiline descriptions', () => {
    expect(
      parseServiceDescriptionLines('Intro line\n• Item one\n• Item two')
    ).toEqual([
      { kind: 'text', text: 'Intro line' },
      { kind: 'bullet', text: 'Item one' },
      { kind: 'bullet', text: 'Item two' },
    ]);
  });
});

describe('service card description preview', () => {
  it('flattens multiline descriptions into one preview string', () => {
    expect(
      flattenServiceDescriptionForCardPreview(
        'Wheel and tire cleaner\n• Full interior vacuum'
      )
    ).toBe('Wheel and tire cleaner Full interior vacuum');
  });

  it('detects when preview needs expand', () => {
    const description = 'Wheel and tire cleaner'.repeat(8);
    expect(serviceCardDescriptionNeedsExpand(description, 140)).toBe(true);
  });

  it('truncates at a word boundary without adding ellipsis', () => {
    expect(
      truncateServiceDescriptionForCardPreview(
        'Wheel and tire cleaner with premium gloss finish',
        24
      )
    ).toBe('Wheel and tire cleaner');
  });
});
