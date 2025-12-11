'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getPublicFeeds, Feed, checkSessionStatus } from '@/lib/api';
import PatPageClient from './pat/[[...id]]/ArticlePageClient';
import NewsCard from '@/components/feed/NewsCard';
import HeroCard from '@/components/home/HeroCard';
import TrendingSidebar from '@/components/home/TrendingSidebar';
import DailyFocusWidget from '@/components/home/DailyFocusWidget';
import WhoToFollowWidget from '@/components/home/WhoToFollowWidget';
import AppDownloadBanner from '@/components/AppDownloadBanner';
import AdPlaceholder from '@/components/AdPlaceholder';
import AuthWallModal from '@/components/auth/AuthWallModal';
import WeatherWidget from '@/components/widgets/WeatherWidget';
import ForexWidget from '@/components/widgets/ForexWidget';
import MainHeader from '@/components/MainHeader';
import StatStrip from '@/components/home/StatStrip';
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
  const [hasSession, setHasSession] = useState(false);
  const [authWall, setAuthWall] = useState({ open: false, action: 'access this content' });
  const [isMobileFeed, setIsMobileFeed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadSession = async () => {
      try {
        const session = await checkSessionStatus();
        if (!cancelled) {
          setHasSession(session.authenticated);
        }
      } catch {
        if (!cancelled) {
          setHasSession(false);
        }
      }
    };
    loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const check = () => {
      if (typeof window === 'undefined') return;
      setIsMobileFeed(window.innerWidth < 768);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const openAuthWall = (action: string) => {
    setAuthWall({ open: true, action });
  };

  const closeAuthWall = () => {
    setAuthWall((prev) => ({ ...prev, open: false }));
  };

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
  type StreamItem = Feed | { isAd: true; adKey: string };
  const streamWithAds = useMemo<StreamItem[]>(() => {
    if (!isMobileFeed) return stream;
    const merged: StreamItem[] = [];
    stream.forEach((item, index) => {
      merged.push(item);
      if ((index + 1) % 5 === 0) {
        merged.push({ isAd: true, adKey: `mobile-feed-${index}` });
      }
    });
    return merged;
  }, [stream, isMobileFeed]);

  return (
    <div className={styles.page}>
      <MainHeader hasSession={hasSession} />
      <StatStrip />
      <section className={`${styles.page_adSection} ${styles.featuredBanner}`}>
        <div>
          <p className={styles.featuredTag}>Featured Partner</p>
          <h2 className={styles.featuredTitle}>Book a premium news slot</h2>
          <p className={styles.featuredCopy}>
            Spotlight your brand inside the Patreek newsroom and multiply impressions across our curated audiences.
          </p>
        </div>
        <div className={styles.featuredActions}>
          <a className={styles.featuredButton} href="/advertise">
            Book this slot
          </a>
        </div>
      </section>
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
            {streamWithAds.map((item) => {
              if ('isAd' in item && item.isAd) {
                return (
                  <div key={item.adKey} className={styles.mobileAd}>
                    <AdPlaceholder placementId={`mobile-feed-${item.adKey}`} />
                  </div>
                );
              }
              const feed = item as Feed;
              return (
                <NewsCard
                  key={feed.id}
                  title={feed.title}
                  summary={feed.description}
                  source={feed.categoryName}
                  createdAt={feed.createdAt}
                  patCount={feed.pats ?? 0}
                  thumbnailUrl={feed.imageUrl}
                  requiresAuth={!hasSession}
                  onAuthWall={openAuthWall}
                />
              );
            })}
          </div>
        </section>

        <aside className={styles.widgetColumn}>
          <DailyFocusWidget />
          <div className={styles.adSlot}>
            <AdPlaceholder placementId="homepage-right-1" />
          </div>
          <WeatherWidget />
          <div className={styles.adSlot}>
            <AdPlaceholder placementId="homepage-right-2" />
          </div>
          <ForexWidget />
          <div className={styles.adSlot}>
            <AdPlaceholder placementId="homepage-right-3" />
          </div>
          <WhoToFollowWidget />
        </aside>
      </div>

      <AuthWallModal
        isOpen={authWall.open}
        triggerAction={authWall.action}
        onClose={closeAuthWall}
      />

      <AppDownloadBanner />
    </div>
  );
}
