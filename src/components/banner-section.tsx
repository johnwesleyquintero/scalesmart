import React from 'react';
import Image from 'next/image';

export default function BannerSection() {
  return (
    <div className="w-full py-12 md:py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="group relative h-[300px] md:h-[450px] w-full overflow-hidden rounded-[2rem] border bg-background/50 shadow-2xl backdrop-blur-sm">
          {/* Animated Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-500" />

          {/* Main Image with Parallax-like effect (via group-hover) */}
          <div className="relative h-full w-full overflow-hidden">
            <Image
              src="/images/agency-assets/images/banner.png"
              alt="ScaleSmart Systems Banner"
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              priority
            />

            {/* "Scanning" Light Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
              <div className="absolute top-0 -left-[100%] h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-[shimmer_2s_infinite]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
