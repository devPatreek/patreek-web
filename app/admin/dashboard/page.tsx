'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/admin/DashboardLayout';
import {
  AdminActivityLog,
  AdminFeed,
  AdminUser,
  checkAdminSession,
  getAdminActivityLogs,
  getAdminFeeds,
  getAdminUsers,
  suspendAdminUser,
  unsuspendAdminUser,
  updateAdminFeedPublished,
} from '@/lib/api';
import styles from './page.module.css';
import StatusBadge from '@/components/admin/StatusBadge';

type TabKey = 'overview' | 'users' | 'feeds' | 'reports';

const formatDate = (value?: string) => {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (value?: string) => {
  if (!value) {
    return '';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const computeDailyActive = (logs: AdminActivityLog[]) => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const uniqueIds = new Set<string>();
  logs.forEach((log) => {
    const when = log.createdAt ? new Date(log.createdAt).getTime() : NaN;
    if (Number.isNaN(when) || when < cutoff) {
      return;
    }
    const identifier =
      log.metadata?.userId?.toString?.() ?? log.targetId ?? log.adminIp ?? `${log.actionType}-${log.id}`;
    uniqueIds.add(identifier);
  });
  return Math.max(uniqueIds.size, 0);
};

const getInitials = (value?: string) => {
  if (!value) {
    return 'PU';
  }
  const parts = value.trim().split(' ').filter(Boolean);
  if (!parts.length) {
    return 'PU';
  }
  return parts
    .slice(0, 2)
    .map((segment) => segment[0].toUpperCase())
    .join('');
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [sessionLoading, setSessionLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const [overviewStats, setOverviewStats] = useState({
    totalUsers: 0,
    dailyActive: 0,
    pendingFeeds: 0,
  });
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState('');

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');

  const [pendingFeeds, setPendingFeeds] = useState<AdminFeed[]>([]);
  const [feedsLoading, setFeedsLoading] = useState(false);
  const [feedsError, setFeedsError] = useState('');

  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState('');

  const [userActionLoading, setUserActionLoading] = useState<string | null>(null);
  const [feedActionLoading, setFeedActionLoading] = useState<number | null>(null);

  const verifySession = useCallback(async () => {
    try {
      const authenticated = await checkAdminSession();
      if (!authenticated) {
        router.replace('/admin/passcode');
        return;
      }
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Unable to verify admin session', error);
      router.replace('/admin/passcode');
    } finally {
      setSessionLoading(false);
    }
  }, [router]);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const fetchPendingFeeds = useCallback(async () => {
    const page = await getAdminFeeds(0, 25);
    const pending = page.content.filter((feed) => !feed.published);
    setPendingFeeds(pending);
    return { page, pending };
  }, []);

  const fetchActivityLogs = useCallback(async () => {
    const page = await getAdminActivityLogs(0, 25);
    setActivityLogs(page.content);
    return page;
  }, []);

  const loadOverviewStats = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError('');
    try {
      const [usersPage, feedsResult, logsPage] = await Promise.all([
        getAdminUsers(0, 1),
        fetchPendingFeeds(),
        fetchActivityLogs(),
      ]);
      setOverviewStats({
        totalUsers: usersPage.totalElements,
        dailyActive: computeDailyActive(logsPage.content),
        pendingFeeds: feedsResult.pending.length,
      });
    } catch (error) {
      console.error('Unable to load overview metrics', error);
      setOverviewError('Unable to load overview metrics right now.');
    } finally {
      setOverviewLoading(false);
    }
  }, [fetchActivityLogs, fetchPendingFeeds]);

  const loadUsersForTab = useCallback(async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const page = await getAdminUsers(0, 20);
      setUsers(page.content);
    } catch (error) {
      console.error('Unable to load users', error);
      setUsersError('Unable to load user list.');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadFeedsForTab = useCallback(async () => {
    setFeedsLoading(true);
    setFeedsError('');
    try {
      await fetchPendingFeeds();
    } catch (error) {
      console.error('Unable to load feeds', error);
      setFeedsError('Unable to load pending feeds.');
    } finally {
      setFeedsLoading(false);
    }
  }, [fetchPendingFeeds]);

  const loadActivityForTab = useCallback(async () => {
    setActivityLoading(true);
    setActivityError('');
    try {
      await fetchActivityLogs();
    } catch (error) {
      console.error('Unable to load reports', error);
      setActivityError('Unable to load activity logs.');
    } finally {
      setActivityLoading(false);
    }
  }, [fetchActivityLogs]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (activeTab === 'overview') {
      loadOverviewStats();
    } else if (activeTab === 'users') {
      loadUsersForTab();
    } else if (activeTab === 'feeds') {
      loadFeedsForTab();
    } else if (activeTab === 'reports') {
      loadActivityForTab();
    }
  }, [activeTab, isAuthenticated, loadOverviewStats, loadUsersForTab, loadFeedsForTab, loadActivityForTab]);

  const handleToggleUser = useCallback(
    async (user: AdminUser) => {
      setUserActionLoading(user.id);
      try {
        if (user.suspended) {
          await unsuspendAdminUser(user.id);
        } else {
          await suspendAdminUser(user.id, 'Policy review');
        }
        await loadUsersForTab();
      } catch (error) {
        console.error('Unable to update user status', error);
      } finally {
        setUserActionLoading(null);
      }
    },
    [loadUsersForTab]
  );

  const handleApproveFeed = useCallback(
    async (feedId: number) => {
      setFeedActionLoading(feedId);
      try {
        await updateAdminFeedPublished(feedId, true);
        const { pending } = await fetchPendingFeeds();
        setOverviewStats((prev) => ({ ...prev, pendingFeeds: pending.length }));
      } catch (error) {
        console.error('Failed to approve feed', error);
        setFeedsError('Unable to approve feed.');
      } finally {
        setFeedActionLoading(null);
      }
    },
    [fetchPendingFeeds]
  );

  if (sessionLoading) {
    return (
      <div className={styles.emptyState}>
        <p>Verifying admin access…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout activeTab={activeTab} onChangeTab={setActiveTab}>
      {activeTab === 'overview' && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Overview</h2>
            <p className={styles.sectionSubtitle}>Pulse on the platform and outstanding items.</p>
          </div>
          {overviewError && <p className={styles.messageTag}>{overviewError}</p>}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Total Users</p>
              <p className={styles.statValue}>
                {overviewLoading ? 'Loading…' : overviewStats.totalUsers.toLocaleString()}
              </p>
              <p className={styles.statSubtext}>Registered Patreek accounts.</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Daily Active</p>
              <p className={styles.statValue}>
                {overviewLoading ? 'Loading…' : overviewStats.dailyActive.toLocaleString()}
              </p>
              <p className={styles.statSubtext}>Unique actors in the last 24 hours.</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Pending Feeds</p>
              <p className={styles.statValue}>
                {overviewLoading ? 'Loading…' : overviewStats.pendingFeeds.toLocaleString()}
              </p>
              <p className={styles.statSubtext}>Waiting on editorial approval.</p>
            </div>
          </div>
          <div className={styles.sectionHeader} style={{ marginTop: '1.75rem' }}>
            <h3 className={styles.sectionTitle}>Pending stories snapshot</h3>
            <p className={styles.sectionSubtitle}>Quick peek at the latest submissions.</p>
          </div>
          {pendingFeeds.length === 0 ? (
            <div className={styles.emptyState}>No pending feeds at this time.</div>
          ) : (
            <ul className={styles.feedList}>
              {pendingFeeds.slice(0, 3).map((feed) => (
                <li key={feed.id} className={styles.feedItem}>
                  <div className={styles.feedContent}>
                    <p className={styles.feedTitle}>{feed.title || 'Untitled story'}</p>
                    <p className={styles.feedMeta}>
                      {feed.categoryName || 'Uncategorized'} · {formatDate(feed.createdAt)}
                    </p>
                    <p className={styles.feedExcerpt}>{feed.excerpt || feed.body || 'No summary available.'}</p>
                  </div>
                  <div className={styles.feedActions}>
                    <button
                      type="button"
                      className={`${styles.actionButton} ${styles.approveButton}`}
                      disabled={feedActionLoading === feed.id}
                      onClick={() => handleApproveFeed(feed.id)}
                    >
                      {feedActionLoading === feed.id ? 'Approving…' : 'Approve now'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {activeTab === 'users' && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Users</h2>
            <p className={styles.sectionSubtitle}>Monitor accounts and ban problematic actors.</p>
          </div>
          {usersError && <p className={styles.messageTag}>{usersError}</p>}
          <div className={styles.tableWrapper}>
            {usersLoading ? (
              <p className={styles.metaText}>Loading user data…</p>
            ) : users.length === 0 ? (
              <p className={styles.emptyState}>No users found.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Avatar</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className={styles.avatarCell}>
                          <span className={styles.avatarBubble}>
                            {getInitials(user.name || user.username)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <p className={styles.userName}>{user.username || 'Unknown'}</p>
                        <p className={styles.metaText}>{user.headline || 'No headline'}</p>
                      </td>
                      <td>{user.email || '—'}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <StatusBadge status={user.suspended ? 'Suspended' : 'Active'} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`${styles.actionButton} ${
                            user.suspended ? styles.secondaryButton : styles.approveButton
                          }`}
                          onClick={() => handleToggleUser(user)}
                          disabled={userActionLoading === user.id}
                        >
                          {userActionLoading === user.id
                            ? 'Updating…'
                            : user.suspended
                            ? 'Unban'
                            : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {activeTab === 'feeds' && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Feeds</h2>
            <p className={styles.sectionSubtitle}>Approve submitted content before it goes live.</p>
          </div>
          {feedsError && <p className={styles.messageTag}>{feedsError}</p>}
          {feedsLoading && <p className={styles.metaText}>Loading pending feeds…</p>}
          {!feedsLoading && pendingFeeds.length === 0 && (
            <div className={styles.emptyState}>No pending feeds.</div>
          )}
          {!feedsLoading && pendingFeeds.length > 0 && (
            <ul className={styles.feedList}>
              {pendingFeeds.map((feed) => (
                <li key={feed.id} className={styles.feedItem}>
                  <div className={styles.feedContent}>
                    <p className={styles.feedTitle}>{feed.title || 'Untitled story'}</p>
                    <p className={styles.feedMeta}>
                      {feed.categoryName || 'Uncategorized'} · {formatDate(feed.createdAt)}
                    </p>
                    <p className={styles.feedExcerpt}>{feed.excerpt || feed.body || 'No summary available.'}</p>
                  </div>
                  <div className={styles.feedActions}>
                    <button
                      type="button"
                      className={`${styles.actionButton} ${styles.approveButton}`}
                      disabled={feedActionLoading === feed.id}
                      onClick={() => handleApproveFeed(feed.id)}
                    >
                      {feedActionLoading === feed.id ? 'Approving…' : 'Approve'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {activeTab === 'reports' && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Reports</h2>
            <p className={styles.sectionSubtitle}>Action logs for transparency.</p>
          </div>
          {activityError && <p className={styles.messageTag}>{activityError}</p>}
          {activityLoading && <p className={styles.metaText}>Loading activity…</p>}
          {!activityLoading && activityLogs.length === 0 && (
            <div className={styles.emptyState}>No activity recorded.</div>
          )}
          {!activityLoading && activityLogs.length > 0 && (
            <ul className={styles.reportsList}>
              {activityLogs.slice(0, 12).map((log) => (
                <li key={log.id} className={styles.reportItem}>
                  <div className={styles.reportDetails}>
                    <p className={styles.reportTitle}>{log.actionType}</p>
                    <p className={styles.reportDescription}>{log.actionDescription}</p>
                    {log.targetType && <span className={styles.messageTag}>{log.targetType}</span>}
                  </div>
                  <span className={styles.reportTime}>{formatTime(log.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </DashboardLayout>
  );
}
