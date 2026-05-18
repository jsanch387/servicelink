import { describe, expect, it } from 'vitest';

import {
  buildContactFormSubmissionHtml,
  getContactFormSubmissionSubject,
} from '../contact-form-submission/contactFormSubmissionTemplate';

describe('contact form submission email template', () => {
  it('formats subject with topic and name', () => {
    expect(
      getContactFormSubmissionSubject('feature_request', 'Alex Rivera')
    ).toBe('[Feature request] Message from Alex Rivera');
  });

  it('escapes untrusted HTML in the body', () => {
    const html = buildContactFormSubmissionHtml({
      name: '<script>alert(1)</script>',
      email: 'user@example.com',
      topic: 'other',
      message: 'Hello <b>world</b>',
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Hello &lt;b&gt;world&lt;/b&gt;');
  });
});
