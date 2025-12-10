'use client';

import Link from 'next/link';
import styles from './HeroCard.module.css';
import { Feed } from '@/lib/api';

interface HeroCardProps {
  article?: Feed;
}

export default function HeroCard({ article }: HeroCardProps) {
  if (!article) {
    return (
      <div className={styles.placeholder}>
        <p className={styles.placeholderTitle}>Stories curated for you</p>
        <p className={styles.placeholderCopy}>Check back once we load today’s spotlight.</p>
      </div>
    );
  }

  return (
    <Link href={`/pat/${article.id}`} className={styles.heroCard}>
      <div
        className={styles.media}
        style={{ backgroundImage: `linear-gradient(180deg, rgba(2,2,2,0.2), rgba(2,2,2,0.75)), url(${article.imageUrl})` }}
      >
        <div className={styles.overlay}>
          <p className={styles.tag}>{article.categoryName}</p>
          <h2 className={styles.title}>{article.title}</h2>
          {article.excerpt && <p className={styles.copy}>{article.excerpt}</p>}
        </div>
      </div>
    </Link>
  );
}
