import { parseInternalPushBroadcastBody } from '@/features/push/server/internalPushBroadcastParse';
import { describe, expect, it } from 'vitest';

describe('parseInternalPushBroadcastBody', () => {
  it('parses valid body', () => {
    expect(
      parseInternalPushBroadcastBody({
        title: ' New feature ',
        body: 'Check it out',
        data: {
          reference_type: 'announcement',
          reference_id: 'maintenance-launch',
        },
      })
    ).toEqual({
      title: 'New feature',
      body: 'Check it out',
      data: {
        reference_type: 'announcement',
        reference_id: 'maintenance-launch',
      },
      testEmail: null,
    });
  });

  it('allows null body', () => {
    expect(
      parseInternalPushBroadcastBody({
        title: 'T',
        body: null,
        data: { reference_type: 'announcement', reference_id: 'x' },
      })
    ).toEqual({
      title: 'T',
      body: null,
      data: { reference_type: 'announcement', reference_id: 'x' },
      testEmail: null,
    });
  });

  it('parses testEmail', () => {
    expect(
      parseInternalPushBroadcastBody({
        title: 'T',
        testEmail: ' Me@Example.COM ',
        data: { reference_type: 'announcement', reference_id: 'x' },
      })
    ).toEqual({
      title: 'T',
      body: null,
      data: { reference_type: 'announcement', reference_id: 'x' },
      testEmail: 'me@example.com',
    });
  });

  it('returns null when data missing', () => {
    expect(
      parseInternalPushBroadcastBody({
        title: 'T',
      })
    ).toBeNull();
  });

  it('returns null when title empty', () => {
    expect(
      parseInternalPushBroadcastBody({
        title: '   ',
        data: { reference_type: 'announcement', reference_id: 'x' },
      })
    ).toBeNull();
  });

  it('returns null when title exceeds max length', () => {
    expect(
      parseInternalPushBroadcastBody({
        title: 'a'.repeat(121),
        data: { reference_type: 'screen', reference_id: 'payments' },
      })
    ).toBeNull();
  });
});
