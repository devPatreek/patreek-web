import { useEffect, useMemo, useState } from 'react';
import styles from './NewsCard.module.css';

export interface FeedItemProps {
  title: string;
  summary?: string;
  source?: string;
  createdAt: string;
  patCount: number;
  avatarUrl?: string;
  isPattedByCurrentUser?: boolean;
}

export default function NewsCard({
  title,
  summary,
  source,
  createdAt,
  patCount,
  avatarUrl,
  isPattedByCurrentUser = false,
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
          hour: 'numeric',
          minute: '2-digit',
        });
  }, [createdAt]);

  const handlePat = () => {
    setHasPat((prev) => {
      const next = !prev;
      setLocalPatCount((prevCount) => Math.max(0, prevCount + (next ? 1 : -1)));
      return next;
    });

    // Future: fire API call here.
  };

  const initials = useMemo(() => {
    if (avatarUrl) return null;
    const words = title.split(' ').slice(0, 2);
    return words.map((w) => w[0]).join('').toUpperCase();
  }, [title, avatarUrl]);

  return (
    <article className={styles.card}>
      <div className={styles.avatar}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="Feed avatar" loading="lazy" />
        ) : (
          <span>{initials || 'X'}</span>
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>{title}</h3>
            {summary && <p className={styles.summary}>{summary}</p>}
          </div>
          <button
            className={`${styles.patButton} ${hasPat ? styles.active : ''}`}
            onClick={handlePat}
            aria-pressed={hasPat}
            type="button"
          >
            <span className={styles.emoji}>{hasPat ? '🧡' : '🤍'}</span>
            <span>{localPatCount ?? 0}</span>
          </button>
        </div>
        <div className={styles.meta}>
          {source && <span className={styles.source}>{source}</span>}
          <span className={styles.date}>{formattedDate}</span>
        </div>
      </div>
    </article>
  );
}
