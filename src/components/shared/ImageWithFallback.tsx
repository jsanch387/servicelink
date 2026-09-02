import Image from 'next/image';
import React from 'react';

// Inline SVG fallback (always renders, no network needed)
const DATA_SVG = (w = 600, h = 400, label = 'Image') =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <rect width="100%" height="100%" fill="#262626"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
            fill="#a3a3a3" font-family="Arial, Helvetica, sans-serif" font-size="${Math.floor(
              Math.min(w, h) / 10
            )}">
        ${label}
      </text>
    </svg>
  `);

interface ImageWithFallbackProps {
  src: string | undefined;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackLabel?: string;
  fallbackSize?: { w: number; h: number };
  /** LCP images (e.g. cover, logo) should use priority for faster load. */
  priority?: boolean;
  /** Responsive size hint for layout; e.g. "(max-width: 768px) 100vw, 1200px". */
  sizes?: string;
  onLoad?: () => void;
  /**
   * Called when the current `src` fails. If provided, the SVG fallback is
   * skipped so the parent can swap in another URL.
   */
  onError?: () => void;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  width,
  height,
  className,
  fallbackLabel,
  fallbackSize = { w: 600, h: 400 },
  priority = false,
  sizes,
  onLoad,
  onError,
}) => {
  const fallbackSrc = React.useMemo(
    () =>
      DATA_SVG(fallbackSize.w, fallbackSize.h, fallbackLabel || alt || 'Image'),
    [fallbackSize.w, fallbackSize.h, fallbackLabel, alt]
  );
  const resolvedSrc = src && src.trim() !== '' ? src : fallbackSrc;
  const [imageSrc, setImageSrc] = React.useState(resolvedSrc);

  React.useEffect(() => {
    setImageSrc(resolvedSrc);
  }, [resolvedSrc]);

  const handleError = () => {
    if (onError) {
      onError();
      return;
    }
    setImageSrc(fallbackSrc);
  };

  // External URLs (e.g. Supabase): load directly to avoid Vercel Image Optimization (402).
  const isExternal =
    imageSrc.startsWith('http://') || imageSrc.startsWith('https://');

  // If src is empty or null, use fallback immediately
  if (!src || src.trim() === '') {
    return (
      <Image
        src={fallbackSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        onLoad={onLoad}
      />
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'auto' : 'async'}
      sizes={sizes}
      unoptimized={isExternal}
      onError={handleError}
      onLoad={onLoad}
    />
  );
};
