'use client';

import Image from 'next/image';

interface Props {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export default function BlogImage({
  src,
  alt,
  width,
  height,
  className,
}: Readonly<Props>) {
  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      width={width || 200}
      height={height || 200}
    />
  );
}
