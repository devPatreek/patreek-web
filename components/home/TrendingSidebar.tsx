'use client';

import Link from 'next/link';

import styles from './TrendingSidebar.module.css';
import { Feed } from '@/lib/api';

interface TrendingSidebarProps {
  items: Feed[];
  onSubscribe?: () => void;
}

export default function TrendingSidebar({ items, onSubscribe }: TrendingSidebarProps) {
  if (!items.length) {
    return (
      <div className={styles.empty}>
        <p className={styles.title}>Trending</p>
        <p className={styles.emptyCopy}>Fresh stories will appear soon.</p>
        {onSubscribe && (
          <button type="button" className={styles.subscribeButton} onClick={onSubscribe}>
            Subscribe
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.headerRow}>
        <p className={styles.title}>Trending</p>
        {onSubscribe && (
          <button type="button" className={styles.subscribeButton} onClick={onSubscribe}>
            Subscribe
          </button>
        )}
      </div>
      <ol className={styles.list}>
        {items.slice(0, 5).map((item, index) => (
          <li key={item.id} className={styles.listItem}>
            <Link
              href={`/pat/${item.id}`}
              className={styles.item}
              aria-label={`Read ${item.title}`}
            >
              <span className={styles.index}>{index + 1}</span>
              <div>
                <p className={styles.headline}>{item.title}</p>
                <span className={styles.meta}>{item.categoryName}</span>
              </div>
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.title} className={styles.thumbnail} />
              )}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
