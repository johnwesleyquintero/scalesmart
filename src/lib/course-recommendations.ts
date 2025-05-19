import { UserProfile } from '@/lib/models/user';
import { Course } from '@/types';

export const getRecommendedCourses = async (
  userProfile: UserProfile,
  completedCourseIds: string[],
): Promise<Course[]> => {
  try {
    const response = await fetch('/api/academy-courses');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const courses: Course[] = await response.json();

    // Filter courses based on user profile and completed courses
    const recommendedCourses = courses.filter((course) => {
      // Exclude completed courses
      if (course.slug && completedCourseIds.includes(course.slug)) {
        return false;
      }

      // Include courses matching user interests (simple matching)
      if (
        userProfile.interests &&
        userProfile.interests.length > 0 &&
        course.metadata.tags &&
        course.metadata.tags.length > 0
      ) {
        const hasMatchingInterest = userProfile.interests.some((interest) =>
          course.metadata.tags.includes(interest),
        );
        if (!hasMatchingInterest) {
          return false;
        }
      }

      // Further filter based on experience level (example: Beginner courses only for Beginner users)
      if (
        userProfile.experienceLevel === 'Beginner' &&
        course.metadata.level !== 'Beginner'
      ) {
        return false;
      }

      return true;
    });

    return recommendedCourses;
  } catch (error) {
    console.error('Error fetching or filtering courses:', error);
    return [];
  }
};
