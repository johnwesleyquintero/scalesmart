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
        const updatedProfile = {
          ...userProfile,
          experienceLevel: level,
        } as UserProfile;
        setUserProfile(updatedProfile);
      },
      [setUserProfile, userProfile],
    ),
    addInterest: useCallback(
      (interest: string) => {
        const updatedProfile = {
          ...userProfile,
          interests: [...(userProfile?.interests || []), interest],
        } as UserProfile;
        setUserProfile(updatedProfile);
      },
      [setUserProfile, userProfile],
    ),
    removeInterest: useCallback(
      (interest: string) => {
        const updatedProfile = {
          ...userProfile,
          interests: (userProfile?.interests || []).filter(
            (i: string) => i !== interest,
          ),
        } as UserProfile;
        setUserProfile(updatedProfile);
      },
      [setUserProfile, userProfile],
    ),
    updateCourseProgress: useCallback(
      (courseId: string, progress: number) => {
        const updatedProfile = {
          ...userProfile,
          courseProgress: {
            ...(userProfile?.courseProgress || {}),
            [courseId]: progress,
          },
        } as UserProfile;
        setUserProfile(updatedProfile);
      },
      [setUserProfile, userProfile],
    ),
    addBadge: useCallback(
      (badge: string) => {
        const updatedProfile = {
          ...userProfile,
          badges: userProfile?.badges
            ? [...userProfile.badges, badge]
            : [badge],
        } as UserProfile;
        setUserProfile(updatedProfile);
      },
      [setUserProfile, userProfile],
    ),
  };
};

// Consider:
// - Security: If userProfile contains sensitive data, encrypt before storing.
// - Performance: Debounce/throttle updates to optimize.
// - Data Size: Consider adding validation.

export default useUserProfile;
