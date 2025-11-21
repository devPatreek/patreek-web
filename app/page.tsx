'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getPublicFeeds, Feed } from '@/lib/api';
import styles from './page.module.css';
import Image from 'next/image';
import Footer from '@/components/Footer';
import SignupModal from '@/components/SignupModal';
import categoryIcons from '@/data/categoryIcons.json';

/**
 * Root page component - shows public feeds list (main homepage)
 * This is what patreek.com shows
 */
export default function RootPage() {
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
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  const updateScrollState = () => {
    const node = trackRef.current;
    if (!node) return;
    const { scrollLeft, clientWidth, scrollWidth } = node;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
  };

  useEffect(() => {
    updateScrollState();
    const node = trackRef.current;
    if (!node) return;
    const handler = () => updateScrollState();
    node.addEventListener('scroll', handler);
    return () => node.removeEventListener('scroll', handler);
  }, [groupedFeeds.length]);

  const scrollCarousel = (direction: 'left' | 'right') => {
    const node = trackRef.current;
    if (!node) return;
    const firstCard = node.querySelector<HTMLElement>(`.${styles.categoryCard}`);
    const delta = firstCard ? firstCard.offsetWidth + 16 : 320;
    const amount = direction === 'left' ? -delta : delta;
    node.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className={styles.container}>
      <SignupModal
        open={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSuccess={() => setIsSignupOpen(false)}
      />
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logoSection}>
            <Image
              src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675caa3a2f73ad268a86b51a_Patreek%20logo_slogan.png"
              alt="Patreek"
              width={60}
              height={60}
              className={styles.logo}
              priority
            />
          </div>
          <div className={styles.headerTitle}>
            <h2 className={styles.title}>Latest pats by category</h2>
            <p className={styles.subtitle}>Compact lanes of what&apos;s trending now</p>
          </div>
        </div>
      </header>

      <div className={styles.signupBanner}>
        <div className={styles.signupBannerText}>
          <p className={styles.signupHeadline}>Sign up to get personalized pats specially curated for you!</p>
          <p className={styles.signupSubhead}>Mirror the mobile experience with category picks, SSO, and your own timeline.</p>
        </div>
        <button className={styles.signupButton} onClick={() => setIsSignupOpen(true)}>
          Sign Up
        </button>
      </div>

      <main className={`${styles.main} ${styles.mainRow}`}>
        <div className={styles.mainColumn}>
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
            <div className={styles.carouselShell}>
              <button
                className={`${styles.navButton} ${!canScrollLeft ? styles.navButtonDisabled : ''}`}
                onClick={() => scrollCarousel('left')}
                aria-label="Scroll categories left"
                disabled={!canScrollLeft}
              >
                ‹
              </button>
              <div className={styles.categoryTrack} ref={trackRef} onScroll={updateScrollState}>
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
              <button
                className={`${styles.navButton} ${!canScrollRight ? styles.navButtonDisabled : ''}`}
                onClick={() => scrollCarousel('right')}
                aria-label="Scroll categories right"
                disabled={!canScrollRight}
              >
                ›
              </button>
            </div>
          </>
        )}
        </div>
        <aside className={styles.rightRail} aria-label="Sponsored">
          <a
            href=""
            rel="nofollow noopener"
            target="_blank"
          >
            <img
              src="https://landings-cdn.adsterratech.com/referralBanners/png/160%20x%20600%20px.png"
              alt="Sponsored banner"
              className={styles.rightRailImage}
            />
          </a>
        </aside>
      </main>
      <Footer />
    </div>
  );
}
