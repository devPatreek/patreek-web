'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';

/**
 * Article redirect page
 * 
 * This page handles article links from sharing:
 * - If app is installed: Universal Links will intercept and open the app (iOS/Android)
 * - If app is not installed: This page redirects to App Store/Play Store
 * 
 * Universal Links work automatically - if the user taps (not long-press) on a link
 * and the app is installed, iOS/Android will open the app directly, bypassing this page.
 * Only if the app is not installed (or user long-presses) will this page load.
 */
export default function ArticleRedirectPage() {
  const params = useParams();
  const articleId = params?.id as string;

  useEffect(() => {
    // App Store URLs
    const APP_STORE_URL = 'https://apps.apple.com/us/app/patreek/id6547858283';
    const GOOGLE_PLAY_URL = ''; // Will be added when Android app launches

    // Detect platform
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(userAgent);

    // Small delay to ensure we're actually in the browser (not intercepted by app)
    // Universal Links will intercept before this page loads if app is installed
    const redirectTimer = setTimeout(() => {
      if (isIOS) {
        window.location.href = APP_STORE_URL;
      } else if (isAndroid && GOOGLE_PLAY_URL) {
        window.location.href = GOOGLE_PLAY_URL;
      } else {
        // Desktop or fallback: redirect to iOS App Store
        window.location.href = APP_STORE_URL;
      }
    }, 500);

    return () => clearTimeout(redirectTimer);
  }, []);

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      margin: 0,
      background: '#fff',
      color: '#000',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #667eea',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px',
        }} />
        <p>Opening Patreek...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
