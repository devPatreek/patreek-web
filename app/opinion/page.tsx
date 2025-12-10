'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';
import { getOpinions, Opinion } from '@/lib/api';

const appNav = ['Coins', 'Store', 'Media', 'Community', 'Opinion'];
const categoryPills = ['All', 'Tech', 'Politics', 'Sports', 'Crypto'];

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function extractTitle(content: string): string {
  // Extract first sentence or first 100 chars
  const sentenceEnd = content.search(/[.!?]/);
  if (sentenceEnd > 0 && sentenceEnd < 200) {
    return content.substring(0, sentenceEnd + 1);
  }
  return content.length > 100 ? content.substring(0, 100) + '...' : content;
}

function extractDek(content: string): string {
  // Extract second sentence or content after first sentence
  const firstSentenceEnd = content.search(/[.!?]/);
  if (firstSentenceEnd > 0) {
    const remaining = content.substring(firstSentenceEnd + 1).trim();
    const secondSentenceEnd = remaining.search(/[.!?]/);
    if (secondSentenceEnd > 0) {
      return remaining.substring(0, secondSentenceEnd + 1);
    }
    return remaining.length > 150 ? remaining.substring(0, 150) + '...' : remaining;
  }
  return content.length > 150 ? content.substring(0, 150) + '...' : content;
}

export default function OpinionPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredOpinions = useMemo(() => {
    if (activeCategory === 'All') return opinions;
    return opinions.filter(
      opinion => opinion.categoryName?.toLowerCase() === activeCategory.toLowerCase()
    );
  }, [opinions, activeCategory]);

  useEffect(() => {
    const fetchOpinions = async () => {
      try {
        setLoading(true);
        const data = await getOpinions(0, 20);
        setOpinions(data.content);
      } catch (err: any) {
        console.error('Error fetching opinions:', err);
        setError(err.message || 'Failed to load opinions');
      } finally {
        setLoading(false);
      }
    };

    fetchOpinions();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.mobileNavWrap}>
        <button
          className={styles.mobileNavButton}
          type="button"
          aria-label="Open navigation"
          onClick={() => setDrawerOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
        {drawerOpen && (
          <div className={styles.drawer} role="dialog" aria-label="Navigation menu">
            <div className={styles.drawerHeader}>
              <span className={styles.drawerTitle}>Navigate</span>
              <button
                className={styles.closeButton}
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
              >
                ✕
              </button>
            </div>
            <div className={styles.drawerLinks}>
              {appNav.map(item => (
                <button key={item} className={styles.drawerLink} type="button">
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <header className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.kicker}>Perspectives from Patreek Pundits</p>
          <h1 className={styles.title}>Opinion</h1>
        </div>
      </header>

      <div className={styles.filterBar}>
          {categoryPills.map(category => (
            <button
              key={category}
              type="button"
              className={`${styles.filterPill} ${activeCategory === category ? styles.activePill : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

      <main className={styles.feed}>
        {loading && <div style={{ padding: '40px', textAlign: 'center' }}>Loading opinions...</div>}
        {error && <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>Error: {error}</div>}
        {!loading && !error && filteredOpinions.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center' }}>No opinions found.</div>
        )}
        {!loading && !error && filteredOpinions.map(item => {
          const title = extractTitle(item.content);
          const dek = extractDek(item.content);
          const ageLabel = formatTimeAgo(item.timestamp);
          
          return (
            <article key={item.id} className={styles.card}>
              <div className={styles.meta}>
                <span className={styles.timestamp}>{ageLabel}</span>
                {item.categoryName && <span className={styles.tag}>{item.categoryName}</span>}
              </div>
              <div className={styles.cardBody}>
                <div className={styles.textBlock}>
                  <h2 className={styles.headline}>{title}</h2>
                  <p className={styles.dek}>{dek}</p>
                  <p className={styles.author}>{item.userName || 'Anonymous'}</p>
                </div>
                {item.image && (
                  <div className={styles.imageWrapper}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={title} className={styles.image} />
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </main>
    </div>
  );
}
