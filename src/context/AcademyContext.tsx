import { QuizResult } from '@/lib/types';
import { Course, Module } from '@/types';
import React, { createContext, Dispatch, useContext, useState } from 'react';
import useAcademyStorage from '../hooks/use-academy-storage';
type AcademyContextType = {
  activeCourse: Course | null;
  setActiveCourse: Dispatch<React.SetStateAction<Course | null>>;
  activeModule: Module | null;
  setActiveModule: Dispatch<React.SetStateAction<Module | null>>;
  courses: Course[];
  setCourses: Dispatch<React.SetStateAction<Course[]>>;
  startModule: (module: Module) => void;
  academyData: { courses: Course[]; quizResults?: QuizResult[] | undefined };
  saveData: (data: { courses: Course[]; quizResults?: QuizResult[] }) => void;
};

const AcademyContext = createContext<AcademyContextType | undefined>(undefined);

type AcademyProviderProps = {
  children: React.ReactNode;
  initialCourses: Course[];
};

export const AcademyProvider: React.FC<AcademyProviderProps> = ({
  children,
  initialCourses,
}) => {
  console.log('AcademyProvider - Running');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const { academyData, saveData } = useAcademyStorage();
  const [courses, setCourses] = useState<Course[]>(initialCourses);

  const startModule = (module: Module) => {
    const updatedCourses = courses.map((course: Course) => {
      if (course.id === activeCourse?.id) {
        const updatedModules = course.modules.map((m: Module) => {
          if (m.id === module.id) {
            return { ...m, completed: true };
          }
          return m;
        });
        return { ...course, modules: updatedModules };
      }
      return course;
    });

    saveData({ ...academyData, courses: updatedCourses });
    setCourses(updatedCourses);
    setActiveModule(module);
  };

  const value: AcademyContextType = {
    activeCourse,
    setActiveCourse,
    activeModule,
    setActiveModule,
    courses,
    setCourses,
    startModule,
    academyData,
    saveData,
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
