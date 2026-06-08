import {
  parseServiceDescriptionLine,
  parseServiceDescriptionLines,
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
