'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import {
  Category,
  Feed,
  getUserCategoriesAuth,
  getUserFeedsAuth,
  getUserFeedsByCategoryAuth,
  getUserProfile,
  UserProfile,
} from '@/lib/api';

type Status = 'idle' | 'loading' | 'error';

export default function HomePage() {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all');
  const [status, setStatus] = useState<Status>('idle');
  const [feedsStatus, setFeedsStatus] = useState<Status>('idle');

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('patreek_session') : null;
    if (stored) {
      setToken(stored);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    setStatus('loading');
    Promise.all([getUserProfile(token), getUserCategoriesAuth(token)])
      .then(([profileData, cats]) => {
        if (!mounted) return;
        setProfile(profileData);
        setCategories(cats || []);
        setStatus('idle');
      })
      .catch(() => {
        if (!mounted) return;
        setStatus('error');
      });
    return () => {
      mounted = false;
    };
  }, [token]);

  const loadFeeds = async (categoryId?: number) => {
    if (!token) return;
    setFeedsStatus('loading');
    const data = categoryId
      ? await getUserFeedsByCategoryAuth(token, categoryId)
      : await getUserFeedsAuth(token);
    setFeeds(data || []);
    setFeedsStatus('idle');
  };

  useEffect(() => {
    if (!token) return;
    loadFeeds();
  }, [token]);

  const initials = useMemo(() => {
    if (!profile?.name) return 'P';
    return profile.name
      .split(' ')
      .map(part => part[0]?.toUpperCase())
      .join('')
      .slice(0, 2);
  }, [profile?.name]);

  const stats = [
    { label: 'Pats', value: profile?.totalPats ?? 0 },
    { label: 'Comments', value: profile?.totalComments ?? 0 },
    { label: 'Shares', value: profile?.totalShares ?? 0 },
    { label: 'Coins', value: profile?.coins ?? 0 },
  ];

  const navTabs = useMemo(() => {
    const base = [{ id: 'all' as const, name: 'All' }];
    const subs = categories.flatMap(cat => {
      const children = cat.children || [];
      return children.map(child => ({ id: child.id, name: child.name }));
    });
    return [...base, ...subs];
  }, [categories]);

  if (!token) {
    return (
      <div className={styles.gate}>
        <h2 className={styles.gateTitle}>Sign in to view your personalized pats</h2>
        <Link className={styles.gateButton} href="/registration">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.cover}>
        <div className={styles.coverImage} />
        <div className={styles.avatar}>
          <span>{initials}</span>
        </div>
        <div className={styles.profileMeta}>
          <div className={styles.profileNameRow}>
            <h1 className={styles.name}>{profile?.name || 'Patreek User'}</h1>
            {profile?.username && <span className={styles.username}>@{profile.username}</span>}
          </div>
          {profile?.createdAt && (
            <div className={styles.joined}>
              <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>
          )}
          <div className={styles.statsRow}>
            {stats.map(stat => (
              <div key={stat.label} className={styles.stat}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <nav className={styles.tabs} aria-label="Subscriptions">
        {navTabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeCategory === tab.id ? styles.tabActive : ''}`}
            onClick={() => {
              setActiveCategory(tab.id);
              if (tab.id === 'all') loadFeeds();
              else loadFeeds(tab.id as number);
            }}
          >
            {tab.name}
          </button>
        ))}
      </nav>

      <main className={styles.timeline}>
        {feedsStatus === 'loading' ? (
          <div className={styles.muted}>Loading your pats…</div>
        ) : feeds.length === 0 ? (
          <div className={styles.muted}>No pats yet in this lane.</div>
        ) : (
          feeds.map(feed => (
            <article key={feed.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardCategory}>{feed.categoryName}</span>
                {feed.createdAt && (
                  <span className={styles.cardDate}>
                    {new Date(feed.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <h3 className={styles.cardTitle}>{feed.title}</h3>
              {feed.imageUrl && (
                <div className={styles.cardImageWrapper}>
                  <img src={feed.imageUrl} alt={feed.title} className={styles.cardImage} />
                </div>
              )}
            </article>
          ))
        )}
      </main>
    </div>
  );
}
