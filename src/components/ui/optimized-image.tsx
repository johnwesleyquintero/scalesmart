'use client';

import Image, { ImageProps } from 'next/image';
import { useEffect, useState } from 'react';

interface OptimizedImageProps
  extends Omit<ImageProps, 'onLoadingComplete' | 'blurDataURL'> {
  readonly fallbackSrc?: string;
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/default-fallback.svg',
  priority = false,
  loading = 'lazy',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  className,
  ...props
}: OptimizedImageProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setError(!src);
    }
  }, [src]);

  return (
    <Image
      src={error ? fallbackSrc : src}
      alt={alt}
      priority={priority}
      loading={loading}
      sizes={sizes}
      className={className}
      placeholder="blur"
      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMSAxIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMWYxIi8+PC9zdmc+"
      {...props}
    />
  );
}
