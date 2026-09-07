import type { CompleteBusinessProfile } from '@/features/business-profile/types/businessProfile';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileHeader } from '../components/ProfileHeader';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const noopSave = async () => {};

function profile(
  overrides: Partial<CompleteBusinessProfile> = {}
): CompleteBusinessProfile {
  return {
    business_name: 'Black Label Auto',
    business_slug: 'blacklabelauto',
    cover_image_url:
      'https://qailotbnrtwyzhbwufvk.supabase.co/storage/v1/object/public/business_images/biz/cover.jpg',
    logo_url:
      'https://qailotbnrtwyzhbwufvk.supabase.co/storage/v1/object/public/business_images/biz/logo.jpg',
    ...overrides,
  } as CompleteBusinessProfile;
}

afterEach(() => {
  cleanup();
});

describe('ProfileHeader', () => {
  it('serves a resized cover as the only priority LCP image', () => {
    render(
      <ProfileHeader
        businessProfile={profile()}
        editMode="view"
        onSave={noopSave}
        onCancel={() => {}}
        isPublic
      />
    );

    const images = Array.from(document.querySelectorAll('img'));
    const cover = images.find(img =>
      img.getAttribute('src')?.includes('cover.jpg')
    );
    const logo = images.find(img =>
      img.getAttribute('src')?.includes('logo.jpg')
    );

    expect(cover?.getAttribute('src')).toContain('/storage/v1/render/image/');
    expect(cover?.getAttribute('src')).toContain('width=1080');
    expect(cover?.getAttribute('loading')).toBe('eager');
    expect(logo?.getAttribute('loading')).toBe('lazy');
  });

  it('prioritizes the logo when there is no cover', () => {
    render(
      <ProfileHeader
        businessProfile={profile({ cover_image_url: null })}
        editMode="view"
        onSave={noopSave}
        onCancel={() => {}}
        isPublic
      />
    );

    const logo = document.querySelector('img[src*="logo.jpg"]');
    expect(logo?.getAttribute('src')).toContain('width=256');
    expect(logo?.getAttribute('loading')).toBe('eager');
  });
});
