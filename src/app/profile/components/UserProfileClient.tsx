'use client';

import React, { useEffect, useState } from 'react';
import useUserProfile from '@/hooks/use-user-profile';
import useAcademyStorage from '@/hooks/use-academy-storage';
import { Course } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const UserProfileClient: React.FC = () => {
  const { userProfile } = useUserProfile();
  const { academyData, getModuleProgress } = useAcademyStorage();
  const router = useRouter();

  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    if (academyData?.courses) {
      setEnrolledCourses(academyData.courses);

      // Calculate overall progress across all enrolled courses
      let totalCourseProgress = 0;
      let coursesWithModules = 0;

      academyData.courses.forEach((course) => {
        if (course.modules && course.modules.length > 0) {
          const courseTotalModuleProgress = course.modules.reduce(
            (sum, module) => {
              return sum + getModuleProgress(module.id);
            },
            0,
          );
          const courseAvgProgress =
            courseTotalModuleProgress / course.modules.length;
          totalCourseProgress += courseAvgProgress;
          coursesWithModules++;
        }
      });

      if (coursesWithModules > 0) {
        setOverallProgress(
          Math.round(totalCourseProgress / coursesWithModules),
        );
      } else {
        setOverallProgress(0);
      }
    }
  }, [academyData, getModuleProgress]);

  const handleContinueCourse = (course: Course) => {
    router.push(`/academy?courseId=${course.id}`); // Navigate to academy page with course ID
  };

  if (!userProfile) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold">
          Please log in to view your profile.
        </h2>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">User Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              <strong>Name:</strong> {userProfile.name}
            </p>
            <p className="text-gray-700">
              <strong>Email:</strong> {userProfile.email}
            </p>
            <p className="text-gray-700">
              <strong>Experience Level:</strong> {userProfile.experienceLevel}
            </p>
            <p className="text-gray-700">
              <strong>Interests:</strong> {userProfile.interests.join(', ')}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Overall Academy Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Progress value={overallProgress} className="w-full h-3" />
              <span className="text-lg font-semibold">{overallProgress}%</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Your average progress across all enrolled courses.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Badges</CardTitle>
          </CardHeader>
          <CardContent>
            {userProfile.badges && userProfile.badges.length > 0 ? (
              <ul className="list-disc list-inside text-gray-700">
                {userProfile.badges.map((badge, index) => (
                  <li key={index}>{badge}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No badges earned yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Enrolled Courses
      </h2>
      {enrolledCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((course) => (
            <Card
              key={course.id}
              className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col"
            >
              <CardHeader>
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-center space-x-4">
                  <Progress
                    value={course.progress || 0}
                    className="w-full h-2"
                  />
                  <span className="text-sm font-medium">
                    {course.progress || 0}%
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Level: {course.level} | Duration: {course.duration}
                </p>
              </CardContent>
              <div className="p-4 pt-0">
                <Button
                  onClick={() => handleContinueCourse(course)}
                  className="w-full"
                >
                  Continue Learning
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-center p-8">
          You are not currently enrolled in any courses.
        </p>
      )}
    </div>
  );
};

export default UserProfileClient;
