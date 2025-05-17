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

  React.useEffect(() => {
    setCourses(initialCourses);
  }, [initialCourses]);

  const startModule = (module: Module) => {
    if (!activeCourse) return; // Should not happen if a module is being started

    let courseWasUpdated = false;
    const updatedCourses = courses.map((c: Course) => {
      if (c.id === activeCourse.id) {
        let completedModulesCount = 0;
        const updatedModules = c.modules.map((m: Module) => {
          if (m.id === module.id) {
            // Only update if it's not already completed to avoid unnecessary saves
            if (!m.completed) {
              courseWasUpdated = true;
            }
            m = { ...m, completed: true };
          }
          if (m.completed) {
            completedModulesCount++;
          }
          return m;
        });

        const newProgress =
          c.modules.length > 0
            ? Math.round((completedModulesCount / c.modules.length) * 100)
            : 0;
        if (c.progress !== newProgress || courseWasUpdated) {
          // Check if progress actually changed or module was just marked
          courseWasUpdated = true; // Ensure we save if progress changed even if module was already complete
        }
        return { ...c, modules: updatedModules, progress: newProgress };
      }
      return c;
    });

    if (courseWasUpdated) {
      saveData({ ...academyData, courses: updatedCourses });
      setCourses(updatedCourses);
      // Ensure activeCourse state is updated to the instance from the new courses array
      const currentlyActiveCourseFromUpdatedList = updatedCourses.find(
        (uc) => uc.id === activeCourse.id,
      );
      if (currentlyActiveCourseFromUpdatedList) {
        setActiveCourse(currentlyActiveCourseFromUpdatedList);
      }
    }
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
