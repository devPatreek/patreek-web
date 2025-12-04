'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import styles from './MainHeader.module.css';
import {
  getUserProfile,
  checkSessionStatus,
  getUnreadNotificationCount,
  getNotifications,
  markNotificationsRead,
  NotificationItem,
} from '@/lib/api';
import ProfileIcon from './ProfileIcon';
import NestIcon from './NestIcon';

type ActiveKey = 'coins' | 'store' | 'media' | 'community' | 'opinion' | 'home';

type Props = {
  active?: ActiveKey;
  hasSession?: boolean;
};

export default function MainHeader({ active, hasSession = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const current = active ?? deriveActive(pathname);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Get current user's username for profile navigation
  useEffect(() => {
    if (hasSession) {
      const fetchUsername = async () => {
        try {
          const sessionResult = await checkSessionStatus();
          if (sessionResult.authenticated) {
            const profile = await getUserProfile();
            if (profile?.username) {
              setCurrentUsername(profile.username);
            }
          }
        } catch (error) {
          console.warn('Failed to fetch username for profile navigation:', error);
        }
      };
      fetchUsername();
    }
  }, [hasSession]);

  useEffect(() => {
    if (!hasSession) return;
    let mounted = true;
    let tick: ReturnType<typeof setInterval>;

    const loadCount = async () => {
      try {
        const count = await getUnreadNotificationCount();
        if (mounted) setUnreadCount(count);
      } catch (error) {
        console.warn('Failed to fetch unread count:', error);
      }
    };

    loadCount();
    tick = setInterval(loadCount, 60000);
    return () => {
      mounted = false;
      clearInterval(tick);
    };
  }, [hasSession]);

  const loadNotifications = async () => {
    if (!hasSession) return;
    setNotifLoading(true);
    try {
      const data = await getNotifications(15);
      setNotifications(data);
      const unread = data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.warn('Failed to fetch notifications:', error);
    } finally {
      setNotifLoading(false);
    }
  };

  const openNotifications = () => {
    if (!isNotifOpen) {
      loadNotifications();
    }
    setIsNotifOpen(!isNotifOpen);
  };

  const markAllRead = async () => {
    try {
      await markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.warn('Failed to mark notifications read:', error);
    }
  };

  const handleProfileClick = () => {
    router.push('/profile');
  };

  const navButtons: { key: ActiveKey; label: string; onClick: () => void }[] = [
    { key: 'coins', label: 'Coins', onClick: () => router.push('/coins') },
    { key: 'store', label: 'Store', onClick: () => window.open('https://store.patreek.com', '_blank') },
    { key: 'media', label: 'Media', onClick: () => router.push('/media') },
    { key: 'community', label: 'Community', onClick: () => router.push('/community') },
    { key: 'opinion', label: 'Opinion', onClick: () => router.push('/opinion') },
    { key: 'home', label: 'API', onClick: () => window.open('https://developer.patreek.com', '_blank') },
  ];

  return (
    <header className={styles.topBar}>
      <div className={styles.topLeft}>
        <Link href="/" className={styles.logoLink} aria-label="Patreek home">
          <Image
            src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675caa3a2f73ad268a86b51a_Patreek%20logo_slogan.png"
            alt="Patreek"
            width={110}
            height={40}
            className={styles.logo}
            priority
          />
        </Link>
      </div>

      {!hasSession && (
        <div className={styles.topCenter}>
          <div className={styles.getApp}>
            <span className={styles.getAppText}>Get the App</span>
            <a
              href="https://apps.apple.com/us/app/patreek/id6547858283"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.storeIcon}
              aria-label="Download on the App Store"
            >
              <Image
                src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/67a3729b558347b9bf210a5a_Store%3DApp%20Store%2C%20Type%3DDark%2C%20Language%3DEnglish%402x.png"
                alt="App Store"
                width={90}
                height={28}
              />
            </a>
            <a href="" className={styles.storeIcon} aria-label="Get it on Google Play (coming soon)">
              <Image
                src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/67a3727c8abb3515ab42d712_Store%3DGoogle%20Play%2C%20Type%3DDark%2C%20Language%3DEnglish%402x.png"
                alt="Google Play"
                width={90}
                height={28}
              />
            </a>
          </div>
        </div>
      )}

      <div className={styles.topRight}>
        <nav className={styles.headerNav} aria-label="Primary navigation">
          {navButtons.map(btn => (
            <button
              key={btn.key}
              className={`${styles.navButtonLink} ${current === btn.key ? styles.activeLink : ''}`}
              type="button"
              onClick={btn.onClick}
            >
              {btn.label}
            </button>
          ))}
        </nav>

        {hasSession ? (
          <div className={styles.authedActions}>
            <div className={styles.notificationWrapper}>
              <button
                type="button"
                className={styles.bellButton}
                onClick={openNotifications}
                aria-label="Notifications"
              >
                <BellIcon />
                {unreadCount > 0 && <span className={styles.badge}>{Math.min(unreadCount, 99)}</span>}
              </button>
              {isNotifOpen && (
                <div className={styles.notificationPanel}>
                  <div className={styles.panelHeader}>
                    <p className={styles.panelTitle}>Notifications</p>
                    <div className={styles.panelHeaderActions}>
                      <button type="button" onClick={markAllRead} className={styles.markAllButton}>
                        Mark all read
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push('/notifications')}
                        className={styles.viewAllButton}
                      >
                        View all
                      </button>
                    </div>
                  </div>
                  <div className={styles.panelBody}>
                    {notifLoading ? (
                      <p className={styles.muted}>Loading...</p>
                    ) : notifications.length === 0 ? (
                      <p className={styles.muted}>You’re all caught up.</p>
                    ) : (
                      notifications.map(item => (
                        <NotificationRow key={item.id} item={item} />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              className={styles.nestButton}
              type="button"
              onClick={() => router.push('/nest')}
              aria-label="Message Nest"
              title="Message Nest"
            >
              <NestIcon className={styles.nestIcon} />
            </button>
            <button
              className={styles.profileIconButton}
              type="button"
              onClick={handleProfileClick}
              aria-label="Profile"
              title="Profile"
            >
              <ProfileIcon className={styles.profileIcon} />
            </button>
          </div>
        ) : (
          <Link className={styles.signInButton} href="/registration">
            Sign up
          </Link>
        )}
      </div>
    </header>
  );
}

function deriveActive(pathname?: string | null): ActiveKey | undefined {
  if (!pathname) return undefined;
  if (pathname.startsWith('/coins')) return 'coins';
  if (pathname.startsWith('/media')) return 'media';
  if (pathname.startsWith('/community')) return 'community';
  if (pathname.startsWith('/opinion')) return 'opinion';
  return undefined;
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 22a2.2 2.2 0 0 0 2.18-2H9.82A2.2 2.2 0 0 0 12 22Zm7.18-6.44-1.68-1.5V10a5.5 5.5 0 0 0-4.44-5.4V4a1.06 1.06 0 0 0-2.12 0v.6A5.5 5.5 0 0 0 6.5 10v4.06l-1.68 1.5A1 1 0 0 0 5 17.8h14a1 1 0 0 0 .68-1.74Z"
      />
    </svg>
  );
}

function NotificationRow({ item }: { item: NotificationItem }) {
  const friendlyTime = formatTimeAgo(item.createdAt);
  const actor = item.actorUsername ? (item.actorUsername.startsWith('@') ? item.actorUsername : `@${item.actorUsername}`) : '';
  return (
    <div className={`${styles.notificationItem} ${item.isRead ? styles.read : ''}`}>
      <div className={styles.notificationText}>
        <p className={styles.notificationTitle}>{item.title}</p>
        <p className={styles.notificationMessage}>
          {item.message} {actor && <span className={styles.notificationActor}>{actor}</span>}
        </p>
        <span className={styles.notificationTime}>{friendlyTime}</span>
      </div>
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
