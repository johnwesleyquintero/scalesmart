import Image from 'next/image';

export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) => (
  <Image
    src={src}
    alt={alt}
    width={width}
    height={height}
    loading="lazy"
    quality={80}
    placeholder="blur"
    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUW0RjgAAAAASUVORK5CYII="
    className="rounded-lg object-cover"
  />
);
