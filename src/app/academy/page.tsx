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
import { Award, BarChart2, BookOpen, Check, Lock, Play } from 'lucide-react';
import { useEffect, useState } from 'react';

const moduleItemStyle = 'text-secondary-foreground';

type Course = {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  progress: number;
  modules: Module[];
  locked: boolean;
  category: 'PPC' | 'SEO' | 'Strategy';
};

type Module = {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  type: 'video' | 'article' | 'quiz';
  contentSlug?: string; // Changed from articleContent to contentSlug
};

export default function SchoolComponent() {
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeModule, setActiveModule] = useState<Module | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);

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
        <div>
          {activeModule.type === 'quiz' ? (
            'Quiz Component'
          ) : (
            <a href={`/blog/${activeModule.contentSlug}`}>
              Learning Module: {activeModule.title}
            </a>
          )}
        </div>
      )}

      {/* Quiz Results */}
    </div>
  );
};

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
