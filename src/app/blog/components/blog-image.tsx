'use client';

import OptimizedImage from '@/components/shared/optimized-image';

interface Props {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function BlogImage({
  src,
  alt,
  width,
  height,
  className,
}: Readonly<Props>) {
  if (!width || !height) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className || 'rounded-lg w-full h-auto'}
        loading="lazy"
      />
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
    />
  );
}
