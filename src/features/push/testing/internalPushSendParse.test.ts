import { parseInternalPushSendBody } from '@/features/push/server/internalPushSendParse';
import { describe, expect, it } from 'vitest';

describe('parseInternalPushSendBody', () => {
  it('parses valid body', () => {
    expect(
      parseInternalPushSendBody({
        userId: '  uuid-1  ',
        title: ' Hi ',
        body: 'Body',
        data: {
          reference_type: 'booking',
          reference_id: 'id-1',
        },
      })
    ).toEqual({
      userId: 'uuid-1',
      title: 'Hi',
      body: 'Body',
      data: { reference_type: 'booking', reference_id: 'id-1' },
    });
  });

  it('allows null body', () => {
    expect(
      parseInternalPushSendBody({
        userId: 'u1',
        title: 'T',
        body: null,
        data: { reference_type: 'quote', reference_id: 'q1' },
      })
    ).toEqual({
      userId: 'u1',
      title: 'T',
      body: null,
      data: { reference_type: 'quote', reference_id: 'q1' },
    });
  });

  it('returns null when data missing', () => {
    expect(
      parseInternalPushSendBody({
        userId: 'u1',
        title: 'T',
      })
    ).toBeNull();
  });

  it('returns null when reference fields empty', () => {
    expect(
      parseInternalPushSendBody({
        userId: 'u1',
        title: 'T',
        data: { reference_type: '', reference_id: 'x' },
      })
    ).toBeNull();
  });
});
