import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AssistantReplyText } from '../components/AssistantReplyText';

afterEach(() => {
  cleanup();
});

describe('AssistantReplyText', () => {
  it('renders bold and bullet lists without showing raw markdown markers', () => {
    render(
      <AssistantReplyText
        text={`Here are people to follow up with:\n\n- **Jordan** — review\n- Sam — check-in\n\nTotal about **$120**.`}
      />
    );

    expect(screen.queryByText(/\*\*/)).toBeNull();
    expect(screen.getByText('Jordan').tagName).toBe('STRONG');
    expect(screen.getByText('$120').tagName).toBe('STRONG');
    expect(screen.getByRole('list')).toBeTruthy();
  });

  it('renders markdown headings without showing # markers', () => {
    render(
      <AssistantReplyText
        text={`### Suggestions for Improvement:\n\n- Clarify names\n- Add a package`}
      />
    );

    expect(screen.queryByText(/###/)).toBeNull();
    expect(screen.getByText('Suggestions for Improvement:')).toBeTruthy();
    expect(screen.getByRole('list')).toBeTruthy();
  });
});

