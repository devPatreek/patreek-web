'use client';

import { useState } from 'react';
import styles from './ArticleViewer.module.css';

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

  return (
    <div className={styles.container}>
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
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerText}>
          © {new Date().getFullYear()} Patreek. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

