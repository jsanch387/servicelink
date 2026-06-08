import { isParagraphContentClamped } from '@/features/business-profile/hooks/useServiceDescriptionClamp';
import { describe, expect, it } from 'vitest';

describe('isParagraphContentClamped', () => {
  it('returns false when content fits the visible height', () => {
    const element = { scrollHeight: 96, clientHeight: 96 } as HTMLElement;
    expect(isParagraphContentClamped(element)).toBe(false);
  });

  it('returns true when content exceeds the visible height', () => {
    const element = { scrollHeight: 140, clientHeight: 96 } as HTMLElement;
    expect(isParagraphContentClamped(element)).toBe(true);
  });
});
