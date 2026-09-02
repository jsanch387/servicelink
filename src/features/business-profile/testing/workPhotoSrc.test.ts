import { describe, expect, it } from 'vitest';
import {
  getWorkPhotoSrc,
  getWorkPhotoThumbSrc,
  stripWorkPhotoCacheBuster,
  toWorkPhotos,
} from '../utils/workPhotoSrc';

describe('getWorkPhotoSrc', () => {
  it('prefers preview_url', () => {
    expect(
      getWorkPhotoSrc({
        preview_url: 'https://cdn.example/work.jpg',
        storage_path: 'ignored.jpg',
      })
    ).toBe('https://cdn.example/work.jpg');
  });

  it('strips numeric cache-busters from preview URLs', () => {
    expect(
      getWorkPhotoSrc({
        preview_url: 'https://cdn.example/work.jpg?v=1788234101381',
      })
    ).toBe('https://cdn.example/work.jpg');
  });

  it('falls back to the public storage path', () => {
    expect(getWorkPhotoSrc({ storage_path: 'biz/1.jpg' })).toBe(
      'https://qailotbnrtwyzhbwufvk.supabase.co/storage/v1/object/public/business_images/biz/1.jpg'
    );
  });

  it('returns empty when both are missing', () => {
    expect(getWorkPhotoSrc({})).toBe('');
  });
});

describe('getWorkPhotoThumbSrc', () => {
  it('converts Supabase object URLs to resized render URLs', () => {
    expect(
      getWorkPhotoThumbSrc(
        'https://qailotbnrtwyzhbwufvk.supabase.co/storage/v1/object/public/business_images/biz/1.jpg?v=99'
      )
    ).toBe(
      'https://qailotbnrtwyzhbwufvk.supabase.co/storage/v1/render/image/public/business_images/biz/1.jpg?width=640&height=640&resize=cover&quality=70'
    );
  });

  it('leaves non-storage URLs unchanged', () => {
    expect(getWorkPhotoThumbSrc('https://cdn.example/a.jpg')).toBe(
      'https://cdn.example/a.jpg'
    );
  });
});

describe('stripWorkPhotoCacheBuster', () => {
  it('removes only the numeric v param', () => {
    expect(
      stripWorkPhotoCacheBuster('https://cdn.example/a.jpg?foo=1&v=12')
    ).toBe('https://cdn.example/a.jpg?foo=1');
  });
});

describe('toWorkPhotos', () => {
  it('maps images and skips empty sources', () => {
    expect(
      toWorkPhotos([
        { id: 'a', preview_url: 'https://cdn.example/a.jpg' },
        { id: 'b', preview_url: '   ' },
        { storage_path: 'c.jpg' },
      ])
    ).toEqual([
      {
        id: 'a',
        src: 'https://cdn.example/a.jpg',
        thumbSrc: 'https://cdn.example/a.jpg',
      },
      {
        id: 'work-2',
        src: 'https://qailotbnrtwyzhbwufvk.supabase.co/storage/v1/object/public/business_images/c.jpg',
        thumbSrc:
          'https://qailotbnrtwyzhbwufvk.supabase.co/storage/v1/render/image/public/business_images/c.jpg?width=640&height=640&resize=cover&quality=70',
      },
    ]);
  });

  it('returns an empty list for missing images', () => {
    expect(toWorkPhotos(undefined)).toEqual([]);
    expect(toWorkPhotos([])).toEqual([]);
  });
});
