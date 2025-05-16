import { Module } from '@/lib/types';
import React from 'react';

interface ActiveCourseDisplayProps {
  moduleTypeMap: {
    [key: string]: () => React.ReactNode;
  };
  activeModule: Module | undefined;
  // Add other props as needed, e.g., course data
}

const ActiveCourseDisplay: React.FC<ActiveCourseDisplayProps> = ({
  moduleTypeMap,
  activeModule,
}) => {
  // Placeholder implementation - replace with actual logic
  if (!activeModule || !moduleTypeMap[activeModule?.type]) {
    return <p>No content to display</p>;
  }

  return <div>{moduleTypeMap[activeModule?.type]()}</div>;
};

export default ActiveCourseDisplay;
