import { describe, expect, it } from 'vitest';
import {
  buildPublicGalleryImages,
  resolveGallerySourceUrl,
} from '../utils/galleryImageUrl';

describe('galleryImageUrl', () => {
  it('prefers blob and data preview URLs over storage paths', () => {
    expect(
      resolveGallerySourceUrl({
        storage_path: 'businesses/1/work.jpg',
        preview_url: 'blob:http://localhost/1',
      })
    ).toBe('blob:http://localhost/1');
  });

  it('builds gallery entries with resized hero and thumb URLs', () => {
    const images = buildPublicGalleryImages(
      [{ id: 'a', storage_path: 'businesses/1/work.jpg' }],
      'Gallery photo'
    );

    expect(images).toHaveLength(1);
    expect(images[0]?.id).toBe('a');
    expect(images[0]?.alt).toBe('Gallery photo 1');
    expect(images[0]?.fullSrc).toContain(
      '/storage/v1/object/public/business_images/businesses/1/work.jpg'
    );
    expect(images[0]?.thumbSrc).toContain('width=720');
    expect(images[0]?.heroSrc).toContain('width=1200');
  });
});
