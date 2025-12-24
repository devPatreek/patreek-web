import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './NewsCard.module.css';

export interface FeedItemProps {
  id: number | string;
  title: string;
  summary?: string;
  source?: string;
  createdAt: string;
  patCount: number;
  thumbnailUrl?: string;
  isPattedByCurrentUser?: boolean;
  requiresAuth?: boolean;
  onAuthWall?: (action: string) => void;
}

export default function NewsCard({
  id,
  title,
  summary,
  source,
  createdAt,
  patCount,
  thumbnailUrl,
  isPattedByCurrentUser = false,
  requiresAuth = false,
  onAuthWall,
}: FeedItemProps) {
  const [hasPat, setHasPat] = useState(Boolean(isPattedByCurrentUser));
  const [localPatCount, setLocalPatCount] = useState(patCount);

  useEffect(() => {
    setLocalPatCount(patCount);
  }, [patCount]);

  useEffect(() => {
    setHasPat(Boolean(isPattedByCurrentUser));
  }, [isPattedByCurrentUser]);

  const formattedDate = useMemo(() => {
    const date = new Date(createdAt);
    return Number.isNaN(date.getTime())
      ? createdAt
      : date.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
  }, [createdAt]);

  const handlePat = () => {
    if (requiresAuth && onAuthWall) {
      onAuthWall('pat this story');
      return;
    }

    setHasPat((prev) => {
      const next = !prev;
      setLocalPatCount((prevCount) => Math.max(0, prevCount + (next ? 1 : -1)));
      return next;
    });
  };

  return (
    <article className={styles.card}>
      <Link href={`/pat/${id}`} className={styles.interactiveArea}>
        <div className={styles.thumbnail}>
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="" loading="lazy" />
          ) : (
            <span className={styles.fallback}>Patreek</span>
          )}
        </div>
        <div className={styles.body}>
          <div>
            <h3 className={styles.title}>{title}</h3>
            {summary && <p className={styles.summary}>{summary}</p>}
          </div>
          <div className={styles.meta}>
            {source && <span className={styles.source}>{source}</span>}
            <span className={styles.date}>{formattedDate}</span>
          </div>
        </div>
      </Link>
      <button
        className={`${styles.patButton} ${hasPat ? styles.active : ''}`}
        onClick={handlePat}
        aria-pressed={hasPat}
        type="button"
      >
        <span className={styles.emoji}>{hasPat ? '🧡' : '🤍'}</span>
        <span>{localPatCount ?? 0}</span>
      </button>
    </article>
  );
}
