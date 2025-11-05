'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FeedArticle } from '@/lib/api';
import styles from './ArticleReader.module.css';
import moment from 'moment';

interface ArticleReaderProps {
  article: FeedArticle;
}

function isToday(date: string): boolean {
  return moment(date).isSame(moment(), 'day');
}

export default function ArticleReader({ article }: ArticleReaderProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for dark mode preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const formattedDate = isToday(article.createdAt)
    ? 'Today in'
    : moment(article.createdAt).format('MMM DD');

  return (
    <div className={`${styles.container} ${isDark ? styles.dark : ''}`}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logoLink}>
            <Image
              src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675caa3a2f73ad268a86b51a_Patreek%20logo_slogan.png"
              alt="Patreek"
              width={50}
              height={50}
              className={styles.logo}
            />
            <span className={styles.brandName}>PATREEK</span>
          </Link>
          <div className={styles.headerCenter}>
            <h1 className={styles.categoryName}>{article.categoryName}</h1>
            <p className={styles.date}>{formattedDate}</p>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <article className={styles.article}>
          {article.imageUrl && (
            <div className={styles.imageWrapper}>
              <img
                src={article.imageUrl}
                alt={article.title}
                className={styles.image}
              />
            </div>
          )}

          <h1 className={styles.title}>{article.title}</h1>

          {article.description && (
            <p className={styles.description}>{article.description}</p>
          )}

          <div
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* UNLOCK YOUR NEWS FEED Banner */}
          <div className={styles.unlockBanner}>
            <div className={styles.unlockBannerContent}>
              <p className={styles.unlockText}>UNLOCK YOUR NEWS FEED</p>
              <p className={styles.unlockDescription}>
                Register to get the latest updates from the topics{' '}
                <span className={styles.unlockUnderline}>you</span> care about
              </p>
              <div className={styles.unlockButtons}>
                <a
                  href="https://apps.apple.com/us/app/patreek/id6547858283"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.createAccountButton}
                >
                  Create account
                </a>
                <span className={styles.or}>or</span>
                <a
                  href="https://apps.apple.com/us/app/patreek/id6547858283"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.loginButton}
                >
                  Login
                </a>
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
