'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getPublicFeeds, Feed } from '@/lib/api';
import PatPageClient from './pat/[[...id]]/ArticlePageClient';
import NewsCard from '@/components/feed/NewsCard';
import HeroCard from '@/components/home/HeroCard';
import TrendingSidebar from '@/components/home/TrendingSidebar';
import DailyFocusWidget from '@/components/home/DailyFocusWidget';
import WhoToFollowWidget from '@/components/home/WhoToFollowWidget';
import AppDownloadBanner from '@/components/AppDownloadBanner';
import AdPlaceholder from '@/components/AdPlaceholder';
import styles from './page.module.css';

/**
 * Root route switches to the PAT page for article IDs.
 */
export default function RootPage() {
  const pathname = usePathname();
  const isPatRoute =
    (typeof window !== 'undefined' && /^\/pat\/\d+/.test(window.location.pathname)) ||
    (pathname ? /^\/pat\/\d+/.test(pathname) : false);

  if (isPatRoute) {
    return <PatPageClient />;
  }

  return <LinksHomePage />;
}

function LinksHomePage() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadFeeds() {
      try {
        setIsLoading(true);
        const data = await getPublicFeeds();
        if (!cancelled) {
          setFeeds(data);
        }
      } catch (error) {
        console.warn('[HomePage] Failed to load feeds:', error);
        if (!cancelled) {
          setFeeds([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadFeeds();

    return () => {
      cancelled = true;
    };
  }, []);

  const spotlight = feeds[0];
  const stream = feeds.slice(1);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <h1 className={styles.brand}>Patreek</h1>
          <p className={styles.highlight}>Live · AI-curated · Newsroom energy</p>
        </div>
      </div>

      <div className={styles.layout}>
        <aside className={styles.trendingColumn}>
          <TrendingSidebar items={feeds} />
        </aside>

        <section className={styles.feedColumn}>
          <HeroCard article={spotlight} />
          <div className={styles.newsStream}>
            {isLoading && <p className={styles.loading}>Loading stories…</p>}
            {!isLoading && !stream.length && (
              <p className={styles.loading}>No stories available yet.</p>
            )}
            {stream.map((feed) => (
              <NewsCard
                key={feed.id}
                title={feed.title}
                summary={feed.description}
                source={feed.categoryName}
                createdAt={feed.createdAt}
                patCount={feed.pats ?? 0}
                thumbnailUrl={feed.imageUrl}
              />
            ))}
          </div>
        </section>

        <aside className={styles.widgetColumn}>
          <DailyFocusWidget />
          <div className={styles.adSlot}>
            <AdPlaceholder placementId="homepage-right" />
          </div>
          <WhoToFollowWidget />
        </aside>
      </div>

      <AppDownloadBanner />
    </div>
  );
}
