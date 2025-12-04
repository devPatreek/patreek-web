'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MainHeader from '@/components/MainHeader';
import Footer from '@/components/Footer';
import {
  UserProfile,
  Category,
  Feed,
  checkSessionStatus,
  getUserProfile,
  getUserProfileByUsername,
  getUserCategoriesAuth,
  getUserFeedsByCategoryAuth,
  uploadAvatar,
} from '@/lib/api';
import styles from './page.module.css';

type LoadStatus = 'loading' | 'ready' | 'error';

export default function UserProfileClient({ params }: { params: { username: string } }) {
  const router = useRouter();
  const urlParams = useParams();
  const username = params?.username || (urlParams?.username as string) || '';

  const [viewedUser, setViewedUser] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [catLoading, setCatLoading] = useState(false);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const navLinks = useMemo(
    () => [
      { label: 'Home', href: '/' },
      { label: 'Notifications', href: '/notifications' },
      { label: 'Nest', href: '/nest' },
      { label: 'Bookmarks', href: '/bookmarks' },
      { label: 'Communities', href: '/communities' },
      { label: 'Premium', href: '/premium' },
      { label: 'Profile', href: currentUser?.username ? `/u/${currentUser.username}` : '/profile' },
      { label: 'Support', href: '/support' },
    ],
    [currentUser?.username]
  );

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      setStatus('loading');
      try {
        const profile = await getUserProfileByUsername(username);
        if (!mounted) return;
        if (!profile) {
          setStatus('error');
          return;
        }
        setViewedUser(profile);
        setStatus('ready');
      } catch (error) {
        console.warn('[Profile] failed to load profile', error);
        if (mounted) setStatus('error');
      }
    };
    if (username) {
      loadProfile();
    }
    return () => {
      mounted = false;
    };
  }, [username]);

  useEffect(() => {
    let mounted = true;
    const initSession = async () => {
      try {
        const session = await checkSessionStatus();
        if (!mounted) return;
        const authenticated = (session as any).isAuthenticated ?? session.authenticated ?? false;
        setHasSession(authenticated);
        if (authenticated) {
          const me = await getUserProfile();
          if (!mounted) return;
          setCurrentUser(me);
          setIsOwner(me?.username?.toLowerCase() === username.toLowerCase());
        } else {
          setIsOwner(false);
        }
      } catch (error) {
        console.warn('[Profile] session check failed', error);
      }
    };
    initSession();
    return () => {
      mounted = false;
    };
  }, [username]);

  const loadCategories = useCallback(async () => {
    setCatLoading(true);
    try {
      const cats = await getUserCategoriesAuth();
      setCategories(cats || []);
      if (cats && cats.length > 0) {
        setSelectedCategoryId(cats[0].id);
      }
    } catch (error) {
      console.warn('[Profile] load categories failed', error);
    } finally {
      setCatLoading(false);
    }
  }, []);

  const loadFeeds = useCallback(
    async (categoryId: number | null) => {
      if (!categoryId) return;
      setFeedLoading(true);
      try {
        const data = await getUserFeedsByCategoryAuth(undefined, categoryId);
        setFeeds(data || []);
      } catch (error) {
        console.warn('[Profile] load feeds failed', error);
      } finally {
        setFeedLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!hasSession) return;
    loadCategories();
  }, [hasSession, loadCategories]);

  useEffect(() => {
    if (selectedCategoryId) {
      loadFeeds(selectedCategoryId);
    }
  }, [selectedCategoryId, loadFeeds]);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwner) return;
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setAvatarUploading(true);
      const updated = await uploadAvatar(file);
      if (updated) {
        setViewedUser(prev => (prev ? { ...prev, avatarUrl: updated } : prev));
        setCurrentUser(prev => (prev ? { ...prev, avatarUrl: updated } : prev));
      }
    } catch (error) {
      console.error('[Profile] avatar upload failed', error);
    } finally {
      setAvatarUploading(false);
    }
  };

  const selectedCategory = useMemo(
    () => categories.find(c => c.id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  const profileMeta = useMemo(() => {
    if (!viewedUser) return null;
    return [
      viewedUser.location && { icon: '📍', text: viewedUser.location },
      viewedUser.website && {
        icon: '🔗',
        text: viewedUser.website,
        href: viewedUser.website.startsWith('http') ? viewedUser.website : `https://${viewedUser.website}`,
      },
      viewedUser.createdAt && {
        icon: '📅',
        text: `Joined ${new Date(viewedUser.createdAt).toLocaleDateString()}`,
      },
      viewedUser.rank && {
        icon: '🎖️',
        text: viewedUser.rank.name || (viewedUser.rank.level ? `Level ${viewedUser.rank.level}` : 'Ranked'),
      },
    ].filter(Boolean) as { icon: string; text: string; href?: string }[];
  }, [viewedUser]);

  const avatar = viewedUser?.avatarUrl;

  return (
    <div className={styles.page}>
      <MainHeader />

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <button className={styles.navToggle} onClick={() => setNavOpen(!navOpen)}>
            ☰
          </button>
          <nav className={`${styles.navLinks} ${navOpen ? styles.navOpen : ''}`}>
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className={styles.navItem}>
                {link.label}
              </Link>
            ))}
          </nav>
          {isOwner && (
            <button className={styles.editProfileBtn} onClick={() => router.push('/profile')}>
              Edit Profile
            </button>
          )}
        </aside>

        <main className={styles.content}>
          <div className={styles.banner} />
          <div className={styles.profileHeader}>
            <div className={styles.avatarWrapper}>
              {avatar ? <img src={avatar} alt={viewedUser?.username || 'avatar'} /> : <div className={styles.avatarFallback}>😊</div>}
              {isOwner && (
                <label className={styles.avatarUpload}>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={avatarUploading} />
                  {avatarUploading ? 'Uploading...' : 'Change'}
                </label>
              )}
            </div>
            <div className={styles.profileText}>
              <h1>{viewedUser?.fullName || viewedUser?.username || 'User'}</h1>
              <p className={styles.handle}>@{viewedUser?.username}</p>
              {viewedUser?.bio && <p className={styles.bio}>{viewedUser.bio}</p>}
              <div className={styles.metaRow}>
                {profileMeta?.map((item, idx) =>
                  item.href ? (
                    <a key={idx} href={item.href} target="_blank" rel="noreferrer" className={styles.metaItem}>
                      <span>{item.icon}</span> {item.text}
                    </a>
                  ) : (
                    <span key={idx} className={styles.metaItem}>
                      <span>{item.icon}</span> {item.text}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          <div className={styles.chipsRow}>
            {catLoading && <span className={styles.muted}>Loading categories…</span>}
            {!catLoading &&
              categories.map(cat => (
                <button
                  key={cat.id}
                  className={`${styles.chip} ${selectedCategoryId === cat.id ? styles.chipActive : ''}`}
                  onClick={() => setSelectedCategoryId(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
          </div>

          <div className={styles.feedList}>
            {feedLoading && <div className={styles.muted}>Loading feeds…</div>}
            {!feedLoading && feeds.length === 0 && <div className={styles.muted}>No posts yet in {selectedCategory?.name || 'this category'}.</div>}
            {!feedLoading &&
              feeds.map(item => (
                <div
                  key={item.id}
                  className={styles.feedCard}
                  onClick={() => router.push(`/pat/${item.id}`)}
                >
                  <div className={styles.feedThumb}>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : <div className={styles.thumbFallback}>📖</div>}
                  </div>
                  <div className={styles.feedBody}>
                    <div className={styles.feedMeta}>
                      <span className={styles.feedSource}>{item.source || 'Patreek'}</span>
                      <span className={styles.feedDate}>
                        {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <h3 className={styles.feedTitle}>{item.title}</h3>
                    {item.description && <p className={styles.feedDesc}>{item.description}</p>}
                  </div>
                </div>
              ))}
          </div>
        </main>

        <aside className={styles.widgets}>
          <div className={styles.widgetCard}>
            <h4>Widgets</h4>
            <p className={styles.muted}>Personalized slots coming soon.</p>
          </div>
        </aside>
      </div>

      <Footer />
    </div>
  );
}
