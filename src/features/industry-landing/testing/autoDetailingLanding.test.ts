import { describe, expect, it } from 'vitest';
import { AUTO_DETAILING_LANDING } from '../data/auto-detailing';

describe('auto-detailing landing content', () => {
  it('is driven by a single industry config object', () => {
    expect(AUTO_DETAILING_LANDING.id).toBe('auto-detailing');
    expect(AUTO_DETAILING_LANDING.path).toBe('/auto-detailing');
    expect(AUTO_DETAILING_LANDING.hero.h1).toBeTruthy();
    expect(AUTO_DETAILING_LANDING.howItWorks.steps).toHaveLength(3);
    expect(AUTO_DETAILING_LANDING.features.tiles).toHaveLength(5);
    expect(AUTO_DETAILING_LANDING.faqs.length).toBeGreaterThan(0);
  });

  it('does not claim disallowed features', () => {
    const blob = JSON.stringify(AUTO_DETAILING_LANDING).toLowerCase();
    expect(blob).not.toContain('free trial');
    expect(blob).not.toContain('two-way');
    expect(blob).not.toContain('marketplace');
    expect(blob).not.toContain('promo code');
    expect(blob).not.toContain('4.77');
    expect(blob).toContain('deposits on pro');
  });
});
