import { useResetWindowScrollOnMount } from '@/components/shared';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicBusinessProfileView } from '../components/PublicBusinessProfileView';

vi.mock('../components/BusinessProfileReadView', () => ({
  BusinessProfileReadView: () => <div>profile</div>,
}));

function ScrollResetProbe() {
  useResetWindowScrollOnMount();
  return <div>mounted</div>;
}

describe('public profile landing scroll', () => {
  const originalScrollTo = window.scrollTo;
  const originalHash = window.location.hash;

  beforeEach(() => {
    window.scrollTo = vi.fn();
    document.documentElement.scrollTop = 48;
    document.body.scrollTop = 48;
    window.history.scrollRestoration = 'auto';
    if (originalHash) {
      window.location.hash = '';
    }
  });

  afterEach(() => {
    cleanup();
    window.scrollTo = originalScrollTo;
    window.history.scrollRestoration = 'auto';
    window.location.hash = originalHash;
    vi.useRealTimers();
  });

  it('pins the window to the top and disables scroll restoration', () => {
    render(<ScrollResetProbe />);

    expect(window.history.scrollRestoration).toBe('manual');
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
    expect(document.documentElement.scrollTop).toBe(0);
    expect(document.body.scrollTop).toBe(0);
  });

  it('leaves hash targets alone', () => {
    window.location.hash = '#reviews';

    render(<ScrollResetProbe />);

    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(window.history.scrollRestoration).toBe('auto');
  });

  it('resets again after late layout', () => {
    vi.useFakeTimers();
    render(<ScrollResetProbe />);
    vi.mocked(window.scrollTo).mockClear();

    vi.advanceTimersByTime(120);

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
  });

  it('opens the public profile without overflow anchoring', () => {
    render(
      <PublicBusinessProfileView
        businessProfile={{ business_name: 'Black Label Auto' } as never}
      />
    );

    expect(
      document.querySelector('[class*="overflow-anchor"]')
    ).not.toBeNull();
    expect(window.history.scrollRestoration).toBe('manual');
  });
});
