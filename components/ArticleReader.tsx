'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FeedArticle, Comment, getArticleComments } from '@/lib/api';
import { beautifyContent } from '@/lib/contentFormatter';
import EzoicAd from '@/components/EzoicAd';
import Footer from '@/components/Footer';
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  useEffect(() => {
    // Check for dark mode preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    async function loadComments() {
      try {
        setIsLoadingComments(true);
        const commentsData = await getArticleComments(article.id);
        setComments(commentsData);
      } catch (err) {
        console.error('Failed to load comments:', err);
        setComments([]);
      } finally {
        setIsLoadingComments(false);
      }
    }

    loadComments();

    // Refresh Ezoic ads when article loads (for dynamic content)
    if (typeof window !== 'undefined' && window.ezstandalone) {
      window.ezstandalone.cmd.push(function () {
        window.ezstandalone.showAds();
      });
    }
  }, [article.id]);

  const formattedDate = isToday(article.createdAt)
    ? 'Today in'
    : moment(article.createdAt).format('MMM DD');

  // Beautify the article body content
  const beautifiedBody = useMemo(() => {
    return beautifyContent(article.body);
  }, [article.body]);

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

          {article.excerpt && (
            <p className={styles.description}>{article.excerpt}</p>
          )}

          {/* Top Banner Ad - Before Article Content - Replace 104 with your actual Ezoic placement ID */}
          <EzoicAd placementId={104} showPlaceholder={true} />

          <div
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: beautifiedBody }}
          />

          {/* Bottom Banner Ad - After Article Content - Replace 105 with your actual Ezoic placement ID */}
          <EzoicAd placementId={105} showPlaceholder={true} />

          {/* Comments Section */}
          <div className={styles.commentsSection}>
            <h2 className={styles.commentsTitle}>Comments</h2>
            {isLoadingComments ? (
              <p className={styles.commentsLoading}>Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className={styles.noComments}>No comments yet.</p>
            ) : (
              <div className={styles.commentsList}>
                {comments.map((comment, index) => (
                  <div key={index} className={styles.commentItem}>
                    <div className={styles.commentHeader}>
                      {comment.photoUrl && (
                        <img
                          src={comment.photoUrl}
                          alt={comment.author}
                          className={styles.commentAvatar}
                        />
                      )}
                      <div className={styles.commentAuthorInfo}>
                        <span className={styles.commentAuthor}>{comment.author}</span>
                        <span className={styles.commentDate}>
                          {moment(comment.createdAt).format('MMM DD, YYYY')}
                        </span>
                      </div>
                    </div>
                    <p className={styles.commentBody}>{comment.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* UNLOCK YOUR NEWS FEED Banner */}
          <div className={styles.unlockBanner}>
            <div className={styles.unlockBannerContent}>
              <p className={styles.unlockText}>UNLOCK YOUR NEWS FEED</p>
              <p className={styles.unlockDescription}>
                Register to get the latest updates from the topics{' '}
                <span className={styles.unlockUnderline}>you</span> care about
              </p>
              <div className={styles.storeButtons}>
                <a
                  href="https://apps.apple.com/us/app/patreek/id6547858283"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.storeLink}
                >
                  <Image
                    src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/67a3729b558347b9bf210a5a_Store%3DApp%20Store%2C%20Type%3DDark%2C%20Language%3DEnglish%402x.png"
                    alt="Download on App Store"
                    width={200}
                    height={60}
                    className={styles.storeImage}
                  />
                </a>
                <a
                  href="#"
                  className={styles.storeLink}
                >
                  <Image
                    src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/67a3727c8abb3515ab42d712_Store%3DGoogle%20Play%2C%20Type%3DDark%2C%20Language%3DEnglish%402x.png"
                    alt="Get it on Google Play"
                    width={200}
                    height={60}
                    className={styles.storeImage}
                  />
                </a>
              </div>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
