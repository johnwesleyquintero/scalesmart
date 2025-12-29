'use client';

import { cn } from '@/lib/utils';
import Image, { ImageProps } from 'next/image';
import { useState, useEffect } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'onError'> {
  fallback?: string;
}

export default function OptimizedImage({
  src,
  alt,
  fallback = '/default-fallback.svg',
  width,
  height,
  className,
  sizes = '(max-width: 480px) 95vw, (max-width: 768px) 90vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
  ...props
}: OptimizedImageProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800',
        className,
      )}
      style={{
        aspectRatio: width && height ? `${width}/${height}` : 'auto',
      }}
    >
      <Image
        src={error ? fallback : src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          'transition-all duration-300 ease-in-out',
          error ? 'opacity-50' : 'opacity-100',
        )}
        sizes={sizes}
        priority={priority}
        onError={() => setError(true)}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMSAxIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMWYxIi8+PC9zdmc+"
        {...props}
      />
    </div>
  );
}
