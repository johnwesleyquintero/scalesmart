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

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 via-transparent to-transparent" />

            {/* "Scanning" Light Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
              <div className="absolute top-0 -left-[100%] h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-[shimmer_2s_infinite]" />
            </div>

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 p-8 md:p-12">
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                Designed for <span className="text-blue-400">Scale.</span> Built
                for <span className="text-indigo-400">Systems.</span>
              </h2>
              <p className="mt-4 text-lg text-blue-100/80 max-w-xl font-medium">
                Turning operational chaos into clean, repeatable growth through
                advanced automation and digital solutions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
