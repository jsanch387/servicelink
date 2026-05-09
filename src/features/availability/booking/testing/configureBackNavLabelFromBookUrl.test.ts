/**
 * Calendar “back” copy must match the URL the customer will restore (add-ons vs price vs service).
 * Prevents stale server labels after client `replaceState` in the configure↔calendar funnel.
 */
import { describe, expect, it } from 'vitest';
import { configureBackNavLabelFromBookUrl } from '../utils/configureBackNavLabelFromBookUrl';

const nav = {
  backToAddOns: 'Back to add-ons',
  backToOptions: 'Back to options',
  backToService: 'Back to service',
};

describe('configureBackNavLabelFromBookUrl', () => {
  it('uses detailsStep=addons when present', () => {
    expect(
      configureBackNavLabelFromBookUrl(
        '/acme/book?serviceId=s1&detailsStep=addons',
        nav
      )
    ).toBe('Back to add-ons');
  });

  it('infers add-ons from addOnIds when detailsStep omitted', () => {
    expect(
      configureBackNavLabelFromBookUrl(
        '/acme/book?serviceId=s1&addOnIds=a1',
        nav
      )
    ).toBe('Back to add-ons');
  });

  it('uses options when on price step with a price option', () => {
    expect(
      configureBackNavLabelFromBookUrl(
        '/acme/book?serviceId=s1&detailsStep=price&priceOptionId=p1',
        nav
      )
    ).toBe('Back to options');
  });

  it('falls back to service when no add-ons signal', () => {
    expect(
      configureBackNavLabelFromBookUrl('/acme/book?serviceId=s1', nav)
    ).toBe('Back to service');
  });

  it('uses options label only when price step has a selected priceOptionId', () => {
    expect(
      configureBackNavLabelFromBookUrl(
        '/acme/book?serviceId=s1&detailsStep=price',
        nav
      )
    ).toBe('Back to service');
    expect(
      configureBackNavLabelFromBookUrl(
        '/acme/book?serviceId=s1&detailsStep=price&priceOptionId=p9',
        nav
      )
    ).toBe('Back to options');
  });
});
