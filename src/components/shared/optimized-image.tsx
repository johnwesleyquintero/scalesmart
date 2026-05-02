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
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  fill,
  unoptimized,
  placeholder,
  ...props
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Auto-detect SVGs to bypass optimization
  const isSvg = typeof src === 'string' && src.toLowerCase().endsWith('.svg');
  const shouldBypassOptimization = unoptimized || isSvg;

  useEffect(() => {
    setError(false);
    setIsLoaded(false);
  }, [src]);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800',
        fill ? 'h-full w-full' : '',
        className,
      )}
      style={{
        aspectRatio: !fill && width && height ? `${width}/${height}` : 'auto',
      }}
    >
      <Image
        src={error ? fallback : src}
        alt={alt}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        fill={fill}
        unoptimized={shouldBypassOptimization}
        className={cn(
          'transition-all duration-500 ease-in-out',
          fill ? 'object-cover' : '',
          // Disable blur for SVGs as they don't support traditional blur placeholders well
          isLoaded || isSvg ? 'opacity-100 blur-0' : 'opacity-0 blur-lg',
          error ? 'opacity-50' : '',
        )}
        sizes={sizes}
        priority={priority}
        onError={() => setError(true)}
        onLoadingComplete={() => setIsLoaded(true)}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        placeholder={isSvg ? undefined : placeholder}
        {...props}
      />
    </div>
  );
}
