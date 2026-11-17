import { describe, expect, it } from 'vitest';

import { GUIDE_CONTENT } from '../content';
import { GUIDES } from '../data/guides';

describe('resources guides registry', () => {
  it('gives every guide a unique slug and a content component', () => {
    const slugs = GUIDES.map(guide => guide.slug);
    expect(new Set(slugs).size).toBe(slugs.length);

    for (const guide of GUIDES) {
      expect(GUIDE_CONTENT[guide.slug], guide.slug).toBeTypeOf('function');
      expect(guide.metaDescription?.length ?? 0).toBeGreaterThan(0);
      expect(guide.metaDescription?.length ?? 0).toBeLessThanOrEqual(160);
    }
  });

  it('does not target CRM keywords from the DetailDeck comparison', () => {
    const detailDeck = GUIDES.find(
      guide => guide.slug === 'servicelink-vs-detaildeck'
    );
    expect(detailDeck).toBeTruthy();
    expect(detailDeck?.keywords?.join(' ').toLowerCase()).not.toMatch(
      /best crm for (solo|mobile) detailers/
    );
  });
});
