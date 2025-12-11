"use client";

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Feed,
  FeedArticle,
  getPublicFeed,
  getPublicFeeds,
  getUserProfile,
  checkSessionStatus,
} from '@/lib/api';
import { getCachedArticle, setCachedArticle } from '@/lib/cache';
import ArticleReader from '@/components/ArticleReader';
import MainHeader from '@/components/MainHeader';
import Footer from '@/components/Footer';
import AdPlaceholder from '@/components/AdPlaceholder';
import styles from './page.module.css';

export default function PatPageClient() {
  const pathname = usePathname();
  const [article, setArticle] = useState<FeedArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [rankLevel, setRankLevel] = useState(0);
  const [recommended, setRecommended] = useState<Feed[]>([]);

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
    const load = async () => {
      if (!articleId) {
        setIsLoading(false);
        setError('Invalid pat ID');
        return;
      }

      try {
        setIsLoading(true);

        const cached = getCachedArticle(articleId);
        if (cached) {
          setArticle(cached);
          setError(null);
          setIsLoading(false);
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

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const feeds = await getPublicFeeds();
        if (articleId) {
          setRecommended(feeds.filter((feed) => feed.id !== articleId).slice(0, 5));
        } else {
          setRecommended(feeds.slice(0, 5));
        }
      } catch (err) {
        console.error('[PatPage] Failed to load recommendations', err);
        setRecommended([]);
      }
    };
    loadRecommendations();
  }, [articleId]);

  if (isLoading) {
    return (
      <div className={styles.loader}>
        <p>Loading pat...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className={styles.loader}>
        <p>{error || 'Pat not found'}</p>
        <a href="/" className={styles.backLink}>
          ← Back to Home
        </a>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <MainHeader hasSession={hasSession} />
      <main className={styles.grid}>
        <section className={styles.contentColumn}>
          <ArticleReader article={article} />
        </section>
        <aside className={styles.sidebar}>
          <div className={styles.adWrapper}>
            <AdPlaceholder placementId="pat-article-300x250" />
          </div>
          <div className={styles.recommended}>
            <div className={styles.recommendedHeader}>
              <span>More for you</span>
            </div>
            <ul className={styles.recommendedList}>
              {recommended.map((feed) => (
                <li key={feed.id} className={styles.recommendedItem}>
                  <a href={`/pat/${feed.id}`} className={styles.recommendedLink}>
                    <p className={styles.recommendedTitle}>{feed.title}</p>
                    <p className={styles.recommendedMeta}>{feed.categoryName}</p>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>
      <Footer />
    </div>
  );
}
