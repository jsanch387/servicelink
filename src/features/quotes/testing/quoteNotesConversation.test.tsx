import { QuoteNotesConversation } from '@/features/quotes/shared/components/QuoteNotesConversation';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('QuoteNotesConversation', () => {
  it('uses a plain text box when only the business left a note', () => {
    render(
      <QuoteNotesConversation
        businessNote="Includes clay bar"
        customerLabel="Jordan"
        businessLabel="You"
        viewer="owner"
      />
    );

    expect(screen.getByText('Includes clay bar')).toBeTruthy();
    expect(screen.queryByText('You')).toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('uses the conversation layout when both sides have notes', () => {
    render(
      <QuoteNotesConversation
        customerNote="Coffee on the seats"
        businessNote="Includes clay bar"
        customerLabel="Jordan"
        businessLabel="You"
        viewer="owner"
      />
    );

    expect(screen.getByRole('list', { name: 'Quote notes' })).toBeTruthy();
    expect(screen.getByText('Jordan')).toBeTruthy();
    expect(screen.getByText('You')).toBeTruthy();
  });
});
