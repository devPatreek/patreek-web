import { getPublicFeeds } from '@/lib/api';
import Link from 'next/link';
import styles from './page.module.css';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function LinksHomePage() {
  const feeds = await getPublicFeeds();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Latest pats</h1>
          <p className={styles.subtitle}>Let&apos;s read</p>
        </div>
      </header>

      {feeds.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No articles available at the moment.</p>
          <p className={styles.registerPrompt}>
            Register to get the latest updates from the topics you care about
          </p>
        </div>
      ) : (
        <main className={styles.main}>
          <div className={styles.feedList}>
            {feeds.map((feed) => (
              <Link key={feed.id} href={`/article/${feed.id}`} className={styles.feedCard}>
                <div className={styles.imageWrapper}>
                  <img
                    src={feed.imageUrl || 'https://insideskills.pl/wp-content/uploads/2024/01/placeholder-6.png'}
                    alt={feed.title}
                    className={styles.image}
                  />
                  <div className={styles.categoryBadge}>
                    <span className={styles.categoryText}>{feed.categoryName}</span>
                  </div>
                </div>
                <div className={styles.content}>
                  <h2 className={styles.feedTitle}>{feed.title}</h2>
                </div>
              </Link>
            ))}
          </div>
          
          <div className={styles.registerBanner}>
            <p className={styles.registerText}>
              Register to get the latest updates from the topics you care about
            </p>
            <a
              href="https://apps.apple.com/us/app/patreek/id6547858283"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.downloadButton}
            >
              Download App
            </a>
          </div>
        </main>
      )}
    </div>
  );
}

