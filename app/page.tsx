'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  getPublicFeeds,
  getPublicCategories,
  Feed,
  Category,
  checkSessionStatus,
  getUserProfile,
  UserProfile,
} from '@/lib/api';
import PatPageClient from './pat/[[...id]]/ArticlePageClient';
import NewsCard from '@/components/feed/NewsCard';
import HeroCard from '@/components/home/HeroCard';
import TrendingSidebar from '@/components/home/TrendingSidebar';
import DailyFocusWidget from '@/components/home/DailyFocusWidget';
import WhoToFollowWidget from '@/components/home/WhoToFollowWidget';
import AppDownloadBanner from '@/components/AppDownloadBanner';
import AdPlaceholder from '@/components/AdPlaceholder';
import AuthWallModal from '@/components/auth/AuthWallModal';
import ForexWidget from '@/components/widgets/ForexWidget';
import WeatherCard from '@/components/widgets/WeatherCard';
import CryptoCard from '@/components/widgets/CryptoCard';
import DailyTipCard from '@/components/widgets/DailyTipCard';
import MainHeader from '@/components/MainHeader';
import StatStrip from '@/components/home/StatStrip';
import DynamicHomeBanner from '@/components/ads/DynamicHomeBanner';
import UsernameSetupBanner from '@/components/dashboard/UsernameSetupBanner';
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

  return (
    <Suspense fallback={<div className={styles.page}><p className={styles.loading}>Loading…</p></div>}>
      <LinksHomePage />
    </Suspense>
  );
}

function LinksHomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { initialQuery, initialCategoryId } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { initialQuery: '', initialCategoryId: undefined };
    }
    const params = new URLSearchParams(window.location.search);
    const query = params.get('query') ?? '';
    const categoryParam = params.get('categoryId');
    const categoryId = categoryParam ? Number(categoryParam) : undefined;
    return { initialQuery: query, initialCategoryId: Number.isFinite(categoryId) ? categoryId : undefined };
  }, []);

  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [authWall, setAuthWall] = useState({ open: false, action: 'access this content' });
  const [isMobileFeed, setIsMobileFeed] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [filters, setFilters] = useState<{ query: string; categoryId?: number }>(() => ({
    query: initialQuery,
    categoryId: Number.isFinite(initialCategoryId) ? initialCategoryId : undefined,
  }));
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [categories, setCategories] = useState<Category[]>([]);

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
    let cancelled = false;
    if (!hasSession) {
      setUserProfile(null);
      return () => {
        cancelled = true;
      };
    }

    const loadProfile = async () => {
      try {
        const profile = await getUserProfile();
        if (!cancelled) {
          setUserProfile(profile);
        }
      } catch {
        if (!cancelled) {
          setUserProfile(null);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [hasSession]);

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
        const data = await getPublicFeeds({
          query: filters.query,
          categoryId: filters.categoryId,
        });
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
  }, [filters]);

  useEffect(() => {
    if (!pathname) return;
    const params = new URLSearchParams();
    if (filters.query) {
      params.set('query', filters.query);
    }
    if (typeof filters.categoryId === 'number') {
      params.set('categoryId', filters.categoryId.toString());
    }
    const queryString = params.toString();
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [filters, pathname, router]);

  useEffect(() => {
    let cancelled = false;
    const loadCategories = async () => {
      try {
        const list = await getPublicCategories();
        if (!cancelled) {
          setCategories(list || []);
        }
      } catch (error) {
        console.warn('[HomePage] Failed to load categories', error);
        if (!cancelled) {
          setCategories([]);
        }
      }
    };
    loadCategories();
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

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters((prev) => ({
      ...prev,
      query: searchInput.trim(),
    }));
  };

  const handleCategorySelect = (categoryId?: number) => {
    setFilters((prev) => ({
      ...prev,
      categoryId: prev.categoryId === categoryId ? undefined : categoryId,
    }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ query: '', categoryId: undefined });
  };

  const displayedCategories = categories.slice(0, 8);

  return (
    <div className={styles.page}>
      <MainHeader hasSession={hasSession} />
      <StatStrip />
      {hasSession && userProfile && <UsernameSetupBanner user={userProfile} />}
      <DynamicHomeBanner />
      <div className={styles.layout}>
        <aside className={styles.trendingColumn}>
          <TrendingSidebar items={feeds} onSubscribe={() => openAuthWall('subscribe to a category')} />
        </aside>

        <section className={styles.feedColumn}>
          <div className={styles.filterCard}>
            <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search headlines, tickers, or writers"
                className={styles.searchInput}
              />
              <button type="submit" className={styles.searchButton}>
                Search
              </button>
              {(filters.query || filters.categoryId !== undefined) && (
                <button type="button" className={styles.clearButton} onClick={clearFilters}>
                  Clear
                </button>
              )}
            </form>
            <div className={styles.pillRow}>
              <button
                type="button"
                className={`${styles.filterPill} ${filters.categoryId === undefined ? styles.pillActive : ''}`}
                onClick={() => handleCategorySelect(undefined)}
              >
                All
              </button>
              {displayedCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`${styles.filterPill} ${
                    filters.categoryId === category.id ? styles.pillActive : ''
                  }`}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
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
          <DailyTipCard />
          <div className={styles.adSlot}>
            <AdPlaceholder placementId="homepage-right-1" />
          </div>
          <WeatherCard />
          <CryptoCard />
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
