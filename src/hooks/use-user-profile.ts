// src/hooks/use-user-profile.ts
import { UserProfile, defaultUserProfile } from '../lib/user-profile';
import { useCallback } from 'react';
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
    updateExperienceLevel: useCallback(
      (level: 'Beginner' | 'Intermediate' | 'Advanced') => {
        setUserProfile((currentProfile) => ({
          ...currentProfile,
          experienceLevel: level,
        }));
      },
      [setUserProfile],
    ),
    addInterest: useCallback(
      (interest: string) => {
        setUserProfile((currentProfile) => ({
          ...currentProfile,
          interests: [...currentProfile.interests, interest],
        }));
      },
      [setUserProfile],
    ),
    removeInterest: useCallback(
      (interest: string) => {
        setUserProfile((currentProfile) => ({
          ...currentProfile,
          interests: currentProfile.interests.filter((i) => i !== interest),
        }));
      },
      [setUserProfile],
    ),
    updateCourseProgress: useCallback(
      (courseId: string, progress: number) => {
        setUserProfile((currentProfile) => ({
          ...currentProfile,
          courseProgress: {
            ...currentProfile.courseProgress,
            [courseId]: progress,
          },
        }));
      },
      [setUserProfile],
    ),
    addBadge: useCallback(
      (badge: string) => {
        setUserProfile((currentProfile) => ({
          ...currentProfile,
          badges: currentProfile.badges
            ? [...currentProfile.badges, badge]
            : [badge],
        }));
      },
      [setUserProfile],
    ),
  };
};

// Consider:
// - Security: If userProfile contains sensitive data, encrypt before storing.
// - Performance: Debounce/throttle updates to optimize.
// - Data Size: Consider the size of the user profile data.
// - Data Validation: Consider adding validation.

export default useUserProfile;
