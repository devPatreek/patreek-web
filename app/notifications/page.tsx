'use client';

import { useEffect, useState } from 'react';
import MainHeader from '@/components/MainHeader';
import Footer from '@/components/Footer';
import { getNotifications, markNotificationsRead, NotificationItem } from '@/lib/api';
import styles from './page.module.css';

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getNotifications(50);
        if (mounted) setItems(data);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const markAllRead = async () => {
    await markNotificationsRead();
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className={styles.shell}>
      <MainHeader hasSession />
      <main className={styles.main}>
        <div className={styles.headerRow}>
          <div>
            <p className={styles.eyebrow}>Inbox</p>
            <h1 className={styles.title}>Notifications</h1>
          </div>
          <button className={styles.markRead} type="button" onClick={markAllRead}>
            Mark all read
          </button>
        </div>

        <div className={styles.list}>
          {loading ? (
            <p className={styles.muted}>Loading notifications...</p>
          ) : items.length === 0 ? (
            <p className={styles.muted}>You’re all caught up.</p>
          ) : (
            items.map(item => (
              <div key={item.id} className={`${styles.card} ${item.isRead ? styles.cardRead : ''}`}>
                <div>
                  <p className={styles.cardTitle}>{item.title}</p>
                  <p className={styles.cardMessage}>{item.message}</p>
                  <span className={styles.time}>{formatTimeAgo(item.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function formatTimeAgo(dateInput?: string) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
