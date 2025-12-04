'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './TrendingNewsWidget.module.css';

interface TrendingNewsItem {
  id: number;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

interface TrendingNewsWidgetProps {
  countryCode?: string; // User's country code (from profile or IP)
}

export default function TrendingNewsWidget({ countryCode }: TrendingNewsWidgetProps) {
  const [news, setNews] = useState<TrendingNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detectedCountry, setDetectedCountry] = useState<string>('US');

  useEffect(() => {
    const fetchTrendingNews = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Determine country code
        let country = countryCode;
        if (!country) {
          // Detect from IP for guests
          try {
            const ipResponse = await fetch('https://ipapi.co/json/');
            if (ipResponse.ok) {
              const ipData = await ipResponse.json();
              country = ipData.country_code || 'US';
              setDetectedCountry(country || 'US');
            } else {
              country = 'US';
              setDetectedCountry('US');
            }
          } catch (ipError) {
            country = 'US';
            setDetectedCountry('US');
          }
        } else {
          setDetectedCountry(country || 'US');
        }

        // TODO: Replace with actual trending news API endpoint
        // For now, using a placeholder that will be replaced with the actual endpoint
        // The endpoint should accept country code and return trending news
        const newsResponse = await fetch(
          `https://api.patreek.com/api/v1/news/trending?country=${country}`,
          {
            headers: {
              Accept: 'application/json',
            },
            credentials: 'include',
          }
        );

        if (!newsResponse.ok) {
          // Fallback to mock data if endpoint doesn't exist yet
          setNews([
            {
              id: 1,
              title: 'Breaking: Major development in local news',
              url: '#',
              source: 'Local News',
              publishedAt: new Date().toISOString(),
            },
            {
              id: 2,
              title: 'Trending story captures national attention',
              url: '#',
              source: 'National News',
              publishedAt: new Date().toISOString(),
            },
            {
              id: 3,
              title: 'Local community celebrates major milestone',
              url: '#',
              source: 'Community News',
              publishedAt: new Date().toISOString(),
            },
          ]);
          setIsLoading(false);
          return;
        }

        const data = await newsResponse.json();
        setNews(Array.isArray(data) ? data : data?.articles || data?.content || []);
      } catch (err) {
        console.error('Error fetching trending news:', err);
        setError('Unable to load trending news');
        // Set fallback data
        setNews([
          {
            id: 1,
            title: 'Breaking: Major development in local news',
            url: '#',
            source: 'Local News',
            publishedAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingNews();
  }, [countryCode]);

  if (isLoading) {
    return (
      <div className={styles.widget}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerBar}></div>
            <span className={styles.headerTitle}>Trending Local News</span>
          </div>
        </div>
        <div className={styles.loading}>Loading trending news...</div>
      </div>
    );
  }

  if (error && news.length === 0) {
    return (
      <div className={styles.widget}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerBar}></div>
            <span className={styles.headerTitle}>Trending Local News</span>
          </div>
        </div>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerBar}></div>
          <span className={styles.headerTitle}>Trending Local News</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.country}>{detectedCountry}</span>
        </div>
      </div>

      <div className={styles.newsList}>
        {news.length === 0 ? (
          <div className={styles.empty}>No trending news available</div>
        ) : (
          news.slice(0, 5).map((item) => (
            <Link key={item.id} href={item.url || '#'} className={styles.newsItem}>
              <div className={styles.newsContent}>
                <h4 className={styles.newsTitle}>{item.title}</h4>
                <div className={styles.newsMeta}>
                  <span className={styles.newsSource}>{item.source}</span>
                  {item.publishedAt && (
                    <span className={styles.newsDate}>
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <span className={styles.newsArrow}>→</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
