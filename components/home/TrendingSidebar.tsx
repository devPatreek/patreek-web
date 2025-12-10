'use client';

import styles from './TrendingSidebar.module.css';
import { Feed } from '@/lib/api';

interface TrendingSidebarProps {
  items: Feed[];
}

export default function TrendingSidebar({ items }: TrendingSidebarProps) {
  if (!items.length) {
    return (
      <div className={styles.empty}>
        <p className={styles.title}>Trending</p>
        <p className={styles.emptyCopy}>Fresh stories will appear soon.</p>
      </div>
    );
  }

  return (
    <div className={styles.sidebar}>
      <p className={styles.title}>Trending</p>
      <ol className={styles.list}>
        {items.slice(0, 5).map((item, index) => (
          <li key={item.id} className={styles.item}>
            <span className={styles.index}>{index + 1}</span>
            <div>
              <p className={styles.headline}>{item.title}</p>
              <span className={styles.meta}>{item.categoryName}</span>
            </div>
            {item.imageUrl && (
              <img src={item.imageUrl} alt="" className={styles.thumbnail} />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
