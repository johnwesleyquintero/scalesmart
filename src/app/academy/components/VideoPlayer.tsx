'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface VideoPlayerProps {
  src: string;
  onProgress: (progress: number) => void; // progress in percentage (0-100)
  onEnded: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  onProgress,
  onEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const { currentTime, duration } = videoRef.current;
      if (duration > 0) {
        const progress = (currentTime / duration) * 100;
        onProgress(progress);
      }
    }
  }, [onProgress]);

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('ended', onEnded);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('ended', onEnded);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
      };
    }
  }, [handleTimeUpdate, onEnded, handlePlay, handlePause]);

  return (
    <div className="w-full">
      <video
        ref={videoRef}
        src={src}
        controls
        className="w-full h-auto rounded-lg shadow-lg"
        onContextMenu={(e) => e.preventDefault()} // Prevent right-click context menu
        controlsList="nodownload"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;
