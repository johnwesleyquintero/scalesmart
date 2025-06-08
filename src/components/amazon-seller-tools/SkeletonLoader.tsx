import React from 'react';

const SkeletonLoader = () => {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 h-4 rounded-md w-3/4 mb-2"></div>
      <div className="bg-gray-200 h-4 rounded-md w-1/2 mb-2"></div>
      <div className="bg-gray-200 h-4 rounded-md w-1/4"></div>
    </div>
  );
};

export default SkeletonLoader;
