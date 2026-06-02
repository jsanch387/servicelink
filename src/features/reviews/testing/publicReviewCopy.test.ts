import {
  reviewFormIntro,
  reviewPageSubtitle,
} from '../public/copy/publicReviewCopy';
import { describe, expect, it } from 'vitest';

describe('publicReviewCopy', () => {
  it('subtitle speaks from the business', () => {
    expect(reviewPageSubtitle('Black Label Auto')).toContain(
      'Black Label Auto would love to hear'
    );
  });

  it('intro uses first name and service', () => {
    const intro = reviewFormIntro({
      greetingName: 'Alex',
      businessName: 'Black Label Auto',
      serviceName: 'Full detail',
    });
    expect(intro).toContain('Hey Alex');
    expect(intro).toContain('Black Label Auto');
    expect(intro).toContain('Full detail');
  });
});
