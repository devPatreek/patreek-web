'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import MainHeader from '@/components/MainHeader';
import Footer from '@/components/Footer';
import { checkSessionStatus, getUserProfile, getMessageNest, MessageNestItem } from '@/lib/api';
import styles from './page.module.css';

export default function NestPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [messages, setMessages] = useState<MessageNestItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionResult = await checkSessionStatus();
        if (sessionResult.authenticated) {
          setIsAuthenticated(true);
          const userProfile = await getUserProfile();
          setCurrentUser(userProfile);
          // Check for dark mode preference (could be from localStorage or user settings)
          const savedDarkMode = localStorage.getItem('darkMode') === 'true';
          setDarkMode(savedDarkMode);
        } else {
          router.replace('/registration');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        router.replace('/registration');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const result = await getMessageNest(page, 20);
        if (page === 0) {
          setMessages(result.content);
        } else {
          setMessages(prev => [...prev, ...result.content]);
        }
        setHasMore(result.content.length === 20 && page < result.totalPages - 1);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [isAuthenticated, page]);

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'now';
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}d`;
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0]?.toUpperCase())
      .join('')
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className={`${styles.page} ${darkMode ? styles.dark : ''}`}>
        <MainHeader hasSession={true} />
        <div className={styles.loading}>
          <p>Loading your nest...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className={`${styles.page} ${darkMode ? styles.dark : ''}`}>
      <MainHeader hasSession={true} />

      <main className={styles.main}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h1 className={styles.title}>Message Nest</h1>
            <p className={styles.subtitle}>Your conversations</p>
          </header>

          <div className={styles.messagesList}>
            {loadingMessages && messages.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No messages yet.</p>
                <p className={styles.emptySubtext}>Start a conversation with someone!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isSent = message.senderId === currentUser?.id;
                const otherUser = isSent 
                  ? { name: message.recipientName, username: message.recipientUsername, id: message.recipientId }
                  : { name: message.senderName, username: message.senderUsername, id: message.senderId };
                
                return (
                  <article key={message.id} className={styles.messageCard}>
                    <div className={styles.messageHeader}>
                      <div className={styles.messageAvatar}>
                        {otherUser.name ? (
                          <span className={styles.avatarInitials}>{getInitials(otherUser.name)}</span>
                        ) : (
                          <span className={styles.avatarInitials}>U</span>
                        )}
                      </div>
                      <div className={styles.messageMeta}>
                        <div className={styles.messageNameRow}>
                          <span className={styles.messageName}>
                            {otherUser.name || otherUser.username || 'Unknown User'}
                          </span>
                          {otherUser.username && (
                            <span className={styles.messageUsername}>@{otherUser.username}</span>
                          )}
                          <span className={styles.messageTime}>
                            {formatTimeAgo(message.createdAt)}
                          </span>
                        </div>
                        {message.subject && (
                          <div className={styles.messageSubject}>{message.subject}</div>
                        )}
                      </div>
                      <div className={styles.messageActions}>
                        <button className={styles.actionButton} aria-label="More options">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className={styles.messageBody}>
                      <p className={styles.messageText}>{message.body}</p>
                    </div>
                    <div className={styles.messageFooter}>
                      <button className={styles.footerButton} aria-label="Reply">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                          <path d="M21 3v5h-5" />
                          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                          <path d="M3 21v-5h5" />
                        </svg>
                      </button>
                      <button className={styles.footerButton} aria-label="Share">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                          <polyline points="16 6 12 2 8 6" />
                          <line x1="12" y1="2" x2="12" y2="15" />
                        </svg>
                      </button>
                      <button className={styles.footerButton} aria-label="Bookmark">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>
                      <span className={styles.messageDate}>{formatDate(message.createdAt)}</span>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {hasMore && (
            <div className={styles.loadMore}>
              <button
                className={styles.loadMoreButton}
                onClick={() => setPage(prev => prev + 1)}
                disabled={loadingMessages}
              >
                {loadingMessages ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

