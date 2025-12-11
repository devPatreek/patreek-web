'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { FeedArticle, Comment, getArticleComments, API_BASE_URL, checkSessionStatus } from '@/lib/api';
import { beautifyContent } from '@/lib/contentFormatter';
import AuthWallModal from '@/components/auth/AuthWallModal';
import styles from './ArticleReader.module.css';
import moment from 'moment';

interface ArticleReaderProps {
  article: FeedArticle;
}

function isToday(date: string): boolean {
  return moment(date).isSame(moment(), 'day');
}

interface SocialActionBarProps {
  article: FeedArticle;
}

function SocialActionBar({ article }: SocialActionBarProps) {
  const stats = [
    { label: 'Views', value: article.viewCount ?? 0, icon: '👁️' },
    { label: 'Comments', value: article.totalComments ?? 0, icon: '💬' },
    { label: 'Reposts', value: article.totalShares ?? 0, icon: '🔁' },
    { label: 'Pats', value: article.totalPats ?? 0, icon: '❤️' },
    { label: 'Bookmark', value: null, icon: '🔖' },
  ];

  return (
    <div className={styles.socialActionBar}>
      {stats.map((stat) => (
        <button key={stat.label} type="button" className={styles.socialActionStat}>
          <span className={styles.socialActionIcon}>{stat.icon}</span>
          <div className={styles.socialActionLabel}>
            <span>{stat.label}</span>
            {stat.value !== null && (
              <strong className={styles.socialActionCount}>{stat.value.toLocaleString()}</strong>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

function getSourceLabel(article: FeedArticle) {
  if (article.sourceUrl) {
    try {
      const url = new URL(article.sourceUrl);
      const hostname = url.hostname.replace(/^www\./, '');
      return hostname;
    } catch {
      // fallback to category if parsing fails
    }
  }
  return article.categoryName || 'Patreek';
}

export default function ArticleReader({ article }: ArticleReaderProps) {
  const [isDark, setIsDark] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [hasSession, setHasSession] = useState(false);
  const [authWall, setAuthWall] = useState({ open: false, action: 'view this content' });
  const [currentBody, setCurrentBody] = useState(article.body);
  const [currentSummaryType, setCurrentSummaryType] = useState<'EXTRACTIVE' | 'AI_GENERATED'>(article.summaryType ?? 'EXTRACTIVE');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);

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
    return `https://patreek.com/pat/${article.id}`;
  }, [article.id]);

  // Reset copy status after 2.5 seconds
  useEffect(() => {
    if (copyStatus === 'idle') {
      return;
    }
    const timer = setTimeout(() => setCopyStatus('idle'), 2500);
    return () => clearTimeout(timer);
  }, [copyStatus]);

  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
      try {
        const session = await checkSessionStatus();
        if (!cancelled) {
          setHasSession(session.authenticated);
        }
      } catch {
        if (!cancelled) {
          setHasSession(false);
        }
      }
    };
    checkAuth();
    return () => {
      cancelled = true;
    };
  }, []);

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
      : 'Copy pat link';

  const sourceLabel = getSourceLabel(article);

  const formattedDate = isToday(article.createdAt)
    ? 'Today in'
    : moment(article.createdAt).format('MMM DD');

  // Beautify the article body content
  useEffect(() => {
    setCurrentBody(article.body);
    setCurrentSummaryType(article.summaryType ?? 'EXTRACTIVE');
    setEnhanceError(null);
    setIsEnhancing(false);
  }, [article.body, article.summaryType]);

  const beautifiedBody = useMemo(() => {
    return beautifyContent(currentBody);
  }, [currentBody]);

  const isPrivateArticle = article.isPublic === false;
  const showAuthLock = isPrivateArticle && !hasSession;

  const handleEnhance = async () => {
    if (isEnhancing) return;
    setIsEnhancing(true);
    setEnhanceError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/feeds/${article.id}/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Unable to summarize with AI right now.');
      }

      const data: Partial<FeedArticle> = await response.json();
      const enrichedBody = data.body ?? data.excerpt ?? currentBody;
      const enrichedSummaryType = data.summaryType ?? 'AI_GENERATED';

      setCurrentBody(enrichedBody);
      setCurrentSummaryType(enrichedSummaryType);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Summarization failed.';
      setEnhanceError(message);
    } finally {
      setIsEnhancing(false);
    }
  };

  const openAuthWall = (action: string) => {
    setAuthWall({ open: true, action });
  };
  const closeAuthWall = () => {
    setAuthWall((prev) => ({ ...prev, open: false }));
  };

  const handleReplyClick = () => {
    if (!hasSession) {
      openAuthWall('reply to a comment');
    }
  };

  return (
    <div className={`${styles.container} ${isDark ? styles.dark : ''}`}>
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

          <p className={styles.sourceLine}>From {sourceLabel}</p>
          <SocialActionBar article={article} />
          <h1 className={styles.title}>{article.title}</h1>

          {article.excerpt && (
            <p className={styles.description}>{article.excerpt}</p>
          )}

          {showAuthLock ? (
            <div className={styles.authLocked}>
              <h3>Members only</h3>
              <p>Sign in to read this story and join the discussion.</p>
              <button
                type="button"
                className={`${styles.enhanceButton} ${styles.authUnlockButton}`}
                onClick={() => openAuthWall('read this story')}
              >
                Unlock story
              </button>
            </div>
          ) : (
            <>
              <div
                className={styles.content}
                dangerouslySetInnerHTML={{ __html: beautifiedBody }}
              />

              {currentSummaryType === 'EXTRACTIVE' && (
                <div className={styles.enhanceWrapper}>
                  {enhanceError && <p className={styles.enhanceError}>{enhanceError}</p>}
                  <button
                    type="button"
                    className={`${styles.enhanceButton} ${
                      isEnhancing ? styles.enhanceButtonLoading : ''
                    }`}
                    onClick={handleEnhance}
                    disabled={isEnhancing}
                  >
                    {isEnhancing ? 'Summarizing…' : '✨ Summarize with AI'}
                  </button>
                </div>
              )}

              {/* Comments Section */}
              <div className={styles.commentsSection}>
                <h2 className={styles.commentsTitle}>Comments</h2>
                <div className={styles.shareBar}>
                  <p className={styles.shareLabel}>Share this Pat</p>
                  <div className={styles.shareActions}>
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
                    <button
                      type="button"
                      className={styles.replyButton}
                      onClick={handleReplyClick}
                    >
                      Reply
                    </button>
                  </div>
                </div>
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
            </>
          )}

          {/* UNLOCK YOUR PATS Banner */}
          <div className={`${styles.unlockBanner} ${styles.mobileOnly}`}>
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
      <AuthWallModal
        isOpen={authWall.open}
        triggerAction={authWall.action}
        onClose={closeAuthWall}
      />
    </div>
  );
}
