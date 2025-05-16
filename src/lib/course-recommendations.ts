// src/lib/course-recommendations.ts
import { Course } from '@/types'; // Assuming you have a Course type defined
import coursesData from '../data/portfolio-data/courses.json'; // Assuming courses.json is in the correct path
import { UserProfile } from './user-profile';

export const getRecommendedCourses = (userProfile: UserProfile): Course[] => {
  const { experienceLevel, interests } = userProfile;

  // Filter courses based on experience level
  const filteredByLevel = (coursesData as Course[]).filter((course: Course) => {
    if (experienceLevel === 'Beginner' && course.level !== 'Advanced') {
      return true;
    }
    if (
      experienceLevel === 'Intermediate' &&
      course.level !== 'Advanced' &&
      course.level !== 'Beginner'
    ) {
      return true;
    }
    if (experienceLevel === 'Advanced') {
      return true;
    }
    return false;
  });

  // Further filter courses based on interests (simple keyword matching)
  const recommendedCourses = filteredByLevel.filter((course) => {
    if (interests.length === 0) {
      return true; // If no interests, recommend all courses
    }
    return interests.some((interest) =>
      course.title.toLowerCase().includes(interest.toLowerCase()),
    );
  });

  return recommendedCourses;
};
