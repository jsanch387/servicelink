import type { CompleteBusinessProfile } from '@/features/business-profile/types/businessProfile';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkShowcase } from '../components/WorkShowcase';

const noop = async () => {};

function profileWithImages(count: number): CompleteBusinessProfile {
  return {
    business_name: 'Black Label Auto',
    images: Array.from({ length: count }, (_, index) => ({
      id: `img-${index}`,
      preview_url: `https://cdn.example/${index}.jpg`,
    })),
  } as CompleteBusinessProfile;
}

afterEach(() => {
  cleanup();
});

describe('WorkShowcase', () => {
  beforeEach(() => {
    Element.prototype.scrollTo = vi.fn();
  });

  it('shows the public empty state when there are no photos', () => {
    render(
      <WorkShowcase
        businessProfile={profileWithImages(0)}
        editMode="view"
        onSave={noop}
        onCancel={() => {}}
        isPublic
      />
    );
    expect(screen.getByText('No photos yet')).toBeTruthy();
  });

  it('opens the lightbox from a gallery tile', async () => {
    const user = userEvent.setup();
    render(
      <WorkShowcase
        businessProfile={profileWithImages(3)}
        editMode="view"
        onSave={noop}
        onCancel={() => {}}
        isPublic
      />
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Black Label Auto work photo 2 of 3',
      })
    );
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('2 of 3')).toBeTruthy();
  });
});
