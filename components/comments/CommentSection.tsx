'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import styles from './CommentSection.module.css';

interface CommentItem {
  id: string | number;
  authorName?: string;
  authorAvatarUrl?: string;
  text?: string;
  createdAt?: string;
  body?: string;
}

interface CommentsResponse {
  content: CommentItem[];
  totalPages?: number;
  number?: number;
}

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => {
    if (!res.ok) {
      throw new Error('Failed to load comments');
    }
    return res.json();
  });

export default function CommentSection({
  feedId,
}: {
  feedId: string | number;
}) {
  const endpoint =
    feedId !== undefined && feedId !== null ? `/api/v1/feeds/${feedId}/comments` : null;
  const { data, error, mutate } = useSWR<CommentsResponse>(endpoint, fetcher);

  const comments = useMemo(() => data?.content ?? [], [data]);
  const [draft, setDraft] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const formatRelativeTime = (value?: string) => {
    if (!value) {
      return 'Just now';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    const diffMinutes = Math.floor((Date.now() - parsed.getTime()) / 60000);
    if (diffMinutes < 1) {
      return 'Just now';
    }
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }
    const hours = Math.floor(diffMinutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const computeInitials = (name?: string) => {
    if (!name) {
      return 'PU';
    }
    const words = name
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2);
    if (words.length === 0) {
      return 'PU';
    }
    return words.map((word) => word[0]).join('').toUpperCase();
  };

  const helperActions = ['GIF', 'Emoji', 'Image'];

  const handlePost = async () => {
    if (isPosting || !endpoint) {
      return;
    }
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const pendingComment: CommentItem = {
      id: tempId,
      authorName: 'You',
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    setIsPosting(true);

    await mutate(
      (current) => {
        const content = current?.content ?? [];
        return {
          ...(current ?? {}),
          content: [pendingComment, ...content],
        } as CommentsResponse;
      },
      false
    );

    setDraft('');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: trimmed }),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      await mutate();
    } catch (postError) {
      await mutate(
        (current) => {
          const content = current?.content ?? [];
          return {
            ...(current ?? {}),
            content: content.filter((item) => item.id !== tempId),
          } as CommentsResponse;
        },
        false
      );

      setToast('Unable to post comment. Please try again.');
      console.error(postError);
    } finally {
      setIsPosting(false);
    }
  };

  const isLoading = !data && !error && Boolean(endpoint);

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2>Comments</h2>
        <p className={styles.subline}>Join the conversation with your thoughts.</p>
      </header>

      {toast && (
        <div className={styles.toast} role="alert" aria-live="assertive">
          <span>{toast}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            className={styles.toastClose}
            onClick={() => setToast(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className={styles.inputRow}>
        <div className={styles.avatarCircle}>{computeInitials('You')}</div>
        <div className={styles.inputGroup}>
          <textarea
            className={styles.textarea}
            placeholder="Write a comment…"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
          />
          <div className={styles.helperRow}>
            {helperActions.map((label) => (
              <button key={label} type="button" className={styles.helperButton}>
                {label}
              </button>
            ))}
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              disabled={isPosting || draft.trim().length === 0}
              className={`${styles.postButton} ${isPosting || !draft.trim() ? '' : styles.postButtonActive}`}
              onClick={handlePost}
            >
              {isPosting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      {error && <p className={styles.error}>Unable to load comments.</p>}
      {isLoading && <p className={styles.meta}>Loading comments…</p>}

      <div className={styles.threadList}>
        {!isLoading && comments.length === 0 && (
          <p className={styles.empty}>No comments yet — be the first.</p>
        )}
        {comments.map((comment) => {
          const text = comment.text ?? comment.body ?? '';
          return (
            <article key={comment.id} className={styles.commentCard}>
              <div className={styles.commentAvatarWrapper}>
                {comment.authorAvatarUrl ? (
                  <img
                    src={comment.authorAvatarUrl}
                    alt={`${comment.authorName ?? 'Commenter'} avatar`}
                    className={styles.commentAvatar}
                  />
                ) : (
                  <span className={styles.avatarFallback}>{computeInitials(comment.authorName)}</span>
                )}
              </div>
              <div className={styles.commentBodyWrap}>
                <div className={styles.commentHeader}>
                  <span className={styles.commentName}>{comment.authorName || 'Patreek User'}</span>
                  <span className={styles.commentTime}>{formatRelativeTime(comment.createdAt)}</span>
                </div>
                <p className={styles.commentBody}>{text}</p>
                <button type="button" className={styles.replyBtn}>
                  Reply
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
