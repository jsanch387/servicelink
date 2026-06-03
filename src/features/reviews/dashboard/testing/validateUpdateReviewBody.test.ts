import { describe, expect, it } from 'vitest';
import { validateUpdateReviewBody } from '../server/validateUpdateReviewBody';

describe('validateUpdateReviewBody', () => {
  it('accepts null to clear reply', () => {
    expect(validateUpdateReviewBody({ ownerReplyBody: null })).toEqual({
      ok: true,
      value: { ownerReplyBody: null },
    });
  });

  it('accepts trimmed reply text', () => {
    expect(validateUpdateReviewBody({ ownerReplyBody: '  Thanks!  ' })).toEqual(
      {
        ok: true,

        value: { ownerReplyBody: 'Thanks!' },
      }
    );
  });

  it('rejects empty string reply', () => {
    expect(validateUpdateReviewBody({ ownerReplyBody: '   ' }).ok).toBe(false);
  });
});
