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
  const { academyData, saveData, markModuleProgress, getModuleProgress } =
    useAcademyStorage();

  // Derive courses directly from academyData
  const courses = academyData?.courses || [];

  const startModule = async (module: Module) => {
    if (!activeCourse) return;

    await markModuleProgress(activeCourse.id, module.id, 100);
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
