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
      let articleId: number | null = null;
      
      // Try pathname first (normal Next.js routing)
      const pathnameMatch = pathname?.match(/\/article\/(\d+)/);
      if (pathnameMatch) {
        articleId = parseInt(pathnameMatch[1], 10);
      } else if (typeof window !== 'undefined') {
        // Fallback to window.location for 404 redirects from GitHub Pages
        const windowMatch = window.location.pathname.match(/\/article\/(\d+)/);
        if (windowMatch) {
          articleId = parseInt(windowMatch[1], 10);
        }
      }
      
      if (!articleId || isNaN(articleId) || articleId <= 0) {
        setError('Invalid article ID');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
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
          // Article not found or not public - redirect to home
          console.log(`[ArticlePage] Article ${articleId} not found or not public, redirecting to home`);
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
          return;
        }
        // Cache the article for 7 days
        setCachedArticle(articleId, data);
        setArticle(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load article:', err);
        // On error, redirect to home (article not found or not public)
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
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
