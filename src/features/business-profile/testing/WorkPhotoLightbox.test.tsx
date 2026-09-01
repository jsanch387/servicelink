import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkPhotoLightbox } from '../components/work/WorkPhotoLightbox';

const photos = [
  { id: '1', src: 'https://cdn.example/1.jpg' },
  { id: '2', src: 'https://cdn.example/2.jpg' },
];

afterEach(() => {
  cleanup();
});

describe('WorkPhotoLightbox', () => {
  beforeEach(() => {
    Element.prototype.scrollTo = vi.fn();
  });

  it('renders nothing when closed', () => {
    render(
      <WorkPhotoLightbox photos={photos} openIndex={null} onClose={() => {}} />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens at the selected photo and closes from the header', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <WorkPhotoLightbox photos={photos} openIndex={1} onClose={onClose} />
    );

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('2 of 2')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <WorkPhotoLightbox photos={photos} openIndex={0} onClose={onClose} />
    );

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
