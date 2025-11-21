'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getPublicFeed, FeedArticle, getPublicFeeds, Feed } from '@/lib/api';
import { getCachedArticle, setCachedArticle } from '@/lib/cache';
import ArticleReader from '@/components/ArticleReader';
import styles from '../../../page.module.css';
import Image from 'next/image';
import Footer from '@/components/Footer';

/**
 * Handles both /public/pats/ (homepage) and /public/pats/{id} (article) routes
 */
export default function PublicPatsPageClient() {
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
      // Match /public/pats/{id} format (but not just /public/pats/)
      const windowMatch = windowPath.match(/^\/public\/pats\/(\d+)$/);
      if (windowMatch) {
        articleId = parseInt(windowMatch[1], 10);
        routeIsArticle = true;
      } else if (windowPath === '/public/pats' || windowPath === '/public/pats/') {
        routeIsArticle = false;
      }
    }
    
    // Fallback to pathname
    if (!articleId && pathname) {
      const pathnameMatch = pathname.match(/^\/public\/pats\/(\d+)$/);
      if (pathnameMatch) {
        articleId = parseInt(pathnameMatch[1], 10);
        routeIsArticle = true;
      } else if (pathname === '/public/pats' || pathname === '/public/pats/') {
        routeIsArticle = false;
      }
    }

    setIsArticleRoute(routeIsArticle);

    if (routeIsArticle && articleId) {
      loadArticle(articleId);
    } else {
      loadFeeds();
    }
  }, [pathname, getBypassParam]);

  async function loadFeeds() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getPublicFeeds();
      setFeeds(data);
    } catch (err) {
      console.warn('[PublicPatsHomePage] Failed to load feeds:', err);
      setFeeds([]);
    } finally {
      setIsLoading(false);
    }

    // Ad space reserved for future ad network integration
  }

  async function loadArticle(articleId: number) {
    try {
      setIsLoading(true);
      console.log(`[PublicPatsArticlePage] Loading article ${articleId}...`);
      
      // Check for bypass parameter - if present, don't use cache (to ensure bypass works)
      const hasBypass = getBypassParam.includes('bypass=ag3nt007');
      
      // Check cache first (only if no bypass)
      if (!hasBypass) {
        const cached = getCachedArticle(articleId);
        if (cached) {
          console.log(`[PublicPatsArticlePage] Using cached article ${articleId}`);
          setArticle(cached);
          setError(null);
          setIsLoading(false);
          return;
        }
      }

      // Fetch from API if not in cache or if bypass is enabled
      console.log(`[PublicPatsArticlePage] Fetching article ${articleId} from API${hasBypass ? ' (bypass enabled)' : ''}`);
      const data = await getPublicFeed(articleId);
      if (!data) {
        console.log(`[PublicPatsArticlePage] Article ${articleId} not found or not public`);
        setError('Article not found or not available');
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/public/pats/';
          }
        }, 2000);
        return;
      }
      
      // Cache the article for 7 days
      setCachedArticle(articleId, data);
      setArticle(data);
      setError(null);
      console.log(`[PublicPatsArticlePage] Successfully loaded article ${articleId}: ${data.title}`);
      
      // Ad space reserved for future ad network integration
    } catch (err) {
      console.error('[PublicPatsArticlePage] Failed to load article:', err);
      setError('Failed to load article. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }

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

  const categoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('business')) return '💼';
    if (lower.includes('tech') || lower.includes('ai')) return '🤖';
    if (lower.includes('entertain')) return '📺';
    if (lower.includes('sports')) return '🏅';
    if (lower.includes('health')) return '🩺';
    if (lower.includes('finance')) return '📈';
    return '⚡';
  };

  const handleNavigate = (id: number) => {
    const articleUrl = `/public/pats/${id}${getBypassParam}`;
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
          <a href={`/public/pats${getBypassParam}`} style={{ marginTop: '16px', color: '#667eea', textDecoration: 'underline' }}>
            ← Back to Home
          </a>
        </div>
      );
    }

    return <ArticleReader article={article} />;
  }

  // Render homepage
  return (
    <div className={styles.container}>
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
            <h2 className={styles.title}>Latest pats</h2>
            <p className={styles.subtitle}>Let&apos;s read</p>
          </div>
        </div>
      </header>

      {/* Pat Definition Section */}
      <div className={styles.definitionSection}>
        <div className={styles.definitionContent}>
          <div className={styles.definitionWord}>
            <span className={styles.definitionWordText}>Pat</span>
            <span className={styles.definitionPartOfSpeech}>verb</span>
          </div>
          <div className={styles.definitionMeaning}>
            <span className={styles.definitionColon}>:</span>
            <span className={styles.definitionText}>
              to tap or stroke a news card gently with the hand to soothe, or show approval
            </span>
          </div>
        </div>
      </div>

      {/* UNLOCK YOUR PATS Banner */}
      <div className={styles.unlockBannerTop}>
        <div className={styles.unlockBannerContent}>
          <p className={styles.unlockText}>UNLOCK YOUR PATS</p>
          <p className={styles.unlockDescription}>
            Register to get the latest updates from the topics{' '}
            <span className={styles.unlockUnderline}>you</span> care about
          </p>
          <div className={styles.storeButtons}>
            <a
              href="https://apps.apple.com/us/app/patreek/id6547858283"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.storeLink}
            >
              <Image
                src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/67a3729b558347b9bf210a5a_Store%3DApp%20Store%2C%20Type%3DDark%2C%20Language%3DEnglish%402x.png"
                alt="Download on App Store"
                width={200}
                height={60}
                className={styles.storeImage}
              />
            </a>
            <a
              href="#"
              className={styles.storeLink}
            >
              <Image
                src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/67a3727c8abb3515ab42d712_Store%3DGoogle%20Play%2C%20Type%3DDark%2C%20Language%3DEnglish%402x.png"
                alt="Get it on Google Play"
                width={200}
                height={60}
                className={styles.storeImage}
              />
            </a>
          </div>
        </div>
      </div>

      {/* Ads disabled */}

      <div className={styles.main}>
        {isLoading ? (
          <div className={styles.emptyState}>
            <p>Loading articles...</p>
          </div>
        ) : groupedFeeds.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No articles available at the moment. Register to get the latest updates from the topics you care about</p>
          </div>
        ) : (
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
                      <span className={styles.categoryIcon}>{categoryIcon(group.category)}</span>
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
        )}
      </div>

      {/* Ads disabled */}

      <Footer />
    </div>
  );
}
