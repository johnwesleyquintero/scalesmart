// src/hooks/use-user-profile.ts
import { UserProfile } from '../lib/models/user';
import { useCallback, useState, useEffect } from 'react';
import { useLocalStorage } from './use-local-storage';
import { useSession } from 'next-auth/react';
import { x64 } from 'crypto-js';

const USER_PROFILE_KEY = 'userProfile';

const useUserProfile = () => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [localStorageProfile, setLocalStorageProfile] = useLocalStorage<
    UserProfile | null | undefined
  >(USER_PROFILE_KEY, undefined);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      if (session?.user?.email && session.user.id && session.user.name) {
        // Fetch user profile from database
        try {
          const response = await fetch(
            `/api/user-profile?email=${session.user.email}`,
          );
          if (response.ok) {
            const data = await response.json();
            setUserProfile(data);
            setLocalStorageProfile(data); // Update local storage as well
          } else {
            // If user profile doesn't exist, create a new one
            if (response.status === 404) {
              const newUserProfile: UserProfile = {
                id: session.user.id as string,
                name: session.user.name,
                email: session.user.email,
                experienceLevel: 'Beginner',
                interests: [],
                completedCourses: [],
                courseProgress: {},
                badges: [],
              };
              await fetch('/api/user-profile', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(newUserProfile),
              });
              setUserProfile(newUserProfile);
              setLocalStorageProfile(newUserProfile); // Update local storage as well
            } else {
              console.error('Error fetching user profile:', response.status);
              setUserProfile(localStorageProfile || null); // Fallback to local storage
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(localStorageProfile || null); // Fallback to local storage
        }
      } else {
        setUserProfile(localStorageProfile || null); // Use local storage if no session
      }
      setIsLoading(false);
    };

    fetchUserProfile();
  }, [session, localStorageProfile, setLocalStorageProfile]);

  const updateUserProfile = useCallback(
    async (updatedProfile: UserProfile) => {
      try {
        await fetch('/api/user-profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedProfile),
        });
        setUserProfile(updatedProfile);
        setLocalStorageProfile(updatedProfile); // Update local storage as well
      } catch (error) {
        console.error('Error updating user profile:', error);
      }
    },
    [setLocalStorageProfile],
  );

  return {
    userProfile,
    isLoading,
    updateUserProfile,
  };
};

export default useUserProfile;
