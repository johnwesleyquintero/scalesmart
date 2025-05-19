export interface UserProfile {
  id: string; // User ID (e.g., from local storage)
  name: string;
  email: string;
  learningPreferences?: string[];
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  interests: string[]; // Array of interest tags (e.g., "product research", "advertising")
  completedCourses: string[]; // Array of course IDs
  courseProgress?: { [courseId: string]: number }; // Track progress for each course (0-100)
  badges?: string[]; // Array of badge IDs
  // Add other relevant user data
}
