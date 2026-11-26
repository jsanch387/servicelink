import { describe, expect, it } from 'vitest';
import {
  isReservedBusinessSlug,
  isReservedOrphanTopLevelPath,
  RESERVED_BUSINESS_SLUGS,
} from '../reservedSlugs';

describe('reserved business slugs', () => {
  it('blocks new marketing and common-word slugs', () => {
    expect(isReservedBusinessSlug('faq')).toBe(true);
    expect(isReservedBusinessSlug('FAQ')).toBe(true);
    expect(isReservedBusinessSlug('auto-detailing')).toBe(true);
    expect(isReservedBusinessSlug('llms.txt')).toBe(true);
    expect(isReservedBusinessSlug('blog')).toBe(true);
    expect(isReservedBusinessSlug('help')).toBe(true);
    expect(isReservedBusinessSlug('pricing')).toBe(true);
    expect(isReservedBusinessSlug('resources')).toBe(true);
    expect(isReservedBusinessSlug('blacklabelauto')).toBe(false);
  });

  it('treats reserved words without a page as orphan top-level paths', () => {
    expect(isReservedOrphanTopLevelPath('/blog')).toBe(true);
    expect(isReservedOrphanTopLevelPath('/help')).toBe(true);
    expect(isReservedOrphanTopLevelPath('/faq')).toBe(false);
    expect(isReservedOrphanTopLevelPath('/auto-detailing')).toBe(false);
    expect(isReservedOrphanTopLevelPath('/blacklabelauto')).toBe(false);
    expect(isReservedOrphanTopLevelPath('/__not-found')).toBe(false);
  });

  it('has unique entries', () => {
    expect(new Set(RESERVED_BUSINESS_SLUGS).size).toBe(
      RESERVED_BUSINESS_SLUGS.length
    );
  });
});
