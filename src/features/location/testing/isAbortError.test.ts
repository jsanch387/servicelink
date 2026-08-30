import { describe, expect, it } from 'vitest';
import { isAbortError } from '../utils/isAbortError';

describe('isAbortError', () => {
  it('recognizes DOM AbortError', () => {
    expect(isAbortError(new DOMException('Aborted', 'AbortError'))).toBe(true);
  });

  it('recognizes Next / fetch "signal is aborted without reason"', () => {
    expect(isAbortError(new Error('signal is aborted without reason'))).toBe(
      true
    );
  });

  it('ignores unrelated errors', () => {
    expect(
      isAbortError(new Error('Location suggestions are unavailable.'))
    ).toBe(false);
  });
});
