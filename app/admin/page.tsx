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
  getAdminUserByEmail,
  getAdminUserByUsername,
  AdminUser,
  updateAdminUser,
  suspendAdminUser,
  unsuspendAdminUser,
  updateAdminUserCoins,
  updateAdminUserRank,
  getAdminCategories,
  updateAdminCategory,
  AdminCategory,
  AdminCategoryUpdatePayload,
  getAdminActivityLogs,
  AdminActivityLog,
  AdminActivityLogPage,
} from '@/lib/api';
import styles from './page.module.css';

type CategoryFormState = {
  name: string;
  imageUrl: string;
  query: string;
  concept: string;
  parentId: number | null;
  publicCategory: boolean;
  localized: boolean;
};

const INITIAL_CATEGORY_FORM: CategoryFormState = {
  name: '',
  imageUrl: '',
  query: '',
  concept: '',
  parentId: null,
  publicCategory: false,
  localized: false,
};

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'support' | 'users' | 'categories' | 'activity'>('dashboard');
  const [supportMessages, setSupportMessages] = useState<AdminFeedbackMessage[]>([]);
  const [supportPage, setSupportPage] = useState(0);
  const [supportTotalPages, setSupportTotalPages] = useState(0);
  const [supportLoading, setSupportLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  
  const [userSearchType, setUserSearchType] = useState<'email' | 'username'>('email');
  const [userSearchValue, setUserSearchValue] = useState('');
  const [userSearchResult, setUserSearchResult] = useState<AdminUser | null>(null);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchError, setUserSearchError] = useState('');
  const [lastUserSearch, setLastUserSearch] = useState<{ type: 'email' | 'username'; value: string } | null>(null);

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>({ ...INITIAL_CATEGORY_FORM });
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  
  // Activity logs state
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [activityPage, setActivityPage] = useState(0);
  const [activityTotalPages, setActivityTotalPages] = useState(0);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const authenticated = await checkAdminSession();
        if (cancelled) return;

        if (authenticated) {
          setIsAuthenticated(true);
        } else {
          router.replace('/admin/passcode');
        }
      } catch (error) {
        console.error('Error checking admin session:', error);
        if (!cancelled) {
          router.replace('/admin/passcode');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (activeTab === 'support') {
      loadSupportMessages();
    } else if (activeTab === 'categories') {
      loadCategories();
    } else if (activeTab === 'activity') {
      loadActivityLogs();
    }
  }, [isAuthenticated, activeTab, supportPage, statusFilter, activityPage, activityTypeFilter]);

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

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmedUserSearchValue = userSearchValue.trim();
  const isUserSearchValid =
    trimmedUserSearchValue.length > 0 &&
    (userSearchType === 'email'
      ? emailPattern.test(trimmedUserSearchValue)
      : !trimmedUserSearchValue.includes('@'));

  const fetchUser = async ({
    type,
    value,
    updateHistory = false,
  }: {
    type: 'email' | 'username';
    value: string;
    updateHistory?: boolean;
  }) => {
    setUserSearchLoading(true);
    setUserSearchError('');
    try {
      const fetcher = type === 'email' ? getAdminUserByEmail : getAdminUserByUsername;
      const user = await fetcher(value);
      setUserSearchResult(user);
      if (updateHistory) {
        setLastUserSearch({ type, value });
      }
    } catch (error: any) {
      setUserSearchResult(null);
      setUserSearchError(error?.message || 'User not found');
    } finally {
      setUserSearchLoading(false);
    }
  };

  const handleUserSearch = () => {
    if (!isUserSearchValid) {
      return;
    }
    fetchUser({ type: userSearchType, value: trimmedUserSearchValue, updateHistory: true });
  };

  const refreshLastUserSearch = async () => {
    if (!lastUserSearch) {
      return;
    }
    await fetchUser({ type: lastUserSearch.type, value: lastUserSearch.value });
  };

  const handleSuspendUser = async (userId: string, reason: string) => {
    try {
      await suspendAdminUser(userId, reason);
      await refreshLastUserSearch();
    } catch (error: any) {
      alert(error.message || 'Failed to suspend user');
    }
  };

  const handleUnsuspendUser = async (userId: string) => {
    try {
      await unsuspendAdminUser(userId);
      await refreshLastUserSearch();
    } catch (error: any) {
      alert(error.message || 'Failed to unsuspend user');
    }
  };

  const handleUpdateUserCoins = async (userId: string, coins: number) => {
    try {
      await updateAdminUserCoins(userId, coins);
      await refreshLastUserSearch();
    } catch (error: any) {
      alert(error.message || 'Failed to update user coins');
    }
  };

  const handleUpdateUserRank = async (userId: string, level: number) => {
    try {
      await updateAdminUserRank(userId, level);
      await refreshLastUserSearch();
    } catch (error: any) {
      alert(error.message || 'Failed to update user rank');
    }
  };

  const handleUpdateUser = async (
    userId: string,
    updates: { name?: string; headline?: string; email?: string }
  ) => {
    try {
      await updateAdminUser(userId, updates);
      await refreshLastUserSearch();
    } catch (error: any) {
      alert(error.message || 'Failed to update user');
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({ ...INITIAL_CATEGORY_FORM });
  };

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const result = await getAdminCategories();
      setCategories(result);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const openCategoryEditor = (category: AdminCategory) => {
    setSelectedCategory(category);
    setCategoryForm({
      name: category.name || '',
      imageUrl: category.imageUrl || '',
      query: category.query || '',
      concept: category.concept || '',
      parentId: category.parentId ?? null,
      publicCategory: category.publicCategory ?? false,
      localized: category.localized ?? false,
    });
    setCategoryError('');
  };

  const closeCategoryEditor = () => {
    setSelectedCategory(null);
    resetCategoryForm();
    setCategoryError('');
  };

  const handleCategorySave = async () => {
    if (!selectedCategory) {
      return;
    }
    if (!categoryForm.name.trim()) {
      setCategoryError('Category name is required.');
      return;
    }
    setCategoryError('');
    setCategorySaving(true);
    try {
      const payload: AdminCategoryUpdatePayload = {
        name: categoryForm.name.trim(),
        imageUrl: categoryForm.imageUrl.trim() === '' ? null : categoryForm.imageUrl.trim(),
        query: categoryForm.query.trim() === '' ? null : categoryForm.query.trim(),
        concept: categoryForm.concept.trim() === '' ? null : categoryForm.concept.trim(),
        parentId: categoryForm.parentId,
        publicCategory: categoryForm.publicCategory,
        localized: categoryForm.localized,
      };
      await updateAdminCategory(selectedCategory.id, payload);
      await loadCategories();
      closeCategoryEditor();
    } catch (error: any) {
      setCategoryError(error.message || 'Failed to update category');
    } finally {
      setCategorySaving(false);
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
              className={`${styles.tab} ${activeTab === 'categories' ? styles.active : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              Categories
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
                    <a href="https://developer.patreek.com" target="_blank" rel="noopener noreferrer" className={styles.actionButton}>
                      Open Swagger Docs
                    </a>
                    <a href="/admin/api-test" target="_blank" rel="noopener noreferrer" className={styles.actionButton}>
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
                    <button className={styles.actionButton} onClick={() => setActiveTab('categories')}>
                      Manage Categories
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
                  <h2 className={styles.sectionTitle}>User Lookup</h2>
                  <div className={styles.userSearchForm}>
                    <div className={styles.userSearchType}>
                      <label className={styles.userSearchOption}>
                        <input
                          type="radio"
                          name="userSearchType"
                          value="email"
                          checked={userSearchType === 'email'}
                          onChange={() => setUserSearchType('email')}
                        />
                        Email
                      </label>
                      <label className={styles.userSearchOption}>
                        <input
                          type="radio"
                          name="userSearchType"
                          value="username"
                          checked={userSearchType === 'username'}
                          onChange={() => setUserSearchType('username')}
                        />
                        Username
                      </label>
                    </div>
                    <div className={styles.searchBox}>
                      <input
                        type="text"
                        placeholder={
                          userSearchType === 'email'
                            ? 'Enter user email'
                            : 'Enter username (no @)'
                        }
                        value={userSearchValue}
                        onChange={(e) => setUserSearchValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUserSearch();
                          }
                        }}
                        className={styles.searchInput}
                      />
                    </div>
                    <button
                      className={styles.actionButton}
                      onClick={handleUserSearch}
                      disabled={!isUserSearchValid || userSearchLoading}
                    >
                      {userSearchLoading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  <p className={styles.userHelperText}>
                    Search by email or username to load a single user profile.
                  </p>
                </div>

                {!userSearchLoading && !isUserSearchValid && trimmedUserSearchValue !== '' && (
                  <p className={styles.alertDanger}>
                    {userSearchType === 'email'
                      ? 'Please enter a valid email address.'
                      : 'A username cannot include the @ symbol.'}
                  </p>
                )}

                {userSearchLoading ? (
                  <div className={styles.loadingState}>Looking up user...</div>
                ) : userSearchError ? (
                  <div className={styles.alertDanger}>{userSearchError}</div>
                ) : userSearchResult ? (
                  <div className={styles.userDetailCard}>
                    <div className={styles.userDetailRow}>
                      <div>
                        <div className={styles.userDetailLabel}>Name</div>
                        <div className={styles.userDetailValue}>{userSearchResult.name || 'N/A'}</div>
                      </div>
                      <div>
                        <div className={styles.userDetailLabel}>Username</div>
                        <div className={styles.userDetailValue}>{userSearchResult.username || 'N/A'}</div>
                      </div>
                      <div>
                        <div className={styles.userDetailLabel}>Email</div>
                        <div className={styles.userDetailValue}>{userSearchResult.email || 'N/A'}</div>
                      </div>
                    </div>
                    <div className={styles.userDetailRow}>
                      <div>
                        <div className={styles.userDetailLabel}>Coins</div>
                        <div className={styles.userDetailValue}>{userSearchResult.patCoins || 0}</div>
                      </div>
                      <div>
                        <div className={styles.userDetailLabel}>Rank</div>
                        <div className={styles.userDetailValue}>
                          {userSearchResult.rankName || 'N/A'} (Level {userSearchResult.rankLevel || 0})
                        </div>
                      </div>
                      <div>
                        <div className={styles.userDetailLabel}>Status</div>
                        <div className={styles.userDetailValue}>
                          {userSearchResult.suspended ? (
                            <span className={styles.badgeDanger}>Suspended</span>
                          ) : (
                            <span className={styles.badgeSuccess}>Active</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={styles.userDetailRow}>
                      <div>
                        <div className={styles.userDetailLabel}>Pats</div>
                        <div className={styles.userDetailValue}>{userSearchResult.totalPats || 0}</div>
                      </div>
                      <div>
                        <div className={styles.userDetailLabel}>Shares</div>
                        <div className={styles.userDetailValue}>{userSearchResult.totalShares || 0}</div>
                      </div>
                      <div>
                        <div className={styles.userDetailLabel}>Comments</div>
                        <div className={styles.userDetailValue}>{userSearchResult.totalComments || 0}</div>
                      </div>
                    </div>
                    <div className={styles.userDetailMeta}>
                      <p>
                        <strong>Headline:</strong> {userSearchResult.headline || 'N/A'}
                      </p>
                      {userSearchResult.suspensionReason && (
                        <p>
                          <strong>Suspension:</strong> {userSearchResult.suspensionReason}
                        </p>
                      )}
                    </div>
                    <div className={styles.userActions}>
                      {userSearchResult.suspended ? (
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleUnsuspendUser(userSearchResult.id)}
                        >
                          Unsuspend
                        </button>
                      ) : (
                        <button
                          className={styles.actionBtnDanger}
                          onClick={() => {
                            const reason = prompt('Enter suspension reason:');
                            if (reason) {
                              handleSuspendUser(userSearchResult.id, reason);
                            }
                          }}
                        >
                          Suspend
                        </button>
                      )}
                      <button
                        className={styles.actionBtn}
                        onClick={() => {
                          const name = prompt('Enter new name (or leave empty):', userSearchResult.name || '');
                          const headline = prompt('Enter new headline (or leave empty):', userSearchResult.headline || '');
                          const email = prompt('Enter new email (or leave empty):', userSearchResult.email || '');
                          const updates: { name?: string; headline?: string; email?: string } = {};
                          if (name !== null && name.trim() !== '') updates.name = name.trim();
                          if (headline !== null && headline.trim() !== '') updates.headline = headline.trim();
                          if (email !== null && email.trim() !== '') updates.email = email.trim();
                          if (Object.keys(updates).length > 0) {
                            handleUpdateUser(userSearchResult.id, updates);
                          }
                        }}
                      >
                        Edit Profile
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => {
                          const coins = prompt('Enter new coin amount (number):', (userSearchResult.patCoins || 0).toString());
                          if (coins) handleUpdateUserCoins(userSearchResult.id, parseInt(coins, 10));
                        }}
                      >
                        Update Coins
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => {
                          const level = prompt(
                            'Enter rank level (1-8):\n1=Cell, 2=Egg, 3=Neonate, 4=Nestling, 5=Fledgling, 6=Juvenile, 7=Adult, 8=Pundit',
                            (userSearchResult.rankLevel || 1).toString()
                          );
                          if (level) {
                            const levelNum = parseInt(level, 10);
                            if (levelNum >= 1 && levelNum <= 8) {
                              handleUpdateUserRank(userSearchResult.id, levelNum);
                            } else {
                              alert('Rank level must be between 1 and 8');
                            }
                          }
                        }}
                      >
                        Change Rank
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    Enter an email or username and click Search to inspect a user.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'categories' && (
              <div className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Category Management</h2>
                  <p className={styles.userHelperText}>
                    Manage every attribute of a category and keep the catalog in sync.
                  </p>
                </div>

                {categoriesLoading ? (
                  <div className={styles.loadingState}>Loading categories...</div>
                ) : categories.length === 0 ? (
                  <div className={styles.emptyState}>No categories available.</div>
                ) : (
                  <div className={styles.tableContainer}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Parent</th>
                          <th>Visibility</th>
                          <th>Scope</th>
                          <th>Query</th>
                          <th>Concept</th>
                          <th>Updated</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((category) => (
                          <tr key={category.id}>
                            <td>{category.id}</td>
                            <td>{category.name || 'Untitled'}</td>
                            <td>{category.parentName || '—'}</td>
                            <td>
                              <span className={styles.badgeInfo}>
                                {category.publicCategory ? 'Public' : 'Private'}
                              </span>
                            </td>
                            <td>
                              <span className={styles.badgeWarning}>
                                {category.localized ? 'Localized' : 'Global'}
                              </span>
                            </td>
                            <td>{category.query || '—'}</td>
                            <td>{category.concept || '—'}</td>
                            <td>{formatDate(category.updatedAt)}</td>
                            <td>
                              <button
                                className={styles.actionBtnSmall}
                                onClick={() => openCategoryEditor(category)}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedCategory && (
                  <div className={styles.modal}>
                    <div className={styles.modalContent}>
                      <h3>Edit Category: {selectedCategory.name || 'Unnamed'}</h3>
                      <div className={styles.modalBody}>
                        {categoryError && <div className={styles.alertDanger}>{categoryError}</div>}
                        <div className={styles.categoryFormRow}>
                          <label className={styles.categoryFormLabel}>Name</label>
                          <input
                            className={styles.searchInput}
                            type="text"
                            value={categoryForm.name}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className={styles.categoryFormRow}>
                          <label className={styles.categoryFormLabel}>Image URL</label>
                          <input
                            className={styles.searchInput}
                            type="text"
                            value={categoryForm.imageUrl}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                          />
                        </div>
                        <div className={styles.categoryFormRow}>
                          <label className={styles.categoryFormLabel}>Query</label>
                          <input
                            className={styles.searchInput}
                            type="text"
                            value={categoryForm.query}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, query: e.target.value }))}
                          />
                        </div>
                        <div className={styles.categoryFormRow}>
                          <label className={styles.categoryFormLabel}>Concept</label>
                          <input
                            className={styles.searchInput}
                            type="text"
                            value={categoryForm.concept}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, concept: e.target.value }))}
                          />
                        </div>
                        <div className={styles.categoryFormRow}>
                          <label className={styles.categoryFormLabel}>Parent Category</label>
                          <select
                            className={styles.searchInput}
                            value={categoryForm.parentId ?? ''}
                            onChange={(e) => {
                              setCategoryForm(prev => ({
                                ...prev,
                                parentId: e.target.value === '' ? null : Number(e.target.value),
                              }));
                            }}
                          >
                            <option value="">None</option>
                            {categories
                              .filter((cat) => cat.id !== selectedCategory.id)
                              .map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className={styles.categoryCheckboxGroup}>
                          <label className={styles.categoryCheckbox}>
                            <input
                              type="checkbox"
                              checked={categoryForm.publicCategory}
                              onChange={(e) =>
                                setCategoryForm(prev => ({ ...prev, publicCategory: e.target.checked }))
                              }
                            />
                            Public
                          </label>
                          <label className={styles.categoryCheckbox}>
                            <input
                              type="checkbox"
                              checked={categoryForm.localized}
                              onChange={(e) =>
                                setCategoryForm(prev => ({ ...prev, localized: e.target.checked }))
                              }
                            />
                            Localized
                          </label>
                        </div>
                      </div>
                      <div className={styles.modalActions}>
                        <button
                          className={styles.actionBtn}
                          onClick={handleCategorySave}
                          disabled={categorySaving}
                        >
                          {categorySaving ? 'Saving...' : 'Save changes'}
                        </button>
                        <button className={styles.actionBtn} onClick={closeCategoryEditor}>
                          Cancel
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
