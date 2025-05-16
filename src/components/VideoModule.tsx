import React from 'react';
import ReactPlayer from 'react-player';
import { useAcademy } from '@/context/AcademyContext';

const VideoModule = () => {
  const { activeModule } = useAcademy();

  return (
    <div>
      {activeModule?.videoUrl ? (
        <ReactPlayer
          url={activeModule.videoUrl}
          controls
          width="100%"
          height="auto"
        />
      ) : (
        <p>No video URL provided.</p>
      )}
    </div>
  );
};

export default VideoModule;
