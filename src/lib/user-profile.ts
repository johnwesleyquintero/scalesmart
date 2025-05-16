export interface UserProfile {
  id: string; // User ID (e.g., from local storage)
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  interests: string[]; // Array of interest tags (e.g., "product research", "advertising")
  completedCourses: string[]; // Array of course IDs
  courseProgress?: { [courseId: string]: number }; // Track progress for each course (0-100)
  badges?: string[]; // Array of badge IDs
  // Add other relevant user data
}

// Consider:
// - Secure User ID generation.
// - Consider encrypting the entire UserProfile object if sensitive data is added in the future.

export const defaultUserProfile: UserProfile = {
  id: '',
  experienceLevel: 'Beginner',
  interests: [],
  completedCourses: [],
};
