'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getPublicFeed, FeedArticle } from '@/lib/api';
import { getCachedArticle, setCachedArticle } from '@/lib/cache';
import ArticleReader from '@/components/ArticleReader';

export default function ArticlePageClient() {
  const pathname = usePathname();
  const [article, setArticle] = useState<FeedArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadArticle() {
      // Extract article ID from pathname or window.location (for 404 redirects)
      // Safari compatibility: use multiple methods to extract article ID
      let articleId: number | null = null;
      
      // Method 1: Try window.location.pathname first (most reliable for GitHub Pages 404 redirects)
      if (typeof window !== 'undefined') {
        const windowPath = window.location.pathname;
        const windowMatch = windowPath.match(/\/article\/(\d+)/);
        if (windowMatch) {
          articleId = parseInt(windowMatch[1], 10);
          console.log(`[ArticlePage] Extracted article ID from window.location.pathname: ${articleId} (path: ${windowPath})`);
        }
        
        // Method 2: Also try window.location.href as fallback (Safari sometimes has pathname issues)
        if (!articleId) {
          const hrefMatch = window.location.href.match(/\/article\/(\d+)/);
          if (hrefMatch) {
            articleId = parseInt(hrefMatch[1], 10);
            console.log(`[ArticlePage] Extracted article ID from window.location.href: ${articleId}`);
          }
        }
      }
      
      // Method 3: Fallback to pathname (normal Next.js routing)
      if (!articleId && pathname) {
        const pathnameMatch = pathname.match(/\/article\/(\d+)/);
        if (pathnameMatch) {
          articleId = parseInt(pathnameMatch[1], 10);
          console.log(`[ArticlePage] Extracted article ID from pathname: ${articleId}`);
        }
      }
      
      if (!articleId || isNaN(articleId) || articleId <= 0) {
        const debugInfo = {
          articleId,
          pathname,
          windowPathname: typeof window !== 'undefined' ? window.location.pathname : 'N/A',
          windowHref: typeof window !== 'undefined' ? window.location.href : 'N/A',
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
        };
        console.error(`[ArticlePage] Invalid article ID:`, debugInfo);
        setError('Invalid article ID');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log(`[ArticlePage] Loading article ${articleId}...`);
        
        // Check cache first
        const cached = getCachedArticle(articleId);
        if (cached) {
          console.log(`[ArticlePage] Using cached article ${articleId}`);
          setArticle(cached);
          setError(null);
          setIsLoading(false);
          return;
        }

        // Fetch from API if not in cache
        console.log(`[ArticlePage] Fetching article ${articleId} from API`);
        const data = await getPublicFeed(articleId);
        if (!data) {
          // Article not found or not public - but check if it's a Safari-specific issue
          const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);
          console.log(`[ArticlePage] Article ${articleId} not found or not public (returned null). Safari: ${isSafari}`);
          
          // For Safari, log more details for debugging
          if (isSafari) {
            console.warn(`[ArticlePage] Safari detected - this might be a CORS or fetch issue. Check network tab.`);
          }
          
          // Don't redirect immediately - show error first, then redirect after a brief delay
          setError('Article not found or not available');
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.location.href = 'https://links.patreek.com/';
            }
          }, 2000);
          return;
        }
        // Cache the article for 7 days
        setCachedArticle(articleId, data);
        setArticle(data);
        setError(null);
        console.log(`[ArticlePage] Successfully loaded article ${articleId}: ${data.title}`);
        
        // Refresh Ezoic ads when article loads (for dynamic content)
        if (typeof window !== 'undefined' && window.ezstandalone) {
          window.ezstandalone.cmd.push(function () {
            window.ezstandalone.showAds();
          });
        }
      } catch (err) {
        console.error('[ArticlePage] Failed to load article:', err);
        setError('Failed to load article. Please try again later.');
        // Don't redirect immediately on error - let user see the error
        // setTimeout(() => {
        //   if (typeof window !== 'undefined') {
        //     window.location.href = 'https://links.patreek.com/';
        //   }
        // }, 3000);
      } finally {
        setIsLoading(false);
      }
    }

    // Load article when component mounts or pathname changes
    loadArticle();
  }, [pathname]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        color: '#333',
      }}>
        <p>Loading article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        color: '#333',
        padding: '20px',
      }}>
        <p>{error || 'Article not found'}</p>
        <a href="/" style={{ marginTop: '16px', color: '#667eea', textDecoration: 'underline' }}>
          ← Back to Home
        </a>
      </div>
    );
  }

  return <ArticleReader article={article} />;
}
