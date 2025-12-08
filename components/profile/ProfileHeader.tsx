import { useState } from 'react';
import styles from './ProfileHeader.module.css';

interface ProfileHeaderProps {
  bannerUrl?: string;
  avatarUrl?: string;
  name: string;
  username: string;
  bio?: string;
  joinDate?: string;
  followersCount?: number;
  followingCount?: number;
  patsReceived?: number;
  isFollowing?: boolean;
  onToggleFollow: (nextState: boolean) => Promise<void>;
}

export default function ProfileHeader({
  bannerUrl,
  avatarUrl,
  name,
  username,
  bio,
  joinDate,
  followersCount = 0,
  followingCount = 0,
  patsReceived = 0,
  isFollowing = false,
  onToggleFollow,
}: ProfileHeaderProps) {
  const [following, setFollowing] = useState(isFollowing);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    const nextState = !following;
    setFollowing(nextState);
    setLoading(true);
    try {
      await onToggleFollow(nextState);
    } catch (error) {
      setFollowing(!nextState);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.header}>
      <div className={styles.banner}>
        {bannerUrl ? <img src={bannerUrl} alt={`${name} banner`} /> : null}
      </div>
      <div className={styles.avatarWrapper}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={`${name} avatar`} />
        ) : (
          <div className={styles.avatarFallback}>{name[0]}</div>
        )}
      </div>

      <div className={styles.meta}>
        <div className={styles.flexRow}>
          <div>
            <h1>{name}</h1>
            <p className={styles.handle}>@{username}</p>
          </div>
          <button
            className={`${styles.followBtn} ${following ? styles.following : ''}`}
            onClick={handleToggle}
            disabled={loading}
          >
            {following ? 'Following' : 'Follow'}
          </button>
        </div>
        {bio && <p className={styles.bio}>{bio}</p>}
        <div className={styles.date}>{joinDate ? `Joined ${joinDate}` : 'Joined recently'}</div>
        <div className={styles.statsRow}>
          <div>
            <span>{followersCount.toLocaleString()}</span>
            <p>Followers</p>
          </div>
          <div>
            <span>{followingCount.toLocaleString()}</span>
            <p>Following</p>
          </div>
          <div>
            <span>{patsReceived.toLocaleString()}</span>
            <p>Pats Received</p>
          </div>
        </div>
      </div>
    </section>
  );
}
