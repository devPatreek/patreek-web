'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FeedArticle, Comment, getArticleComments } from '@/lib/api';
import { beautifyContent } from '@/lib/contentFormatter';
import AdPlaceholder from '@/components/AdPlaceholder';
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
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

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

    // Ad space reserved for future ad network integration
  }, [article.id]);

  // Share URL
  const shareUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return `https://patreek.com/public/pats/${article.id}`;
  }, [article.id]);

  // Reset copy status after 2.5 seconds
  useEffect(() => {
    if (copyStatus === 'idle') {
      return;
    }
    const timer = setTimeout(() => setCopyStatus('idle'), 2500);
    return () => clearTimeout(timer);
  }, [copyStatus]);

  // Fallback copy method for older browsers
  const fallbackCopy = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  };

  // Handle copy link
  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        fallbackCopy(shareUrl);
      }
      setCopyStatus('copied');
    } catch (error) {
      try {
        fallbackCopy(shareUrl);
        setCopyStatus('copied');
      } catch (fallbackError) {
        console.error('Failed to copy article link', fallbackError);
        setCopyStatus('error');
      }
    }
  };

  const copyLabel =
    copyStatus === 'copied'
      ? 'Link copied!'
      : copyStatus === 'error'
      ? 'Unable to copy'
      : 'Copy article link';

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

          {/* Top Banner Ad - Before Article Content - Reserved for future ad network */}
          <AdPlaceholder placementId="article-top" showPlaceholder={true} />

          <div
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: beautifiedBody }}
          />

          {/* Bottom Banner Ad - After Article Content - Reserved for future ad network */}
          <AdPlaceholder placementId="article-bottom" showPlaceholder={true} />

          {/* Share Bar */}
          <div className={styles.shareBar}>
            <p className={styles.shareLabel}>Share this Pat</p>
            <button
              type="button"
              className={`${styles.shareButton} ${
                copyStatus === 'copied' ? styles.shareButtonSuccess : ''
              } ${copyStatus === 'error' ? styles.shareButtonError : ''}`}
              onClick={handleCopyLink}
              aria-live="polite"
              title={copyLabel}
            >
              <svg viewBox="0 0 32 32" aria-hidden="true" className={styles.shareIcon}>
                <path
                  d="M18.586 5.414a5 5 0 0 1 7.071 7.071l-3 3a1 1 0 0 1-1.414-1.414l3-3a3 3 0 1 0-4.243-4.243l-3 3a1 1 0 1 1-1.414-1.414l3-3z"
                  fill="currentColor"
                />
                <path
                  d="M13.414 26.586a5 5 0 0 1-7.071-7.071l3-3a1 1 0 0 1 1.414 1.414l-3 3a3 3 0 1 0 4.243 4.243l3-3a1 1 0 1 1 1.414 1.414l-3 3z"
                  fill="currentColor"
                />
                <path
                  d="M20.586 11.586l-8 8a1 1 0 0 1-1.414-1.414l8-8a1 1 0 0 1 1.414 1.414z"
                  fill="currentColor"
                />
              </svg>
              <span className={styles.shareText}>{copyLabel}</span>
            </button>
          </div>

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

          {/* UNLOCK YOUR PATS Banner */}
          <div className={styles.unlockBanner}>
            <div className={styles.unlockBannerContent}>
              <p className={styles.unlockText}>UNLOCK YOUR PATS</p>
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
