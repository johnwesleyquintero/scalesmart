'use client';

import { Course, Module, ModuleType } from '@/types';
import { Award, BookOpen, Check, Lock } from 'lucide-react';

import AcademyContentClient from '@/components/AcademyContentClient';
import ModuleIcon from '@/components/ModuleIcon';
import styles from '@/components/ModuleItem.module.css';
import Quiz from '@/components/Quiz';
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
import { AcademyProvider, useAcademy } from '@/context/AcademyContext';

const moduleItemStyle = 'text-secondary-foreground';

import { useEffect, useState } from 'react';

export default function SchoolComponent() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(`/api/academy-courses`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setCourses(data);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      }
    };

    fetchCourses();
  }, []);

  return (
    <AcademyProvider initialCourses={courses}>
      <AcademyContentClient
        courses={courses}
        CourseList={CourseList}
        ActiveCourseDisplay={ActiveCourseDisplay}
      />
    </AcademyProvider>
  );
}

const CourseList = ({
  startCourse,
}: {
  startCourse: (course: Course) => void;
}) => {
  const { courses } = useAcademy();

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

const ActiveCourseDisplay = () => {
  const { activeCourse, setActiveCourse, activeModule } = useAcademy();
  const questions = [
    {
      id: '1',
      text: 'What is Amazon PPC?',
      options: [
        'Pay-Per-Click advertising',
        'Product Placement Cost',
        'Post-Purchase Communication',
      ],
      correctAnswer: 'Pay-Per-Click advertising',
    },
    {
      id: '2',
      text: 'What is SEO?',
      options: [
        'Search Engine Optimization',
        'Sales Enhancement Opportunity',
        'Seller Engagement Overview',
      ],
      correctAnswer: 'Search Engine Optimization',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{activeCourse?.title}</CardTitle>
              <CardDescription>{activeCourse?.description}</CardDescription>
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
                <span>{activeCourse?.progress}%</span>
              </div>
              <Progress value={activeCourse?.progress} className="h-2" />
            </div>
            {activeCourse?.progress === 100 && (
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
              {activeCourse?.modules.map((module: Module) => (
                <ModuleItem key={module.id} module={module} />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          {activeModule.type === ModuleType.QUIZ ? (
            <Quiz questions={questions} />
          ) : (
            <a href={activeModule.link || `/blog/${activeModule.contentSlug}`}>
              Learning Module: {activeModule.title}
            </a>
          )}
        </div>
      )}

      {/* Quiz Results */}
    </div>
  );
};

const ModuleItem = ({ module }: { module: Module }) => {
  const { startModule } = useAcademy();
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
          className={`${styles.moduleIcon} ${
            module.completed ? styles.moduleIconCompleted : ''
          }`}
        >
          <ModuleIcon type={module.type} completed={module.completed} />
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
