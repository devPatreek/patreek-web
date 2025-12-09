'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getUserProfile, getPublicFeed, FeedArticle, checkSessionStatus } from '@/lib/api';
import { getCachedArticle, setCachedArticle } from '@/lib/cache';
import ArticleReader from '@/components/ArticleReader';
import AdsterraSlot from '@/components/AdsterraSlot';
import AdPlaceholder from '@/components/AdPlaceholder';
import MainHeader from '@/components/MainHeader';
import styles from '../../page.module.css';

export default function PatPageClient() {
  const pathname = usePathname();
  const [article, setArticle] = useState<FeedArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [rankLevel, setRankLevel] = useState(0);

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
    // Check session status
    const checkSession = async () => {
      try {
        const result = await checkSessionStatus();
        setHasSession(result.authenticated);
        if (result.authenticated) {
          const profile = await getUserProfile();
          setRankLevel(profile?.rank?.level ?? 0);
        } else {
          setRankLevel(0);
        }
      } catch (error) {
        setHasSession(false);
        setRankLevel(0);
      }
    };
    checkSession();
  }, []);

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
    <div>
      <MainHeader hasSession={hasSession} />
      <main className={`${styles.main} ${styles.mainRow}`}>
        <div className={styles.mainColumn}>
          <ArticleReader article={article} />
        </div>
        <aside className={styles.rightRailSticky} aria-label="Sponsored">
          {rankLevel < 5 && (
            <>
              <AdsterraSlot variant="iframe300x250" />
              <AdsterraSlot variant="iframe300x250" />
              <AdsterraSlot variant="native" />
              <AdsterraSlot variant="native" />
            </>
          )}
          <AdPlaceholder placementId="pat-right-rail" rankLevel={rankLevel} />
        </aside>
      </main>
    </div>
  );
}
