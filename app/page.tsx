'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getPublicFeeds,
  Feed,
  Category,
  getUserCategoriesAuth,
  getUserFeedsAuth,
  getUserFeedsByCategoryAuth,
  getUserProfile,
  UserProfile,
  getCommunityLeaderboard,
  getTopCoinHolder,
  LeaderboardMetric,
} from '@/lib/api';
import styles from './page.module.css';
import Image from 'next/image';
import Footer from '@/components/Footer';
import SignupModal from '@/components/SignupModal';
import categoryIcons from '@/data/categoryIcons.json';
import PatPageClient from './pat/[[...id]]/ArticlePageClient';
import AdsterraSlot from '@/components/AdsterraSlot';
import MainHeader from '@/components/MainHeader';
import WeatherWidget from '@/components/widgets/WeatherWidget';
import TrendingNewsWidget from '@/components/widgets/TrendingNewsWidget';
import ForexWidget from '@/components/widgets/ForexWidget';

/**
 * Root page component - shows public feeds list (main homepage)
 * This is what patreek.com shows
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

/**
 * Public feed homepage for patreek.com/
 * Shows public articles like guest users see in the app
 */
function LinksHomePage() {
  const router = useRouter();
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [hasSession, setHasSession] = useState(false);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [forYouFeeds, setForYouFeeds] = useState<Feed[]>([]);
  const [forYouStatus, setForYouStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [activeForYouCategory, setActiveForYouCategory] = useState<number | 'all'>('all');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isUSUser, setIsUSUser] = useState<boolean>(false);
  const [userCountryCode, setUserCountryCode] = useState<string | undefined>(undefined);
  const [topStats, setTopStats] = useState<Record<LeaderboardMetric, { total?: number; username?: string }>>({
    shares: {},
    comments: {},
    pats: {},
    coins: {},
  });

  useEffect(() => {
    async function loadFeeds() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getPublicFeeds();
        setFeeds(data);
        // If no feeds returned (empty array), that's fine - we'll show the empty state
        // Only set error if there's an actual exception thrown
      } catch (err) {
        console.warn('[HomePage] Failed to load feeds:', err);
        // Don't set error state - let it show empty state instead
        setFeeds([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadFeeds();

    // Ad space reserved for future ad network integration
  }, []);

  const groupedFeeds = useMemo(() => {
    const map = new Map<string, Feed[]>();
    feeds.forEach(feed => {
      const key = feed.categoryName || 'Other';
      const bucket = map.get(key) || [];
      bucket.push(feed);
      map.set(key, bucket);
    });
    return Array.from(map.entries()).map(([category, items]) => {
      const sorted = [...items].sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      });
      return { category, items: sorted };
    });
  }, [feeds]);

  const defaultIcon = categoryIcons.default;

  const categoryIcon = (category: string) => {
    return categoryIcons[category as keyof typeof categoryIcons] || defaultIcon;
  };

  const handleNavigate = (id: number) => {
    const articleUrl = `/pat/${id}`;
    router.push(articleUrl);
  };

  const carouselItems = useMemo(() => groupedFeeds.map(g => g.items[0]).filter(Boolean), [groupedFeeds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex(prev => {
        if (!carouselItems.length) return 0;
        return (prev + 1) % carouselItems.length;
      });
    }, 10000);
    return () => clearInterval(timer);
  }, [carouselItems.length]);

  useEffect(() => {
    // Check session status via API endpoint
    // Tries cookie first (preferred), then localStorage token as header (fallback)
    const checkSession = async () => {
      try {
        const { checkSessionStatus } = await import('@/lib/api');
        const result = await checkSessionStatus();
        setHasSession(result.authenticated);
        
        // If authenticated, fetch user profile for country code
        if (result.authenticated) {
          const profile = await getUserProfile();
          setUserProfile(profile);
          // Check if user is US-based
          if (profile?.countryCode) {
            setUserCountryCode(profile.countryCode);
            setIsUSUser(profile.countryCode === 'US');
          }
        }
      } catch (error) {
        setHasSession(false);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (!hasSession) {
      setUserCategories([]);
      setForYouFeeds([]);
      return;
    }
    let mounted = true;
    const fetchCategories = async () => {
      try {
        const cats = await getUserCategoriesAuth();
        if (mounted) setUserCategories(cats || []);
      } catch (e) {
        if (mounted) setUserCategories([]);
      }
    };
    fetchCategories();
    return () => {
      mounted = false;
    };
  }, [hasSession]);

  useEffect(() => {
    let cancelled = false;
    const metrics: LeaderboardMetric[] = ['shares', 'comments', 'pats'];

    const loadTopStats = async () => {
      const next: Record<LeaderboardMetric, { total?: number; username?: string }> = {
        shares: {},
        comments: {},
        pats: {},
        coins: {},
      };

      for (const metric of metrics) {
        const [entry] = await getCommunityLeaderboard(metric, 1);
        if (entry) {
          next[metric] = {
            total: typeof entry.total === 'number' ? entry.total : Number(entry.total ?? 0),
            username: entry.username || entry.displayName,
          };
        }
      }

      // Load top coin holder separately
      try {
        const coinHolder = await getTopCoinHolder();
        if (coinHolder && coinHolder.username) {
          next.coins = {
            total: coinHolder.patCoins,
            username: coinHolder.username || coinHolder.name,
          };
        }
      } catch (error) {
        console.warn('[HomePage] Failed to load top coin holder:', error);
      }

      if (!cancelled) {
        setTopStats(next);
      }
    };

    loadTopStats();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasSession) return;
    loadForYouFeeds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSession]);

  const loadForYouFeeds = async (categoryId?: number) => {
    if (!hasSession) return;
    setForYouStatus('loading');
    try {
      const data = categoryId
        ? await getUserFeedsByCategoryAuth(undefined, categoryId)
        : await getUserFeedsAuth(undefined);
      setForYouFeeds(data || []);
      setForYouStatus('idle');
    } catch (e) {
      setForYouFeeds([]);
      setForYouStatus('error');
    }
  };

  const forYouTabs = useMemo(() => {
    const base = [{ id: 'all' as const, name: 'All' }];
    const subs = userCategories.flatMap(cat => (cat.children || []).map(child => ({ id: child.id, name: child.name })));
    return [...base, ...subs];
  }, [userCategories]);

  const statCards = useMemo(
    () => [
      { key: 'shares' as const, title: 'Top sharer', metric: 'Shares' },
      { key: 'comments' as const, title: 'Top commenter', metric: 'Comments' },
      { key: 'pats' as const, title: 'Top patter', metric: 'Pats' },
      { key: 'coins' as const, title: 'Top coin holder', metric: 'Coins' },
    ],
    [],
  );

  const formatNumber = (value?: number) => {
    if (value === undefined || value === null || Number.isNaN(value)) return '—';
    return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  };

  const formatUsername = (username?: string) => {
    if (!username) return '—';
    return username.startsWith('@') ? username : `@${username}`;
  };

  return (
    <div className={styles.container}>
      <SignupModal
        open={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSuccess={() => setIsSignupOpen(false)}
      />

      <MainHeader hasSession={hasSession} />

      <div className={styles.heroAd}>
        <div className={styles.heroAdContent}>
          <p className={styles.heroEyebrow}>Featured Partner</p>
          <h1 className={styles.heroHeadline}>Bring your story to the front page.</h1>
          <p className={styles.heroSubtext}>Premium takeover slot, Patreek-blue CTA, high-impact visuals.</p>
          <button className={styles.heroCta}>Book this slot</button>
        </div>
      </div>

      <div className={styles.analyticsRow}>
        {statCards.map(card => {
          const stat = topStats[card.key];
          return (
            <div key={card.key} className={styles.analyticsCard}>
              <p className={styles.analyticsLabel}>{card.title}</p>
              <p className={styles.analyticsValue}>{formatNumber(stat?.total)}</p>
              <p className={styles.analyticsMeta}>{card.metric} · {formatUsername(stat?.username)}</p>
            </div>
          );
        })}
      </div>

      <main className={styles.mainShell}>
        {isLoading ? (
          <div className={styles.loadingState}>
            <p>Loading articles...</p>
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className={styles.retryButton}>
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className={styles.contentGrid}>
              <div className={styles.leftColumn}>
                <h3 className={styles.sectionTitle}>Categories</h3>
                {groupedFeeds.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No articles available at the moment.</p>
                    <p className={styles.registerPrompt}>
                      Register to get the latest updates from the topics you care about
                    </p>
                  </div>
                ) : (
                  <div className={styles.categoryStack}>
                    {groupedFeeds.map(group => {
                      const [hero, ...rest] = group.items;
                      if (!hero) return null;
                      return (
                        <div key={group.category} className={styles.categoryCard}>
                          <div className={styles.categoryHeader}>
                            <span
                              className={styles.categoryIcon}
                              dangerouslySetInnerHTML={{ __html: categoryIcon(group.category) }}
                              aria-hidden="true"
                            />
                            <div>
                              <p className={styles.categoryLabel}>Category</p>
                              <h3 className={styles.categoryTitle}>{group.category}</h3>
                            </div>
                          </div>
                          <button
                            className={styles.hero}
                            onClick={() => handleNavigate(hero.id)}
                            aria-label={`Open ${hero.title}`}
                          >
                            <div className={styles.heroImageWrapper}>
                              <img
                                src={
                                  hero.imageUrl ||
                                  'https://insideskills.pl/wp-content/uploads/2024/01/placeholder-6.png'
                                }
                                alt={hero.title}
                                className={styles.heroImage}
                              />
                            </div>
                            <div className={styles.heroContent}>
                              <h4 className={styles.heroTitle}>{hero.title}</h4>
                            </div>
                          </button>
                          <div className={styles.headlines}>
                            {rest.map(item => (
                              <button
                                key={item.id}
                                className={styles.headlineRow}
                                onClick={() => handleNavigate(item.id)}
                              >
                                <span className={styles.headlineBullet}>•</span>
                                <span className={styles.headlineText}>{item.title}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={styles.centerColumn}>
                <div className={styles.carousel}>
                  <div className={styles.carouselHeader}>
                    <h3 className={styles.sectionTitle}>Spotlight</h3>
                    <div className={styles.carouselControls}>
                      <button
                        className={styles.navButton}
                        onClick={() =>
                          setCarouselIndex(prev =>
                            !carouselItems.length ? 0 : (prev - 1 + carouselItems.length) % carouselItems.length,
                          )
                        }
                        aria-label="Previous"
                      >
                        ‹
                      </button>
                      <button
                        className={styles.navButton}
                        onClick={() =>
                          setCarouselIndex(prev =>
                            !carouselItems.length ? 0 : (prev + 1) % carouselItems.length,
                          )
                        }
                        aria-label="Next"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                  {carouselItems.length > 0 ? (
                    <div className={styles.carouselCard}>
                      <img
                        src={
                          carouselItems[carouselIndex].imageUrl ||
                          'https://insideskills.pl/wp-content/uploads/2024/01/placeholder-6.png'
                        }
                        alt={carouselItems[carouselIndex].title}
                        className={styles.carouselImage}
                      />
                      <div className={styles.carouselOverlay}>
                        <p className={styles.carouselCategory}>{carouselItems[carouselIndex].categoryName}</p>
                        <h2 className={styles.carouselTitle}>{carouselItems[carouselIndex].title}</h2>
                        <button
                          className={styles.carouselCta}
                          onClick={() => handleNavigate(carouselItems[carouselIndex].id)}
                        >
                          Read pat
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.carouselEmpty}>No spotlight pats yet.</div>
                  )}
                </div>

                <div className={styles.forYou}>
                  <div className={styles.forYouHeaderRow}>
                    <h3 className={styles.sectionTitle}>For You</h3>
                    {hasSession && (
                      <Link href="/home" className={styles.forYouLink}>
                        Go to your home →
                      </Link>
                    )}
                  </div>

                  {hasSession ? (
                    <>
                      <div className={styles.forYouTabs} role="tablist" aria-label="Your categories">
                        {forYouTabs.map(tab => (
                          <button
                            key={tab.id}
                            role="tab"
                            className={`${styles.forYouTabButton} ${
                              activeForYouCategory === tab.id ? styles.forYouTabActive : ''
                            }`}
                            onClick={() => {
                              setActiveForYouCategory(tab.id);
                              if (tab.id === 'all') loadForYouFeeds();
                              else loadForYouFeeds(tab.id as number);
                            }}
                          >
                            {tab.name}
                          </button>
                        ))}
                      </div>

                      {forYouStatus === 'loading' ? (
                        <div className={styles.forYouCTA}>Loading your pats…</div>
                      ) : forYouStatus === 'error' ? (
                        <div className={styles.forYouCTA}>
                          <p>Could not load your pats. Please try again.</p>
                          <button className={styles.heroCta} onClick={() => loadForYouFeeds()}>
                            Retry
                          </button>
                        </div>
                      ) : forYouFeeds.length === 0 ? (
                        <div className={styles.forYouCTA}>No pats yet in this lane.</div>
                      ) : (
                        <div className={styles.forYouFeed}>
                          {forYouFeeds.slice(0, 20).map(feed => (
                            <article key={feed.id} className={styles.forYouCard} onClick={() => handleNavigate(feed.id)}>
                              <div className={styles.forYouImageWrapper}>
                                <img
                                  src={
                                    feed.imageUrl ||
                                    'https://insideskills.pl/wp-content/uploads/2024/01/placeholder-6.png'
                                  }
                                  alt={feed.title}
                                  className={styles.forYouImage}
                                />
                              </div>
                              <div className={styles.forYouContent}>
                                <p className={styles.forYouCategory}>{feed.categoryName}</p>
                                <h4 className={styles.forYouTitle}>{feed.title}</h4>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={styles.forYouCTA}>
                      <p>Sign in to see your personalized pats here.</p>
                      <button className={styles.heroCta} onClick={() => setIsSignupOpen(true)}>
                        Sign in to unlock
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.rightColumn}>
                <div className={styles.sectionTitle}>Widgets</div>
                <div className={styles.rightRailStack}>
                  {/* Weather Widget */}
                  <WeatherWidget countryCode={userCountryCode} />
                  
                  {/* Trending Local News Widget */}
                  <TrendingNewsWidget countryCode={userCountryCode} />
                  
                  {/* Forex Widget */}
                  <ForexWidget isUSUser={isUSUser} countryCode={userCountryCode} />
                  
                  {/* Ad Slots */}
                  <AdsterraSlot
                    key="ad-bottom-0"
                    variant="native"
                    className={styles.widgetCard}
                  />
                  <AdsterraSlot
                    key="ad-bottom-1"
                    variant="native"
                    className={styles.widgetCard}
                  />
                </div>
              </div>
            </div>

          </>
        )}

      </main>

      <Footer />
    </div>
  );
}
