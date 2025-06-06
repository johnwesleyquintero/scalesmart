'use client';
import { Course, Module, QuizResult } from '@/types';
import React, { createContext, Dispatch, useContext, useState } from 'react';
import useAcademyStorage from '../hooks/use-academy-storage';

export type AcademyContextType = {
  activeCourse: Course | null;
  setActiveCourse: Dispatch<React.SetStateAction<Course | null>>;
  activeModule: Module | null;
  setActiveModule: Dispatch<React.SetStateAction<Module | null>>;
  courses: Course[];
  startModule: (module: Module) => void;
  academyData: { courses: Course[] };
  saveData: (data: { courses: Course[] }) => void;
  startCourseAction: (course: Course) => void;
  updateModuleProgress: (
    courseId: string,
    moduleId: string,
    progress: number,
  ) => Promise<void>;
  getModuleProgress: (moduleId: string) => number;
  updateQuizResult: (
    courseId: string,
    moduleId: string,
    result: QuizResult,
  ) => Promise<void>;
  getQuizResult: (moduleId: string) => QuizResult | undefined;
  markCourseVisited: (courseId: string) => void;
};

export const AcademyContext = createContext<AcademyContextType | undefined>(
  undefined,
);

type AcademyProviderProps = {
  children: React.ReactNode;
};

export const AcademyProvider: React.FC<AcademyProviderProps> = ({
  children,
}) => {
  console.log('AcademyProvider - Running');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  // Destructure all relevant functions and data from useAcademyStorage for comprehensive context management.
  const {
    academyData,
    saveData,
    updateModuleProgress, // Corrected from markModuleProgress
    getModuleProgress,
    updateQuizResult,
    getQuizResult,
    markCourseVisited,
  } = useAcademyStorage();

  // Derive courses directly from academyData for a single source of truth.
  const courses = academyData?.courses || [];

  /**
   * Initiates a module, marking its progress.
   * @param module The module to start.
   */
  const startModule = async (module: Module) => {
    if (!activeCourse) {
      // Log an error if no active course is found, which is crucial for debugging.
      console.error('startModule: No active course found.');
      return;
    }

    // Use updateModuleProgress as defined in useAcademyStorage.
    // This fixes the original typo and ensures correct function call.
    await updateModuleProgress(activeCourse.id, module.id, 100);
    setActiveModule(module);
  };

  const startCourseAction = (course: Course) => {
    console.log('Starting course:', course.title);
    setActiveCourse(course);
    if (course.modules && course.modules.length > 0) {
      setActiveModule(course.modules[0]);
    } else {
      setActiveModule(null);
    }
  };

  const value: AcademyContextType = {
    activeCourse,
    setActiveCourse,
    activeModule,
    setActiveModule,
    courses,
    startModule,
    academyData: { courses: academyData?.courses || [] },
    saveData: (data) => saveData(data),
    startCourseAction,
    updateModuleProgress, // Expose updateModuleProgress for context consumers.
    getModuleProgress, // Expose getModuleProgress for context consumers.
    updateQuizResult, // Expose updateQuizResult for context consumers.
    getQuizResult, // Expose getQuizResult for context consumers.
    markCourseVisited, // Expose markCourseVisited for context consumers.
  };

  return (
    <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>
  );
};

export const useAcademy = () => {
  const context = useContext(AcademyContext);
  if (!context) {
    throw new Error('useAcademy must be used within an AcademyProvider');
  }
  return context;
};
