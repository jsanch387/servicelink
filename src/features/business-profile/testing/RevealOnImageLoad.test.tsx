import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RevealOnImageLoad } from '../components/RevealOnImageLoad';

afterEach(() => {
  cleanup();
});

describe('RevealOnImageLoad', () => {
  it('shows the skeleton until the image is ready, then hides it', () => {
    const { rerender } = render(
      <RevealOnImageLoad isLoaded={false}>
        <span>cover</span>
      </RevealOnImageLoad>
    );

    const skeleton = document.querySelector('.skeleton-image');
    expect(skeleton?.className).toContain('opacity-100');

    rerender(
      <RevealOnImageLoad isLoaded>
        <span>cover</span>
      </RevealOnImageLoad>
    );

    expect(document.querySelector('.skeleton-image')?.className).toContain(
      'opacity-0'
    );
  });
});
