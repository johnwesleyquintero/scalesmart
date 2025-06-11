import React, { useCallback } from 'react';
import { useAcademy } from '@/context/AcademyContext';
import VideoPlayer from './VideoPlayer'; // Import the new VideoPlayer component

const VideoModule = () => {
  const { activeModule, activeCourse, updateModuleProgress } = useAcademy();

  const handleProgress = useCallback(
    (progress: number) => {
      if (activeCourse && activeModule) {
        updateModuleProgress(activeCourse.id, activeModule.id, progress);
      }
    },
    [activeCourse, activeModule, updateModuleProgress],
  );

  const handleEnded = useCallback(() => {
    if (activeCourse && activeModule) {
      updateModuleProgress(activeCourse.id, activeModule.id, 100); // Mark as 100% complete on end
    }
  }, [activeCourse, activeModule, updateModuleProgress]);

  return (
    <div>
      {activeModule?.videoUrl ? (
        <VideoPlayer
          src={activeModule.videoUrl}
          onProgress={handleProgress}
          onEnded={handleEnded}
        />
      ) : (
        <p>No video URL provided.</p>
      )}
    </div>
  );
};

export default VideoModule;
