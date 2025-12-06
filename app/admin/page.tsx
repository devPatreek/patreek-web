'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  checkAdminSession,
  getAdminSupportMessages,
  markSupportMessageAsRead,
  updateSupportMessageStatus,
  AdminFeedbackMessage,
  AdminFeedbackPage,
  getAdminUsers,
  AdminUser,
  AdminUserPage,
  updateAdminUser,
  suspendAdminUser,
  unsuspendAdminUser,
  updateAdminUserCoins,
  getAdminFeeds,
  AdminFeed,
  AdminFeedPage,
  deleteAdminFeed,
  hideAdminFeed,
  unhideAdminFeed,
  featureAdminFeed,
  unfeatureAdminFeed,
  updateAdminFeedPublished,
  getAdminActivityLogs,
  AdminActivityLog,
  AdminActivityLogPage,
} from '@/lib/api';
import styles from './page.module.css';

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'support' | 'users' | 'content' | 'activity'>('dashboard');
  const [supportMessages, setSupportMessages] = useState<AdminFeedbackMessage[]>([]);
  const [supportPage, setSupportPage] = useState(0);
  const [supportTotalPages, setSupportTotalPages] = useState(0);
  const [supportLoading, setSupportLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  
  // User management state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userPage, setUserPage] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(0);
  const [userLoading, setUserLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  
  // Feed management state
  const [feeds, setFeeds] = useState<AdminFeed[]>([]);
  const [feedPage, setFeedPage] = useState(0);
  const [feedTotalPages, setFeedTotalPages] = useState(0);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedSearch, setFeedSearch] = useState('');
  const [selectedFeed, setSelectedFeed] = useState<AdminFeed | null>(null);
  
  // Activity logs state
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [activityPage, setActivityPage] = useState(0);
  const [activityTotalPages, setActivityTotalPages] = useState(0);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | undefined;
    
    const checkAuth = async () => {
      try {
        // Set a shorter timeout for the check
        const authPromise = checkAdminSession();
        const timeoutPromise = new Promise<boolean>((resolve) => {
          timeoutId = setTimeout(() => {
            console.warn('Admin session check timed out');
            resolve(false);
          }, 3000); // 3 second timeout
        });
        
        const authenticated = await Promise.race([authPromise, timeoutPromise]);
        
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        if (!isMounted) return;
        
        if (authenticated) {
          setIsAuthenticated(true);
        } else {
          router.replace('/admin/passcode');
        }
      } catch (error) {
        console.error('Error checking admin session:', error);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (!isMounted) return;
        router.replace('/admin/passcode');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Start auth check immediately
    checkAuth();
    
    // Absolute fallback timeout - always resolve after 5 seconds
    const fallbackTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('Absolute timeout reached, forcing redirect');
        setIsLoading(false);
        router.replace('/admin/passcode');
      }
    }, 5000);

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      clearTimeout(fallbackTimeout);
    };
  }, [router]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'support') {
      loadSupportMessages();
    } else if (isAuthenticated && activeTab === 'users') {
      loadUsers();
    } else if (isAuthenticated && activeTab === 'content') {
      loadFeeds();
    } else if (isAuthenticated && activeTab === 'activity') {
      loadActivityLogs();
    }
  }, [isAuthenticated, activeTab, supportPage, statusFilter, userPage, userSearch, feedPage, feedSearch, activityPage, activityTypeFilter]);

  const loadSupportMessages = async () => {
    setSupportLoading(true);
    try {
      const result = await getAdminSupportMessages(
        supportPage,
        20,
        statusFilter === 'all' ? undefined : statusFilter
      );
      setSupportMessages(result.content);
      setSupportTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error loading support messages:', error);
    } finally {
      setSupportLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markSupportMessageAsRead(id);
      setSupportMessages(prev =>
        prev.map(msg =>
          msg.id === id ? { ...msg, read: true, readAt: new Date().toISOString() } : msg
        )
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleUpdateStatus = async (id: number, status: 'open' | 'closed') => {
    try {
      await updateSupportMessageStatus(id, status);
      setSupportMessages(prev =>
        prev.map(msg => (msg.id === id ? { ...msg, status } : msg))
      );
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  // User management functions
  const loadUsers = async () => {
    setUserLoading(true);
    try {
      const result = await getAdminUsers(userPage, 20, userSearch || undefined);
      setUsers(result.content);
      setUserTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setUserLoading(false);
    }
  };

  const handleSuspendUser = async (userId: string, reason: string) => {
    try {
      await suspendAdminUser(userId, reason);
      await loadUsers();
      setSelectedUser(null);
    } catch (error: any) {
      alert(error.message || 'Failed to suspend user');
    }
  };

  const handleUnsuspendUser = async (userId: string) => {
    try {
      await unsuspendAdminUser(userId);
      await loadUsers();
      setSelectedUser(null);
    } catch (error: any) {
      alert(error.message || 'Failed to unsuspend user');
    }
  };

  const handleUpdateUserCoins = async (userId: string, coins: number) => {
    try {
      await updateAdminUserCoins(userId, coins);
      await loadUsers();
      setSelectedUser(null);
    } catch (error: any) {
      alert(error.message || 'Failed to update user coins');
    }
  };

  // Feed management functions
  const loadFeeds = async () => {
    setFeedLoading(true);
    try {
      const result = await getAdminFeeds(feedPage, 20, feedSearch || undefined);
      setFeeds(result.content);
      setFeedTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error loading feeds:', error);
    } finally {
      setFeedLoading(false);
    }
  };

  const handleDeleteFeed = async (feedId: number) => {
    if (!confirm('Are you sure you want to delete this feed? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteAdminFeed(feedId);
      await loadFeeds();
      setSelectedFeed(null);
    } catch (error: any) {
      alert(error.message || 'Failed to delete feed');
    }
  };

  const handleHideFeed = async (feedId: number) => {
    try {
      await hideAdminFeed(feedId);
      await loadFeeds();
    } catch (error: any) {
      alert(error.message || 'Failed to hide feed');
    }
  };

  const handleUnhideFeed = async (feedId: number) => {
    try {
      await unhideAdminFeed(feedId);
      await loadFeeds();
    } catch (error: any) {
      alert(error.message || 'Failed to unhide feed');
    }
  };

  const handleFeatureFeed = async (feedId: number) => {
    try {
      await featureAdminFeed(feedId);
      await loadFeeds();
    } catch (error: any) {
      alert(error.message || 'Failed to feature feed');
    }
  };

  const handleUnfeatureFeed = async (feedId: number) => {
    try {
      await unfeatureAdminFeed(feedId);
      await loadFeeds();
    } catch (error: any) {
      alert(error.message || 'Failed to unfeature feed');
    }
  };

  const handleUpdateFeedPublished = async (feedId: number, published: boolean) => {
    try {
      await updateAdminFeedPublished(feedId, published);
      await loadFeeds();
    } catch (error: any) {
      alert(error.message || 'Failed to update feed published status');
    }
  };

  // Activity logs functions
  const loadActivityLogs = async () => {
    setActivityLoading(true);
    try {
      const result = await getAdminActivityLogs(activityPage, 50, activityTypeFilter || undefined);
      setActivityLogs(result.content);
      setActivityTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error loading activity logs:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.adminHeader}>
          <div className={styles.adminHeaderContent}>
            <h1 className={styles.adminLogo}>Admin Panel</h1>
          </div>
        </div>
        <div className={styles.loading}>
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className={styles.page}>
      <div className={styles.adminHeader}>
        <div className={styles.adminHeaderContent}>
          <h1 className={styles.adminLogo}>Admin Panel</h1>
          <button 
            className={styles.logoutButton}
            onClick={() => {
              // Clear admin session and redirect
              document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              router.push('/admin/passcode');
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <main className={styles.main}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h1 className={styles.title}>Admin Panel</h1>
            <p className={styles.subtitle}>Manage Patreek</p>
          </header>

          <nav className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'dashboard' ? styles.active : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'support' ? styles.active : ''}`}
              onClick={() => setActiveTab('support')}
            >
              Support Messages
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'content' ? styles.active : ''}`}
              onClick={() => setActiveTab('content')}
            >
              Feeds
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'activity' ? styles.active : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              Activity Logs
            </button>
          </nav>

          <div className={styles.content}>
            {activeTab === 'dashboard' && (
              <div className={styles.dashboardSection}>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>API Documentation</h2>
                  <div className={styles.sectionContent}>
                    <p>Interactive Swagger API documentation and testing tools.</p>
                    <a href="/admin/api" target="_blank" rel="noopener noreferrer" className={styles.actionButton}>
                      Open Swagger Docs
                    </a>
                    <a href="/admin/api-test" className={styles.actionButton}>
                      API Testing Tool
                    </a>
                  </div>
                </section>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Quick Actions</h2>
                  <div className={styles.sectionContent}>
                    <p>Common administrative tasks.</p>
                    <button className={styles.actionButton} onClick={() => setActiveTab('support')}>
                      View Support Messages
                    </button>
                    <button className={styles.actionButton} onClick={() => setActiveTab('users')}>
                      Manage Users
                    </button>
                    <button className={styles.actionButton} onClick={() => setActiveTab('content')}>
                      Manage Content
                    </button>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'support' && (
              <div className={styles.supportSection}>
                <div className={styles.supportHeader}>
                  <h2 className={styles.sectionTitle}>Support Messages</h2>
                  <div className={styles.filters}>
                    <button
                      className={`${styles.filterButton} ${statusFilter === 'all' ? styles.active : ''}`}
                      onClick={() => setStatusFilter('all')}
                    >
                      All
                    </button>
                    <button
                      className={`${styles.filterButton} ${statusFilter === 'open' ? styles.active : ''}`}
                      onClick={() => setStatusFilter('open')}
                    >
                      Open
                    </button>
                    <button
                      className={`${styles.filterButton} ${statusFilter === 'closed' ? styles.active : ''}`}
                      onClick={() => setStatusFilter('closed')}
                    >
                      Closed
                    </button>
                  </div>
                </div>

                {supportLoading ? (
                  <div className={styles.loadingState}>Loading messages...</div>
                ) : supportMessages.length === 0 ? (
                  <div className={styles.emptyState}>No support messages found.</div>
                ) : (
                  <>
                    <div className={styles.messagesList}>
                      {supportMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`${styles.messageCard} ${!message.read ? styles.unread : ''}`}
                        >
                          <div className={styles.messageHeader}>
                            <div className={styles.messageId}>#{message.id}</div>
                            <div className={styles.messageMeta}>
                              <span className={`${styles.statusBadge} ${message.status === 'open' ? styles.open : styles.closed}`}>
                                {message.status}
                              </span>
                              {!message.read && <span className={styles.unreadBadge}>New</span>}
                            </div>
                          </div>

                          <div className={styles.messageBody}>
                            <div className={styles.messageTitle}>{message.title || 'No Title'}</div>
                            <div className={styles.messageText}>{message.body}</div>
                          </div>

                          <div className={styles.messageFooter}>
                            <div className={styles.messageInfo}>
                              <div className={styles.messageEmail}>
                                <strong>Email:</strong> {message.email || 'N/A'}
                              </div>
                              <div className={styles.messageName}>
                                <strong>Name:</strong> {message.name || 'N/A'}
                              </div>
                              {message.userId && (
                                <div className={styles.messageUserId}>
                                  <strong>User ID:</strong> {message.userId}
                                </div>
                              )}
                              <div className={styles.messageDate}>
                                <strong>Date:</strong> {formatDate(message.createdAt)}
                              </div>
                              {message.readAt && (
                                <div className={styles.messageReadDate}>
                                  <strong>Read:</strong> {formatDate(message.readAt)}
                                </div>
                              )}
                            </div>

                            <div className={styles.messageActions}>
                              {!message.read && (
                                <button
                                  className={styles.actionBtn}
                                  onClick={() => handleMarkAsRead(message.id)}
                                >
                                  Mark as Read
                                </button>
                              )}
                              {message.status === 'open' ? (
                                <button
                                  className={styles.actionBtn}
                                  onClick={() => handleUpdateStatus(message.id, 'closed')}
                                >
                                  Close
                                </button>
                              ) : (
                                <button
                                  className={styles.actionBtn}
                                  onClick={() => handleUpdateStatus(message.id, 'open')}
                                >
                                  Reopen
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {supportTotalPages > 1 && (
                      <div className={styles.pagination}>
                        <button
                          className={styles.pageButton}
                          onClick={() => setSupportPage(prev => Math.max(0, prev - 1))}
                          disabled={supportPage === 0}
                        >
                          Previous
                        </button>
                        <span className={styles.pageInfo}>
                          Page {supportPage + 1} of {supportTotalPages}
                        </span>
                        <button
                          className={styles.pageButton}
                          onClick={() => setSupportPage(prev => prev + 1)}
                          disabled={supportPage >= supportTotalPages - 1}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className={styles.usersSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>User Management</h2>
                  <div className={styles.searchBox}>
                    <input
                      type="text"
                      placeholder="Search users by name, email, or username..."
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        setUserPage(0);
                      }}
                      className={styles.searchInput}
                    />
                  </div>
                </div>

                {userLoading ? (
                  <div className={styles.loadingState}>Loading users...</div>
                ) : users.length === 0 ? (
                  <div className={styles.emptyState}>No users found.</div>
                ) : (
                  <>
                    <div className={styles.tableContainer}>
                      <table className={styles.dataTable}>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Coins</th>
                            <th>Rank</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id}>
                              <td>{user.id.substring(0, 8)}...</td>
                              <td>{user.username || 'N/A'}</td>
                              <td>{user.name || 'N/A'}</td>
                              <td>{user.email || 'N/A'}</td>
                              <td>{user.patCoins || 0}</td>
                              <td>{user.rankName || 'N/A'}</td>
                              <td>
                                {user.suspended ? (
                                  <span className={styles.badgeDanger}>Suspended</span>
                                ) : (
                                  <span className={styles.badgeSuccess}>Active</span>
                                )}
                              </td>
                              <td>
                                <button
                                  className={styles.actionBtnSmall}
                                  onClick={() => setSelectedUser(user)}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {userTotalPages > 1 && (
                      <div className={styles.pagination}>
                        <button
                          className={styles.pageButton}
                          onClick={() => setUserPage(prev => Math.max(0, prev - 1))}
                          disabled={userPage === 0}
                        >
                          Previous
                        </button>
                        <span className={styles.pageInfo}>
                          Page {userPage + 1} of {userTotalPages}
                        </span>
                        <button
                          className={styles.pageButton}
                          onClick={() => setUserPage(prev => prev + 1)}
                          disabled={userPage >= userTotalPages - 1}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}

                {selectedUser && (
                  <div className={styles.modal}>
                    <div className={styles.modalContent}>
                      <h3>User Details: {selectedUser.username || selectedUser.name}</h3>
                      <div className={styles.modalBody}>
                        <p><strong>ID:</strong> {selectedUser.id}</p>
                        <p><strong>Name:</strong> {selectedUser.name || 'N/A'}</p>
                        <p><strong>Email:</strong> {selectedUser.email || 'N/A'}</p>
                        <p><strong>Headline:</strong> {selectedUser.headline || 'N/A'}</p>
                        <p><strong>Coins:</strong> {selectedUser.patCoins || 0}</p>
                        <p><strong>Rank:</strong> {selectedUser.rankName || 'N/A'} (Level {selectedUser.rankLevel || 0})</p>
                        <p><strong>Stats:</strong> {selectedUser.totalPats || 0} pats, {selectedUser.totalShares || 0} shares, {selectedUser.totalComments || 0} comments</p>
                        <p><strong>Status:</strong> {selectedUser.suspended ? 'Suspended' : 'Active'}</p>
                        {selectedUser.suspended && selectedUser.suspensionReason && (
                          <p><strong>Suspension Reason:</strong> {selectedUser.suspensionReason}</p>
                        )}
                      </div>
                      <div className={styles.modalActions}>
                        {selectedUser.suspended ? (
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleUnsuspendUser(selectedUser.id)}
                          >
                            Unsuspend
                          </button>
                        ) : (
                          <button
                            className={styles.actionBtnDanger}
                            onClick={() => {
                              const reason = prompt('Enter suspension reason:');
                              if (reason) handleSuspendUser(selectedUser.id, reason);
                            }}
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          className={styles.actionBtn}
                          onClick={() => {
                            const coins = prompt('Enter new coin amount:');
                            if (coins) handleUpdateUserCoins(selectedUser.id, parseInt(coins));
                          }}
                        >
                          Update Coins
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={() => setSelectedUser(null)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'content' && (
              <div className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Feed Management</h2>
                  <div className={styles.searchBox}>
                    <input
                      type="text"
                      placeholder="Search feeds by title or content..."
                      value={feedSearch}
                      onChange={(e) => {
                        setFeedSearch(e.target.value);
                        setFeedPage(0);
                      }}
                      className={styles.searchInput}
                    />
                  </div>
                </div>

                {feedLoading ? (
                  <div className={styles.loadingState}>Loading feeds...</div>
                ) : feeds.length === 0 ? (
                  <div className={styles.emptyState}>No feeds found.</div>
                ) : (
                  <>
                    <div className={styles.tableContainer}>
                      <table className={styles.dataTable}>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Reads</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {feeds.map((feed) => (
                            <tr key={feed.id}>
                              <td>{feed.id}</td>
                              <td>{feed.title?.substring(0, 50) || 'No Title'}...</td>
                              <td>{feed.categoryName || 'N/A'}</td>
                              <td>{feed.readCount || 0}</td>
                              <td>
                                <div className={styles.statusBadges}>
                                  {feed.published && <span className={styles.badgeSuccess}>Published</span>}
                                  {feed.hidden && <span className={styles.badgeWarning}>Hidden</span>}
                                  {feed.featured && <span className={styles.badgeInfo}>Featured</span>}
                                </div>
                              </td>
                              <td>
                                <button
                                  className={styles.actionBtnSmall}
                                  onClick={() => setSelectedFeed(feed)}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {feedTotalPages > 1 && (
                      <div className={styles.pagination}>
                        <button
                          className={styles.pageButton}
                          onClick={() => setFeedPage(prev => Math.max(0, prev - 1))}
                          disabled={feedPage === 0}
                        >
                          Previous
                        </button>
                        <span className={styles.pageInfo}>
                          Page {feedPage + 1} of {feedTotalPages}
                        </span>
                        <button
                          className={styles.pageButton}
                          onClick={() => setFeedPage(prev => prev + 1)}
                          disabled={feedPage >= feedTotalPages - 1}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}

                {selectedFeed && (
                  <div className={styles.modal}>
                    <div className={styles.modalContent}>
                      <h3>Feed Details: {selectedFeed.title}</h3>
                      <div className={styles.modalBody}>
                        <p><strong>ID:</strong> {selectedFeed.id}</p>
                        <p><strong>Title:</strong> {selectedFeed.title || 'N/A'}</p>
                        <p><strong>Category:</strong> {selectedFeed.categoryName || 'N/A'}</p>
                        <p><strong>Reads:</strong> {selectedFeed.readCount || 0}</p>
                        <p><strong>Published:</strong> {selectedFeed.published ? 'Yes' : 'No'}</p>
                        <p><strong>Featured:</strong> {selectedFeed.featured ? 'Yes' : 'No'}</p>
                        <p><strong>Hidden:</strong> {selectedFeed.hidden ? 'Yes' : 'No'}</p>
                        <p><strong>Created:</strong> {formatDate(selectedFeed.createdAt)}</p>
                      </div>
                      <div className={styles.modalActions}>
                        {selectedFeed.hidden ? (
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleUnhideFeed(selectedFeed.id)}
                          >
                            Unhide
                          </button>
                        ) : (
                          <button
                            className={styles.actionBtnWarning}
                            onClick={() => handleHideFeed(selectedFeed.id)}
                          >
                            Hide
                          </button>
                        )}
                        {selectedFeed.featured ? (
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleUnfeatureFeed(selectedFeed.id)}
                          >
                            Unfeature
                          </button>
                        ) : (
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleFeatureFeed(selectedFeed.id)}
                          >
                            Feature
                          </button>
                        )}
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleUpdateFeedPublished(selectedFeed.id, !selectedFeed.published)}
                        >
                          {selectedFeed.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          className={styles.actionBtnDanger}
                          onClick={() => handleDeleteFeed(selectedFeed.id)}
                        >
                          Delete
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={() => setSelectedFeed(null)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className={styles.activitySection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Activity Logs</h2>
                  <div className={styles.searchBox}>
                    <input
                      type="text"
                      placeholder="Filter by action type..."
                      value={activityTypeFilter}
                      onChange={(e) => {
                        setActivityTypeFilter(e.target.value);
                        setActivityPage(0);
                      }}
                      className={styles.searchInput}
                    />
                  </div>
                </div>

                {activityLoading ? (
                  <div className={styles.loadingState}>Loading activity logs...</div>
                ) : activityLogs.length === 0 ? (
                  <div className={styles.emptyState}>No activity logs found.</div>
                ) : (
                  <>
                    <div className={styles.tableContainer}>
                      <table className={styles.dataTable}>
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Action</th>
                            <th>Description</th>
                            <th>Target</th>
                            <th>IP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activityLogs.map((log) => (
                            <tr key={log.id}>
                              <td>{formatDate(log.createdAt)}</td>
                              <td><span className={styles.badgeInfo}>{log.actionType}</span></td>
                              <td>{log.actionDescription}</td>
                              <td>
                                {log.targetType && log.targetId ? (
                                  <span>{log.targetType}: {log.targetId.substring(0, 20)}...</span>
                                ) : (
                                  'N/A'
                                )}
                              </td>
                              <td>{log.adminIp || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {activityTotalPages > 1 && (
                      <div className={styles.pagination}>
                        <button
                          className={styles.pageButton}
                          onClick={() => setActivityPage(prev => Math.max(0, prev - 1))}
                          disabled={activityPage === 0}
                        >
                          Previous
                        </button>
                        <span className={styles.pageInfo}>
                          Page {activityPage + 1} of {activityTotalPages}
                        </span>
                        <button
                          className={styles.pageButton}
                          onClick={() => setActivityPage(prev => prev + 1)}
                          disabled={activityPage >= activityTotalPages - 1}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
