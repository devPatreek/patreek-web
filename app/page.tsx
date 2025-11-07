'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { getPublicFeeds, Feed } from '@/lib/api';
import styles from './page.module.css';
import Image from 'next/image';
import ArticlePageClient from './article/[[...id]]/ArticlePageClient';
import EzoicAd from '@/components/EzoicAd';
import Footer from '@/components/Footer';

/**
 * Root page component that handles routing for GitHub Pages
 * Since GitHub Pages serves 404.html (which is a copy of index.html) for unknown routes,
 * we check if we're on an article route and render the appropriate component
 */
export default function RootPage() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [actualPath, setActualPath] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Get the actual pathname from window.location (works even with 404.html redirect)
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      setActualPath(currentPath);
      console.log('[RootPage] Initial path detected:', currentPath);
    }
  }, []);

  // Update actual path when pathname changes
  useEffect(() => {
    if (typeof window !== 'undefined' && mounted) {
      const currentPath = window.location.pathname;
      setActualPath(currentPath);
      console.log('[RootPage] Path updated:', currentPath);
    }
  }, [pathname, mounted]);

  // Check if we're on an article route
  // Use both pathname (Next.js) and window.location (for GitHub Pages 404 redirects)
  const checkArticleRoute = () => {
    if (typeof window === 'undefined') return false;
    
    // Check window.location first (most reliable for GitHub Pages)
    const windowPath = window.location.pathname;
    if (windowPath && /^\/article\/\d+/.test(windowPath)) {
      console.log('[RootPage] Article route detected from window.location:', windowPath);
      return true;
    }
    
    // Fallback to pathname (Next.js routing)
    if (pathname && /^\/article\/\d+/.test(pathname)) {
      console.log('[RootPage] Article route detected from pathname:', pathname);
      return true;
    }
    
    return false;
  };

  const isArticleRoute = checkArticleRoute();

  console.log('[RootPage] Rendering - mounted:', mounted, 'isArticleRoute:', isArticleRoute, 'pathname:', pathname, 'actualPath:', actualPath);

  // If we're on an article route, render the article page
  if (isArticleRoute) {
    return <ArticlePageClient />;
  }

  // Otherwise, render the home page
  return <LinksHomePage />;
}

/**
 * Public feed homepage for patreek.com/public/pats/
 * Shows public articles like guest users see in the app
 */
function LinksHomePage() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    // Refresh Ezoic ads when page loads (for dynamic content)
    if (typeof window !== 'undefined' && window.ezstandalone) {
      window.ezstandalone.cmd.push(function () {
        window.ezstandalone.showAds();
      });
    }
  }, []);

  // Insert ad slots every 3 articles (after 3rd, 6th, 9th, etc.) - matching mobile app
  const dataWithAdSlots = useMemo(() => {
    if (!feeds || feeds.length === 0) return [];
    
    const result: Array<{ type: 'article' | 'ad'; id: string; data?: Feed }> = [];
    
    feeds.forEach((item, index) => {
      // Add article
      result.push({ type: 'article', id: `article-${item.id}`, data: item });
      
      // Add ad slot every 3 articles (after 3rd, 6th, 9th, etc.)
      if ((index + 1) % 3 === 0) {
        result.push({ type: 'ad', id: `ad-${index}` });
      }
    });
    
    return result;
  }, [feeds]);

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
            <h2 className={styles.title}>Latest news</h2>
            <p className={styles.subtitle}>Let&apos;s read</p>
          </div>
        </div>
      </header>

      {/* UNLOCK YOUR NEWS FEED Banner - Always visible at top */}
      <div className={styles.unlockBannerTop}>
        <div className={styles.unlockBannerContent}>
          <p className={styles.unlockText}>UNLOCK YOUR NEWS FEED</p>
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
                src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                alt="Get it on Google Play"
                width={200}
                height={60}
                className={styles.storeImage}
              />
            </a>
          </div>
        </div>
      </div>

      <main className={styles.main}>
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
        ) : feeds.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No articles available at the moment.</p>
            <p className={styles.registerPrompt}>
              Register to get the latest updates from the topics you care about
            </p>
          </div>
        ) : (
          <>
            {/* Top Banner Ad Slot - Replace 101 with your actual Ezoic placement ID */}
            <EzoicAd placementId={101} showPlaceholder={true} />

            <div className={styles.feedList}>
              {dataWithAdSlots.map((item, index) => {
                if (item.type === 'ad') {
                  // In-feed ads - Replace 102 with your actual Ezoic placement ID
                  return (
                    <EzoicAd 
                      key={item.id}
                      placementId={102}
                      showPlaceholder={true}
                    />
                  );
                }

                const feed = item.data!;
                // Use absolute URL for proper routing
                const articleUrl = `https://patreek.com/public/pats/${feed.id}`;
                return (
                  <a
                    key={item.id}
                    href={articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.feedCard}
                  >
                    <div className={styles.imageWrapper}>
                      <img
                        src={feed.imageUrl || 'https://insideskills.pl/wp-content/uploads/2024/01/placeholder-6.png'}
                        alt={feed.title}
                        className={styles.image}
                      />
                      <div className={styles.categoryBadge}>
                        <span className={styles.categoryText}>{feed.categoryName}</span>
                      </div>
                    </div>
                    <div className={styles.content}>
                      <h2 className={styles.feedTitle}>{feed.title}</h2>
                    </div>
                  </a>
                );
              })}
            </div>
            
            {/* Bottom Banner Ad Slot - Replace 103 with your actual Ezoic placement ID */}
            <EzoicAd placementId={103} showPlaceholder={true} />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

