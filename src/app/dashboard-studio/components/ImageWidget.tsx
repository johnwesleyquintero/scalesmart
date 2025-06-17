import React from 'react';
import Image from 'next/image';

interface ImageWidgetProps {
  id: string;
  imageUrl: string;
  altText?: string;
}

const ImageWidget: React.FC<ImageWidgetProps> = ({
  id,
  imageUrl,
  altText = 'Dashboard Image',
}) => {
  return (
    <div className="p-4 border rounded shadow flex justify-center items-center relative w-full h-full overflow-hidden">
      {' '}
      {/* Added relative, w-full, h-full, overflow-hidden for responsive image */}
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={altText}
          fill // Use fill instead of fixed width/height for responsiveness
          style={{ objectFit: 'contain' }} // Use style prop for objectFit with fill
        />
      ) : (
        <p>No image URL provided.</p>
      )}
    </div>
  );
};

export default ImageWidget;
