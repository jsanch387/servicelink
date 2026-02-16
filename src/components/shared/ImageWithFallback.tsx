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
  priority?: boolean;
  onLoad?: () => void;
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
  onLoad,
}) => {
  // Handle empty string or null/undefined src by using fallback immediately
  const fallbackSrc = DATA_SVG(
    fallbackSize.w,
    fallbackSize.h,
    fallbackLabel || alt || 'Image'
  );
  const [imageSrc, setImageSrc] = React.useState(
    src && src.trim() !== '' ? src : fallbackSrc
  );

  const handleError = () => {
    setImageSrc(fallbackSrc);
  };

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
      onError={handleError}
      onLoad={onLoad}
    />
  );
};
