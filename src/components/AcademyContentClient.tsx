'use client';

import { useAcademy } from '@/context/AcademyContext';
import { Button } from '@/components/ui/button';
import useUserProfile from '@/hooks/use-user-profile';
import { getRecommendedCourses } from '@/lib/course-recommendations';
import { Module, ModuleType, Course } from '@/types';
import useAcademyStorage from '@/hooks/use-academy-storage'; // Import the hook

import { useEffect, useState } from 'react';
import ArticleModule from './ArticleModule';
import VideoModule from './VideoModule';
import ExerciseModule from './ExerciseModule';
import CaseStudyModule from './CaseStudyModule';
import Quiz from './Quiz';
import ClientCourseList from '@/app/academy/ClientCourseList';

interface AcademyContentProps {
  courses: Course[];
  filter: string;
  sort: string;
}

interface ModuleSpecificContentProps {
  activeModule: Module;
}

const ModuleSpecificContent: React.FC<ModuleSpecificContentProps> = ({
  activeModule,
}) => {
  const { activeCourse } = useAcademy();

  const sampleQuestions = [
    {
      id: 1,
      text: 'What is Amazon Brand Registry?',
      options: [
        'A program to protect your brand on Amazon',
        'A tool for keyword research',
        'A service for managing inventory',
        'A way to get free advertising',
      ],
      correctAnswer: 'A program to protect your brand on Amazon',
      explanation:
        'Amazon Brand Registry helps you protect your trademarks and intellectual property on Amazon.',
    },
    {
      id: 2,
      text: 'What is product validation?',
      options: [
        'Ensuring your product meets safety standards',
        'Confirming there is demand for your product',
        'Checking for patent infringements',
        'Calculating your profit margin',
      ],
      correctAnswer: 'Confirming there is demand for your product',
      explanation:
        'Product validation involves researching and confirming that there is sufficient customer demand for your product before investing in inventory.',
    },
  ];

  switch (activeModule.type) {
    case ModuleType.ARTICLE:
      return activeModule.contentSlug ? (
        <ArticleModule contentSlug={activeModule.contentSlug} />
      ) : (
        <p>No content available for this module.</p>
      );
    case ModuleType.VIDEO:
      return <VideoModule />;
    case ModuleType.EXERCISE:
      return activeModule.exercise ? (
        <ExerciseModule
          exercise={activeModule.exercise}
          userId={useUserProfile().userProfile?.id || 'defaultUserId'}
          courseId={activeCourse?.id || 'defaultCourseId'}
          moduleId={activeModule.id || 'defaultModuleId'}
        />
      ) : (
        <p>No exercise content available for this module.</p>
      );
    case ModuleType.CASE_STUDY:
      return <CaseStudyModule />;
    case ModuleType.QUIZ:
      return <Quiz questions={sampleQuestions} moduleId={activeModule.id} />;
    case ModuleType.SIMULATION:
      return <p>Simulation Content Here for {activeModule.title}</p>; // Placeholder for Simulation component
    default:
      return <p>Unknown Module Type: {activeModule.type}</p>;
  }
};

function AcademyContentClient({
  courses: allCourses,
  filter,
  sort,
}: AcademyContentProps) {
  const { activeCourse, setActiveCourse, setActiveModule, activeModule } =
    useAcademy();
  const { userProfile } = useUserProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const { academyData, markModuleVisited } = useAcademyStorage();
  const completedCourseIds = Object.keys(academyData?.moduleProgress || {});

  useEffect(() => {
    if (userProfile) {
      getRecommendedCourses(userProfile, completedCourseIds).then(
        (recommended) => {
          setRecommendedCourses(recommended as Course[]);
        },
      );
    }
  }, [userProfile, completedCourseIds]);

  useEffect(() => {
    if (activeCourse && activeModule) {
      markModuleVisited(activeModule.id); // Mark module as visited
    }
  }, [activeCourse, activeModule, markModuleVisited]);

  const startCourse = (selectedCourse: Course) => {
    setActiveCourse(selectedCourse);
    if (selectedCourse.modules && selectedCourse.modules.length > 0) {
      setActiveModule(selectedCourse.modules[0]);
    }
  };

  const handleSelectModule = (module: Module) => {
    setActiveModule(module);
  };

  const handleBackToCourses = () => {
    setActiveCourse(null);
    setActiveModule(null);
  };

  // Filter out duplicate courses based on slug
  const courses = allCourses.filter(
    (course: Course, index, self) =>
      course.slug && index === self.findIndex((t) => t.slug === course.slug),
  );

  return (
    <div className="w-full p-4 bg-gray-100 rounded-lg shadow-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold my-6">ScaleSmart Academy</h1>
        <p className="text-lg text-muted-foreground">
          Master Amazon PPC, SEO, and sales strategies with our comprehensive
          courses
        </p>
      </div>

      {!activeCourse ? (
        <>
          <input
            type="text"
            placeholder="Search courses..."
            className="w-full p-2 mb-4 border rounded"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <ClientCourseList
            courses={courses
              .filter((course) =>
                course.title
                  ?.toLowerCase()
                  ?.includes(searchQuery.toLowerCase()),
              )
              .filter((course) =>
                recommendedCourses.length > 0
                  ? !recommendedCourses.find(
                      (recommendedCourse) =>
                        course.slug === recommendedCourse.slug,
                    )
                  : true,
              )
            }
            filter={filter}
            sort={sort}
          />
        </>
      ) : (
        <>
          <div>
            <Button onClick={handleBackToCourses}
              variant="outline"
              className="mb-4"
              aria-label="Back to Courses"
            >
              &larr; Back to Courses
            </Button>
            <h2 className="text-2xl font-bold mb-2">{activeCourse.title}</h2>
            <p className="text-sm text-gray-600 mb-4">
              Overall Progress: {activeCourse.progress || 0}%
            </p>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/4 bg-white p-4 rounded shadow-lg">
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">
                  Modules
                </h3>
                {activeCourse.modules && activeCourse.modules.length > 0 ? (
                  <ol className="list-decimal space-y-1 max-h-60 overflow-y-auto">
                    {activeCourse.modules.map((module) => (
                      <li key={module.id}>
                        <button
                          onClick={() => handleSelectModule(module)}
                          className={`w-full text-left p-2.5 rounded-md hover:bg-gray-100 transition-colors duration-150 flex justify-between items-center text-sm ${
                            activeModule?.id === module.id
                              ? 'bg-blue-100 text-blue-700 font-medium ring-1 ring-blue-300'
                              : 'text-gray-700'
                          }`}
                          aria-label={`Select module ${module.title}`}
                          title={module.title || `Module ${module.id}`}
                        >
                          <span>{module.title || `Module ${module.id}`}</span>
                          {academyData?.moduleProgress?.[module.id] && (
                            <span className="text-green-500 text-xs font-medium ml-2">
                              ✓
                            </span>
                          )}
                          <progress
                            value={
                              academyData?.moduleProgress?.[module.id] ? 100 : 0
                            }
                            max="100"
                          ></progress>
                        </button>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-gray-500">
                    No modules available for this course.
                  </p>
                )}
              </div>
              <div className="w-full md:w-3/4 bg-white p-6 rounded shadow-lg min-h-[300px]">
                {activeModule ? (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 pb-2 border-b">
                      {activeModule.title || `Module ${activeModule.id}`}
                    </h3>
                    <ModuleSpecificContent activeModule={activeModule} />
                  </div>
                ) : (
                  <p className="text-center text-gray-500 pt-16">
                    Select a module from the list to view its content.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export { AcademyContentClient };
