'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './ArticleViewer.module.css';
import MonetagSlot from './ads/MonetagSlot';
import MonetagMultiTag from './ads/MonetagMultiTag';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(dateString);
}

interface Comment {
  id: number;
  body: string;
  author: string;
  photoUrl?: string;
  createdAt: string;
}

interface Article {
  id: number;
  title: string;
  body: string;
  imageUrl: string;
  excerpt: string;
  categoryName: string;
  sourceUrl?: string;
  createdAt: string;
}

interface ArticleViewerProps {
  article: Article;
  comments: Comment[];
}

export default function ArticleViewer({ article, comments }: ArticleViewerProps) {
  const [imageError, setImageError] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const shareUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return `https://patreek.com/article/${article.id}`;
  }, [article.id]);

  useEffect(() => {
    if (copyStatus === 'idle') {
      return;
    }

    const timer = setTimeout(() => setCopyStatus('idle'), 2500);
    return () => clearTimeout(timer);
  }, [copyStatus]);

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
  const copyButtonClassNames = [
    styles.shareButton,
    copyStatus === 'copied' ? styles.shareButtonSuccess : '',
    copyStatus === 'error' ? styles.shareButtonError : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <svg className={styles.hiddenSprite} aria-hidden="true" focusable="false">
        <symbol id="icon-social-articlelink" viewBox="0 0 32 32">
          <path
            d="M18.586 5.414a5 5 0 0 1 7.071 7.071l-3 3a1 1 0 0 1-1.414-1.414l3-3a3 3 0 1 0-4.243-4.243l-3 3a1 1 0 1 1-1.414-1.414l3-3z"
            fill="currentColor"
          />
          <path
            d="M13.414 26.586a5 5 0 0 1-7.071-7.071l3-3a1 1 0 1 1 1.414 1.414l-3 3a3 3 0 0 0 4.243 4.243l3-3a1 1 0 1 1 1.414 1.414l-3 3z"
            fill="currentColor"
          />
          <path
            d="M11 21a1 1 0 0 1-.707-1.707l9-9a1 1 0 1 1 1.414 1.414l-9 9A1 1 0 0 1 11 21z"
            fill="currentColor"
          />
        </symbol>
      </svg>
      <div className={styles.container}>
        <MonetagMultiTag />
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>Patreek</h1>
        </div>
      </header>

      <main className={styles.main}>
        <article className={styles.article}>
          {/* Category Badge */}
          <div className={styles.categoryBadge}>
            <span className={styles.categoryText}>{article.categoryName}</span>
          </div>

          {/* Top Banner Ad */}
          <MonetagSlot
            zoneId="10189289"
            className={styles.adSlot}
            label="Top banner advertisement"
          />
          {/* Article Title */}
          <h1 className={styles.title}>{article.title}</h1>

          {/* Article Meta */}
          <div className={styles.meta}>
            <span className={styles.date}>
              {formatDate(article.createdAt)}
            </span>
          </div>

          {/* Article Image */}
          {article.imageUrl && !imageError && (
            <div className={styles.imageWrapper}>
              <img
                src={article.imageUrl}
                alt={article.title}
                className={styles.image}
                onError={() => setImageError(true)}
              />
            </div>
          )}

          {/* Article Excerpt */}
          {article.excerpt && (
            <div className={styles.excerpt}>
              <p>{article.excerpt.trim()}</p>
            </div>
          )}

          {/* Article Body */}
          <div className={styles.body}>
            {article.body.split('\n\n').map((paragraph, index) => (
              <p key={index} className={styles.paragraph}>
                {paragraph.trim()}
              </p>
            ))}
          </div>

          {/* Source URL */}
          {article.sourceUrl && (
            <div className={styles.source}>
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.sourceLink}
              >
                Read original article →
              </a>
            </div>
          )}

          {/* Share Bar */}
          <div className={styles.shareBar}>
            <p className={styles.shareLabel}>Share this Pat</p>
            <button
              type="button"
              className={copyButtonClassNames}
              onClick={handleCopyLink}
              aria-live="polite"
              title={copyLabel}
            >
              <svg viewBox="0 0 32 32" aria-hidden="true" className={styles.shareIcon}>
                <use xlinkHref="#icon-social-articlelink" />
              </svg>
              <span className={styles.shareText}>{copyLabel}</span>
            </button>
          </div>

          {/* In-Feed Ad */}
          <MonetagSlot
            zoneId="10189261"
            className={styles.adSlot}
            label="In-feed advertisement"
          />

          {/* Divider */}
          <div className={styles.divider}></div>

          {/* Comments Section */}
          <div className={styles.commentsSection}>
            <h2 className={styles.commentsTitle}>
              Comments {comments.length > 0 && `(${comments.length})`}
            </h2>

            {comments.length === 0 ? (
              <p className={styles.noComments}>No comments yet. Be the first to comment!</p>
            ) : (
              <div className={styles.commentsList}>
                {comments.map((comment) => (
                  <div key={comment.id} className={styles.comment}>
                    <div className={styles.commentHeader}>
                      {comment.photoUrl ? (
                        <img
                          src={comment.photoUrl}
                          alt={comment.author}
                          className={styles.commentAvatar}
                        />
                      ) : (
                        <div className={styles.commentAvatarPlaceholder}>
                          {comment.author.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className={styles.commentMeta}>
                        <span className={styles.commentAuthor}>{comment.author}</span>
                        <span className={styles.commentDate}>
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className={styles.commentBody}>{comment.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>

        {/* Bottom Banner Ad */}
        <MonetagSlot
          zoneId="10189289"
          className={styles.adSlot}
          label="Bottom banner advertisement"
        />
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerText}>
          © {new Date().getFullYear()} Patreek. All rights reserved.
        </p>
      </footer>
    </div>
    </>
  );
}
