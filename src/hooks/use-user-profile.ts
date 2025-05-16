// src/hooks/use-user-profile.ts
import { UserProfile, defaultUserProfile } from '../lib/user-profile';
import { useLocalStorage } from './use-local-storage';

const USER_PROFILE_KEY = 'userProfile';

const useUserProfile = () => {
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>(
    USER_PROFILE_KEY,
    defaultUserProfile,
    defaultUserProfile,
  );

  return {
    userProfile,
    setUserProfile,
    // Add functions to update user profile here, e.g.,
    updateExperienceLevel: (
      level: 'Beginner' | 'Intermediate' | 'Advanced',
    ) => {
      setUserProfile({ ...userProfile, experienceLevel: level });
    },
    addInterest: (interest: string) => {
      setUserProfile({
        ...userProfile,
        interests: [...userProfile.interests, interest],
      });
    },
    removeInterest: (interest: string) => {
      setUserProfile({
        ...userProfile,
        interests: userProfile.interests.filter((i) => i !== interest),
      });
    },
    updateCourseProgress: (courseId: string, progress: number) => {
      setUserProfile({
        ...userProfile,
        courseProgress: {
          ...userProfile.courseProgress,
          [courseId]: progress,
        },
      });
    },
    addBadge: (badge: string) => {
      setUserProfile({
        ...userProfile,
        badges: userProfile.badges ? [...userProfile.badges, badge] : [badge],
      });
    },
  };
};

// Consider:
// - Security: If userProfile contains sensitive data, encrypt before storing.
// - Performance: Debounce/throttle updates to optimize.
// - Data Size: Consider the size of the user profile data.
// - Error Handling: Ensure errors are handled gracefully.
// - Data Validation: Consider adding validation.

export default useUserProfile;
