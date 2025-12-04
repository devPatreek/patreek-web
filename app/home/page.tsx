'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkSessionStatus, getUserProfile } from '@/lib/api';

/**
 * Home page redirect component
 * - Signed-in users: Redirects to /u/{currentUsername}
 * - Guest users: Redirects to /registration
 */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        // Check if user is authenticated
        const sessionResult = await checkSessionStatus();
        if (sessionResult.authenticated) {
          // Get user profile to get username
          const profile = await getUserProfile();
          if (profile?.username) {
            // Redirect to user's home page
            router.replace(`/u/${profile.username}`);
          } else {
            // User is authenticated but no username - redirect to registration
            router.replace('/registration');
          }
        } else {
          // Not authenticated - redirect to registration
          router.replace('/registration');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // On error, redirect to registration
        router.replace('/registration');
      }
    };

    checkAndRedirect();
  }, [router]);

  // Show loading state while redirecting
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <p>Redirecting...</p>
    </div>
  );
}
