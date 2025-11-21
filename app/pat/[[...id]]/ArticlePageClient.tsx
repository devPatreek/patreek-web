'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getPublicFeed, FeedArticle } from '@/lib/api';
import { getCachedArticle, setCachedArticle } from '@/lib/cache';
import ArticleReader from '@/components/ArticleReader';
import AdsterraSlot from '@/components/AdsterraSlot';
import styles from '../../page.module.css';

export default function PatPageClient() {
  const pathname = usePathname();
  const [article, setArticle] = useState<FeedArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const articleId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/^\/pat\/(\d+)/);
      if (match) return parseInt(match[1], 10);
    }
    if (pathname) {
      const match = pathname.match(/^\/pat\/(\d+)/);
      if (match) return parseInt(match[1], 10);
    }
    return null;
  }, [pathname]);

  useEffect(() => {
    if (!articleId) {
      setIsLoading(false);
      setError('Invalid pat ID');
      return;
    }

    const load = async () => {
      try {
        setIsLoading(true);

        const cached = getCachedArticle(articleId);
        if (cached) {
          setArticle(cached);
          setError(null);
          setIsLoading(false);
          return;
        }

        const data = await getPublicFeed(articleId);
        if (!data) {
          setError('Pat not found or unavailable');
          setArticle(null);
          return;
        }

        setCachedArticle(articleId, data);
        setArticle(data);
        setError(null);
      } catch (err) {
        console.error('[PatPage] Failed to load article', err);
        setError('Failed to load pat');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [articleId]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading pat...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <p>{error || 'Pat not found'}</p>
        <a href="/" style={{ marginTop: 16, color: '#667eea', textDecoration: 'underline' }}>
          ← Back to Home
        </a>
      </div>
    );
  }

  return (
    <main className={`${styles.main} ${styles.mainRow}`}>
      <div className={styles.mainColumn}>
        <ArticleReader article={article} />
      </div>
      <aside className={styles.rightRail} aria-label="Sponsored">
        <AdsterraSlot variant="iframe300x250" />
        <AdsterraSlot variant="native" />
      </aside>
    </main>
  );
}
