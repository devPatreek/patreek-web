'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getPublicFeeds, Feed } from '@/lib/api';
import styles from './page.module.css';
import Image from 'next/image';
import Footer from '@/components/Footer';
import SignupModal from '@/components/SignupModal';
import categoryIcons from '@/data/categoryIcons.json';
import PatPageClient from './pat/[[...id]]/ArticlePageClient';
import AdsterraSlot from '@/components/AdsterraSlot';

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
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('patreek_session');
    setHasSession(Boolean(stored));
  }, []);

  return (
    <div className={styles.container}>
      <SignupModal
        open={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSuccess={() => setIsSignupOpen(false)}
      />

      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <Image
            src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675caa3a2f73ad268a86b51a_Patreek%20logo_slogan.png"
            alt="Patreek"
            width={110}
            height={40}
            className={styles.logo}
            priority
          />
          <nav className={styles.navLinks} aria-label="Primary">
            <a className={styles.navLink} href="#">News</a>
            <a className={styles.navLink} href="#">Finance</a>
            <a className={styles.navLink} href="#">Sports</a>
            <a className={styles.navLink} href="#">More</a>
          </nav>
        </div>
        <div className={styles.topRight}>
          <button className={styles.mailButton}>Mail</button>
          <button className={styles.signInButton}>Sign in</button>
        </div>
      </header>

      <div className={styles.heroAd}>
        <div className={styles.heroAdContent}>
          <p className={styles.heroEyebrow}>Featured Partner</p>
          <h1 className={styles.heroHeadline}>Bring your story to the front page.</h1>
          <p className={styles.heroSubtext}>Premium takeover slot, Patreek-blue CTA, high-impact visuals.</p>
          <button className={styles.heroCta}>Book this slot</button>
        </div>
      </div>

      <div className={styles.analyticsRow}>
        {[
          { title: 'Top sharers', metric: 'Shares', value: '1.2k', user: '@mo_alex' },
          { title: 'Top commenters', metric: 'Comments', value: '980', user: '@jules' },
          { title: 'Top patters', metric: 'Pats', value: '2.4k', user: '@helen' },
        ].map(card => (
          <div key={card.title} className={styles.analyticsCard}>
            <p className={styles.analyticsLabel}>{card.title}</p>
            <p className={styles.analyticsValue}>{card.value}</p>
            <p className={styles.analyticsMeta}>{card.metric} · {card.user}</p>
          </div>
        ))}
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
        ) : groupedFeeds.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No articles available at the moment.</p>
            <p className={styles.registerPrompt}>
              Register to get the latest updates from the topics you care about
            </p>
          </div>
        ) : (
          <>
            <div className={styles.contentGrid}>
              <div className={styles.leftColumn}>
                <h3 className={styles.sectionTitle}>Categories</h3>
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
              </div>

              <div className={styles.rightColumn}>
                <div className={styles.sectionTitle}>Sponsored & Widgets</div>
                <div className={styles.rightRailStack}>
                  <AdsterraSlot variant="iframe300x250" />
                  <AdsterraSlot variant="native" />
                  {[...Array(8)].map((_, idx) => (
                    <div key={idx} className={styles.widgetCard}>
                      <p className={styles.widgetLabel}>Widget {idx + 1}</p>
                      <p className={styles.widgetBody}>Reserve this slot for partners, games, plans, or polls.</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.forYou}>
              <h3 className={styles.sectionTitle}>For You</h3>
              {hasSession ? (
                <div className={styles.forYouFeed}>
                  {feeds.slice(0, 10).map(feed => (
                    <article key={feed.id} className={styles.forYouCard} onClick={() => handleNavigate(feed.id)}>
                      <div className={styles.forYouImageWrapper}>
                        <img
                          src={feed.imageUrl || 'https://insideskills.pl/wp-content/uploads/2024/01/placeholder-6.png'}
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
              ) : (
                <div className={styles.forYouCTA}>
                  <p>Sign in to see your personalized pats here.</p>
                  <button className={styles.heroCta} onClick={() => setIsSignupOpen(true)}>
                    Sign in to unlock
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
