'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Award,
  BarChart2,
  BookOpen,
  Check,
  ExternalLink,
  Lock,
  Play,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const moduleItemStyle = 'text-secondary-foreground';

const ACADEMY_ACTIVE_COURSE_ID_KEY = 'academyActiveCourseId_v1';
const ACADEMY_ACTIVE_MODULE_ID_KEY = 'academyActiveModuleId_v1';
// Future key for progress: const ACADEMY_COURSES_PROGRESS_KEY = 'academyCoursesProgress_v1';

type Course = {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  progress: number; // This will be managed by localStorage in a future step if needed
  modules: Module[];
  locked: boolean;
  category: 'PPC' | 'SEO' | 'Strategy';
};

type Module = {
  id: string;
  title: string;
  duration: string;
  completed: boolean; // This will be managed by localStorage in a future step if needed
  type: 'video' | 'article' | 'quiz';
  contentSlug?: string; // Changed from articleContent to contentSlug
};

export default function SchoolComponent() {
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  // 1. Fetch courses from API
  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await fetch('/api/academy-courses');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setCourses(data);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      }
    }

    fetchCourses();
  }, []);

  // 2. Restore active course and module from localStorage
  useEffect(() => {
    if (courses.length === 0 || typeof window === 'undefined') return;

    const restoreFromStorage = () => {
      const storedCourseId = localStorage.getItem(ACADEMY_ACTIVE_COURSE_ID_KEY);
      if (!storedCourseId) return;

      const foundCourse = courses.find((c) => c.id === storedCourseId);
      if (!foundCourse) {
        localStorage.removeItem(ACADEMY_ACTIVE_COURSE_ID_KEY);
        localStorage.removeItem(ACADEMY_ACTIVE_MODULE_ID_KEY);
        return;
      }

      setActiveCourse(foundCourse);

      const storedModuleId = localStorage.getItem(ACADEMY_ACTIVE_MODULE_ID_KEY);
      if (!storedModuleId || !foundCourse.modules) return;

      const foundModule = foundCourse.modules.find(
        (m) => m.id === storedModuleId,
      );
      if (foundModule) {
        setActiveModule(foundModule);
      } else {
        localStorage.removeItem(ACADEMY_ACTIVE_MODULE_ID_KEY);
      }
    };

    restoreFromStorage();
  }, [courses]);

  // 3. Save active course ID to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      activeCourse
        ? localStorage.setItem(ACADEMY_ACTIVE_COURSE_ID_KEY, activeCourse.id)
        : localStorage.removeItem(ACADEMY_ACTIVE_COURSE_ID_KEY);
    }
  }, [activeCourse]);

  // 4. Save activeModule.id to localStorage whenever activeModule changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (activeModule) {
        localStorage.setItem(ACADEMY_ACTIVE_MODULE_ID_KEY, activeModule.id);
      } else if (localStorage.getItem(ACADEMY_ACTIVE_COURSE_ID_KEY)) {
        // Only remove module ID if there's an active course context
        // If activeCourse is null, the previous useEffect handles clearing this.
        localStorage.removeItem(ACADEMY_ACTIVE_MODULE_ID_KEY);
      }
    }
  }, [activeModule]);

  const startCourse = (course: Course) => {
    setActiveCourse(course);
    setActiveModule(null);
  };

  const startModule = (module: Module) => {
    setActiveModule(module);
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Page Title Section */}
      <div className="text-center mb-8">
        {/* Optional: remove mb-8 if my-6 on h1 is sufficient */}{' '}
        {/* Removed extra space */}
        <h1 className="text-3xl font-bold my-6">Amazon Seller Academy</h1>
        <p className="text-lg text-muted-foreground">
          Master Amazon PPC, SEO, and sales strategies with our comprehensive
          courses
        </p>
      </div>
      {/* Module Content or Quiz */}
      {!activeCourse ? (
        <CourseList courses={courses} startCourse={startCourse} />
      ) : (
        <ActiveCourseDisplay
          activeCourse={activeCourse}
          setActiveCourse={setActiveCourse}
          activeModule={activeModule}
          startModule={startModule}
        />
      )}
    </div>
  );
}

