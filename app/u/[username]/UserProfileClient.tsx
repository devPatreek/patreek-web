'use client';

import { useEffect, useMemo, useState } from 'react';
import MainHeader from '@/components/MainHeader';
import Footer from '@/components/Footer';
import ProfileHeader from '@/components/profile/ProfileHeader';
import FeedList from '@/components/feed/FeedList';
import { getUserProfileByUsername } from '@/lib/api';
import styles from './page.module.css';

const tabConfig = [
  { key: 'curated', label: 'Curated Feeds', endpoint: 'feeds?tab=curated' },
  { key: 'pats', label: 'Pats', endpoint: 'pats' },
  { key: 'comments', label: 'Comments', endpoint: 'comments' },
];

export default function UserProfileClient({ params }: { params: { username: string } }) {
  const username = params?.username;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(tabConfig[0].key);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    getUserProfileByUsername(username)
      .then((user) => {
        if (cancelled) return;
        if (!user) {
          setError('User not found');
          return;
        }
        setProfile(user);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('[Profile] failed to load profile', err);
        setError('Unable to load profile');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  const handleToggleFollow = async (nextState: boolean) => {
    if (!username) {
      throw new Error('Username unavailable');
    }
    const path = nextState ? 'follow' : 'unfollow';
    const response = await fetch(`/api/v1/users/${username}/${path}`, {
      method: nextState ? 'POST' : 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to update follow status');
    }
  };

  const bannerImage = profile?.bannerUrl;
  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })
    : undefined;

  const activeEndpoint = useMemo(() => {
    const config = tabConfig.find((tab) => tab.key === activeTab);
    return config && username ? `/api/v1/users/${username}/${config.endpoint}` : '';
  }, [activeTab, username]);

  if (!username) {
    return null;
  }

  return (
    <div className={styles.page}>
      <MainHeader />

      <main className={styles.main}>
        {loading && <div className={styles.bannerLoading}>Loading profile…</div>}
        {error && <div className={styles.bannerError}>{error}</div>}
        {!loading && profile && (
          <ProfileHeader
            bannerUrl={bannerImage}
            avatarUrl={profile.avatarUrl}
            name={profile.fullName || profile.name || profile.username || 'Patreek User'}
            username={profile.username || username}
            bio={profile.bio || profile.headline}
            joinDate={joinDate}
            followersCount={profile.followersCount ?? 0}
            followingCount={profile.followingCount ?? 0}
            patsReceived={profile.totalPats ?? 0}
            isFollowing={profile.isFollowing}
            onToggleFollow={handleToggleFollow}
          />
        )}

        <div className={styles.tabs}>
          {tabConfig.map((tab) => (
            <button
              key={tab.key}
              className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeEndpoint && (
          <div className={styles.feedArea}>
            <FeedList fetchUrl={activeEndpoint} queryKey={`${username}-${activeTab}`} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
