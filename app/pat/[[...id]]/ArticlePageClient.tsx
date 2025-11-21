'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getPublicFeed, FeedArticle, getPublicFeeds, Feed } from '@/lib/api';
import { getCachedArticle, setCachedArticle } from '@/lib/cache';
import ArticleReader from '@/components/ArticleReader';
import styles from '../../../page.module.css';
import Image from 'next/image';
import Footer from '@/components/Footer';
import categoryIcons from '@/data/categoryIcons.json';

/**
 * Handles both /pat/ (homepage) and /pat/{id} (article) routes
 * Uses /api/v1/feeds/{id} for article pages
 */
export default function PatPageClient() {
  const pathname = usePathname();
  const router = useRouter();
  const [article, setArticle] = useState<FeedArticle | null>(null);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isArticleRoute, setIsArticleRoute] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  // Get bypass parameter from URL or referrer
  const getBypassParam = useMemo(() => {
    if (typeof window === 'undefined') return '';
    
    // First check current URL
    const urlParams = new URLSearchParams(window.location.search);
    const bypass = urlParams.get('bypass');
    if (bypass === 'ag3nt007') {
      return '?bypass=ag3nt007';
    }
    
    // If not in current URL, check referrer
    if (document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer);
        const referrerBypass = referrerUrl.searchParams.get('bypass');
        if (referrerBypass === 'ag3nt007') {
          return '?bypass=ag3nt007';
        }
      } catch (e) {
        // Invalid referrer URL, ignore
      }
    }
    
    return '';
  }, []);

  useEffect(() => {
    // Check if we're on an article route or homepage
    let articleId: number | null = null;
    let routeIsArticle = false;
    
    if (typeof window !== 'undefined') {
      const windowPath = window.location.pathname;
      // Match /pat/{id} format (but not just /pat/)
      const windowMatch = windowPath.match(/^\/pat\/(\d+)$/);
      if (windowMatch) {
        articleId = parseInt(windowMatch[1], 10);
        routeIsArticle = true;
      } else if (windowPath === '/pat' || windowPath === '/pat/') {
        routeIsArticle = false;
      }
    }
    
    // Fallback to pathname
    if (!articleId && pathname) {
      const pathnameMatch = pathname.match(/^\/pat\/(\d+)$/);
      if (pathnameMatch) {
        articleId = parseInt(pathnameMatch[1], 10);
        routeIsArticle = true;
      } else if (pathname === '/pat' || pathname === '/pat/') {
        routeIsArticle = false;
      }
    }

    setIsArticleRoute(routeIsArticle);

    if (routeIsArticle && articleId) {
      loadArticle(articleId);
    } else {
      // Don't load feeds here - root page handles that
      setIsLoading(false);
    }
  }, [pathname, getBypassParam]);

  async function loadArticle(articleId: number) {
    try {
      setIsLoading(true);
      console.log(`[PatArticlePage] Loading article ${articleId}...`);
      
      // Check for bypass parameter - if present, don't use cache (to ensure bypass works)
      const hasBypass = getBypassParam.includes('bypass=ag3nt007');
      
      // Check cache first (only if no bypass)
      if (!hasBypass) {
        const cached = getCachedArticle(articleId);
        if (cached) {
          console.log(`[PatArticlePage] Using cached article ${articleId}`);
          setArticle(cached);
          setError(null);
          setIsLoading(false);
          return;
        }
      }

      // Fetch from API - uses /api/v1/feeds/{id} (not /public endpoint)
      console.log(`[PatArticlePage] Fetching article ${articleId} from API${hasBypass ? ' (bypass enabled)' : ''}`);
      const data = await getPublicFeed(articleId);
      if (!data) {
        console.log(`[PatArticlePage] Article ${articleId} not found`);
        setError('Article not found or not available');
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        }, 2000);
        return;
      }
      
      // Cache the article for 7 days
      setCachedArticle(articleId, data);
      setArticle(data);
      setError(null);
      console.log(`[PatArticlePage] Successfully loaded article ${articleId}: ${data.title}`);
    } catch (err) {
      console.error('[PatArticlePage] Failed to load article:', err);
      setError('Failed to load article. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  // Render article page
  if (isArticleRoute) {
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
          <a href={`/${getBypassParam}`} style={{ marginTop: '16px', color: '#667eea', textDecoration: 'underline' }}>
            ← Back to Home
          </a>
        </div>
      );
    }

    return <ArticleReader article={article} />;
  }

  // Don't render homepage here - root page handles that
  return null;
}