const CourseList = ({
  courses,
  startCourse,
}: {
  courses: Course[];
  startCourse: (course: Course) => void;
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {courses.map((course) => (
        <Card key={course.id} className={course.locked ? 'opacity-75' : ''}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription className="mt-1">
                  {course.description}
                </CardDescription>
              </div>
              {course.locked && <Lock className="h-5 w-5 text-yellow-500" />}
            </div>
          </CardHeader>
          <div className="p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                {course.duration}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  course.level === 'Beginner'
                    ? moduleItemStyle
                    : course.level === 'Intermediate'
                      ? moduleItemStyle
                      : moduleItemStyle
                }`}
              >
                {course.level}
              </span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{course.progress}%</span>
              </div>
              <Progress value={course.progress} className="h-2" />
            </div>
          </div>
          <CardFooter>
            <Button
              onClick={() => startCourse(course)}
              disabled={course.locked}
              className="w-full"
            >
              {course.locked ? 'Coming Soon' : 'Start Course'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

const ActiveCourseDisplay = ({
  activeCourse,
  setActiveCourse,
  activeModule,
  startModule,
}: {
  startModule: (module: Module) => void;
  activeCourse: Course;
  setActiveCourse: (course: null) => void;
  activeModule: Module | null;
}) => {
  return (
    <div className="space-y-6">
      {/* Course Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{activeCourse.title}</CardTitle>
              <CardDescription>{activeCourse.description}</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setActiveCourse(null)}>
              Back to Courses
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>Course Progress</span>
                <span>{activeCourse.progress}%</span>
              </div>
              <Progress value={activeCourse.progress} className="h-2" />
            </div>
            {activeCourse.progress === 100 && (
              <Button variant="secondary">
                <Award className="h-4 w-4 mr-2" />
                Get Certificate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Module Content or Quiz */}
      {!activeModule ? (
        <Card>
          <CardHeader>
            <CardTitle>Course Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeCourse.modules.map((module) => (
                <ModuleItem
                  key={module.id}
                  module={module}
                  startModule={startModule}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{activeModule.title}</CardTitle>
            <CardDescription>
              {activeModule.duration} •{' '}
              {activeModule.type.charAt(0).toUpperCase() +
                activeModule.type.slice(1)}{' '}
              Content
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeModule.type === 'quiz' ? (
              <div className="space-y-4">
                <p>This module contains a quiz to test your knowledge.</p>
                <Button onClick={() => console.log('Quiz started')}>
                  Start Quiz
                </Button>
              </div>
            ) : activeModule.type === 'article' && activeModule.contentSlug ? (
              <div className="space-y-4">
                <p>
                  This module is an article. Please review the content by
                  clicking the link below. It will open in a new tab.
                </p>
                <Button asChild variant="outline">
                  <a
                    href={`/blog/${activeModule.contentSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Article <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            ) : activeModule.type === 'video' && activeModule.contentSlug ? (
              <div className="space-y-4">
                <p>
                  This module is a video. Please watch it below or open it in a
                  new tab.
                </p>
                {(() => {
                  const videoId = getYouTubeVideoId(activeModule.contentSlug!);
                  if (videoId) {
                    return (
                      <div className="aspect-video w-full max-w-2xl mx-auto bg-muted rounded-lg overflow-hidden">
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        ></iframe>
                      </div>
                    );
                  }
                  return (
                    <Button asChild variant="outline">
                      <a
                        href={activeModule.contentSlug}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open Video <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  );
                })()}
              </div>
            ) : (
              <p>Content for this module is not yet available.</p>
            )}
          </CardContent>
          {!activeModule.completed && (
            <CardFooter>
              <Button
                onClick={() =>
                  console.log(`Completing module ${activeModule.id}`)
                }
                className="w-full"
              >
                Mark as Completed
              </Button>
            </CardFooter>
          )}
        </Card>
      )}

      {/* Quiz Results */}
    </div>
  );
};

// Helper function to extract YouTube Video ID from URL
function getYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

const ModuleItem = ({
  module,
  startModule,
}: {
  module: Module;
  startModule: (module: Module) => void;
}) => {
  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-5 w-5" />;
      case 'article':
        return <BookOpen className="h-5 w-5" />;
      case 'quiz':
        return <BarChart2 className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`p-4 border rounded-lg flex justify-between items-center ${
        module.completed
          ? 'border-secondary border-2 text-secondary-foreground'
          : 'border-gray-200'
      }`}
      onClick={() => startModule(module)}
    >
      <div className="flex items-center space-x-4">
        <div
          className={`p-2 rounded-full ${
            module.completed
              ? moduleItemStyle
              : module.type === 'video'
                ? moduleItemStyle
                : module.type === 'article'
                  ? moduleItemStyle
                  : moduleItemStyle
          }`}
        >
          {getModuleIcon(module.type)}
        </div>
        <div>
          <h3 className="font-medium">{module.title}</h3>
          <p className="text-sm text-muted-foreground">
            {module.duration} • {module.type}
          </p>
        </div>
      </div>
      {module.completed ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Completed
        </>
      ) : (
        <span>Start</span>
      )}
    </div>
  );
};
