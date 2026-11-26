import { describe, expect, it } from 'vitest';
import { SERVICELINK_ONE_LINER } from '@/constants/brandCopy';
import { buildLlmsTxt } from '../llmsTxt';
import { buildSiteSoftwareJsonLd } from '../siteJsonLd';

describe('site JSON-LD and llms.txt', () => {
  it('describes Free, Pro, and Team without ratings', () => {
    const { organization, software } = buildSiteSoftwareJsonLd();
    const blob = JSON.stringify({ organization, software });
    expect(blob).not.toMatch(/aggregateRating/i);
    expect(blob).not.toMatch(/reviewCount/i);
    expect(blob).not.toMatch(/4\.77/);
    expect(software.offers.offers.map(offer => offer.name)).toEqual([
      'Free',
      'Pro',
      'Team',
    ]);
    expect(organization.description).toBe(SERVICELINK_ONE_LINER);
    expect(organization.sameAs.length).toBeGreaterThanOrEqual(4);
  });

  it('summarizes the product for AI crawlers', () => {
    const text = buildLlmsTxt();
    expect(text).toContain(SERVICELINK_ONE_LINER);
    expect(text).toContain('/auto-detailing');
    expect(text).toContain('/faq');
    expect(text).toContain('/resources');
    expect(text).not.toContain('free trial');
    expect(text).not.toContain('4.77');
  });
});
