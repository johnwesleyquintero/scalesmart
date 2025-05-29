'use client';

import React from 'react';
import Quiz from '../app/academy/components/Quiz';
import ExerciseModule from './ExerciseModule';

// Define custom components to be used within MDX
export const components = {
  Quiz: Quiz,
  ExerciseModule: ExerciseModule,
  // Add any other custom components you want to use in your MDX files
};

// This component is now just a placeholder for the components object
// The actual rendering will be done by MDXRemote in ArticleModule
const MdxRenderer = () => {
  return null; // This component doesn't render anything directly
};
