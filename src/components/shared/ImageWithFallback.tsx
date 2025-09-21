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
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackLabel?: string;
  fallbackSize?: { w: number; h: number };
  priority?: boolean;
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
}) => {
  const [imageSrc, setImageSrc] = React.useState(src);

  const handleError = () => {
    setImageSrc(
      DATA_SVG(fallbackSize.w, fallbackSize.h, fallbackLabel || alt || 'Image')
    );
  };

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onError={handleError}
    />
  );
};
