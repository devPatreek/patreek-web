'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import MainHeader from '@/components/MainHeader';
import Footer from '@/components/Footer';
import { checkSessionStatus, getUserProfile, signOut, updateProfile, UserProfile, UpdateProfilePayload } from '@/lib/api';
import XpProgressBar from '@/components/gamification/XpProgressBar';
import { useToast } from 'sonner';

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedHeadline, setEditedHeadline] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionResult = await checkSessionStatus();
        if (sessionResult.authenticated) {
          setIsAuthenticated(true);
          const userProfile = await getUserProfile();
          setProfile(userProfile);
          setEditedName(userProfile?.name || '');
          setEditedHeadline(userProfile?.headline || '');
        } else {
          // Not authenticated - redirect to registration
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

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to patreek.com after successful sign out
      window.location.href = 'https://patreek.com';
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if sign out fails, redirect to home
      window.location.href = 'https://patreek.com';
    }
  };

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
    // TODO: Implement dark mode persistence
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedName(profile?.name || '');
    setEditedHeadline(profile?.headline || '');
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName(profile?.name || '');
    setEditedHeadline(profile?.headline || '');
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const payload: UpdateProfilePayload = {
        name: editedName.trim() || undefined,
        headline: editedHeadline.trim() || undefined,
      };

      const updatedProfile = await updateProfile(payload);
      setProfile(updatedProfile);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const getTargetXpForLevel = (level: number) => {
    const ladder = {1: 1400, 2: 4200, 3: 12000, 4: 60000, 5: 120000, 6: 240000, 7: Infinity};
    return ladder[level + 1] || Infinity;
  };

  const getNextRankCost = (level: number) => {
    const costs = {1: 1000, 2: 3000, 3: 10000, 4: 50000, 5: 100000, 6: 200000};
    return costs[level] || 0;
  };

  const canBuyRankBoost = (profile: UserProfile | null) => {
    if (!profile || profile.rankLevel >= 7) return false;
    // Add 70% XP check logic if available
    return true;
  };

  const handleBuyRankBoost = async () => {
    if (!profile) return;
    try {
      const response = await fetch('/api/v1/user/rank/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to buy rank boost');
      }
      const data = await response.json();
      // Refresh profile
      const updatedProfile = await getUserProfile();
      setProfile(updatedProfile);
      // Show toast
      toast.success('Rank boost purchased! Check your new level.');
    } catch (error) {
      toast.error('Purchase failed. Check your coins and try again.');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <MainHeader hasSession={true} />
        <div className={styles.loading}>
          <p>Loading your profile…</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const rankLevel = profile?.rankLevel ?? 1;
  const currentXp = profile?.xp ?? 0;
  const adSlots = profile?.adSlots ?? 4;
  const targetXp = getTargetXpForLevel(rankLevel); // Define function below
  const rankName = profile?.rank?.name ?? 'Fledgling';

  const initials = profile?.name
    ? profile.name
        .split(' ')
        .map(part => part[0]?.toUpperCase())
        .join('')
        .slice(0, 2)
    : 'P';

  return (
    <div className={styles.page}>
      <MainHeader hasSession={true} />

      <main className={styles.main}>
        <div className={styles.container}>
          <section className={styles.heroCard}>
            <div className={styles.cover} />
            <div className={styles.heroInner}>
              <div className={styles.avatar}>
                {profile?.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.name || 'Profile'}
                    width={96}
                    height={96}
                    className={styles.avatarImage}
                  />
                ) : (
                  <span className={styles.avatarInitials}>{initials}</span>
                )}
              </div>
              <div className={styles.heroMeta}>
                {isEditing ? (
                  <div className={styles.editForm}>
                    <div className={styles.formGroup}>
                      <label htmlFor="name" className={styles.formLabel}>Name</label>
                      <input
                        id="name"
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className={styles.formInput}
                        maxLength={255}
                        placeholder="Your name"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="headline" className={styles.formLabel}>
                        Headline
                        <span className={styles.charCount}>
                          {editedHeadline.length}/150
                        </span>
                      </label>
                      <textarea
                        id="headline"
                        value={editedHeadline}
                        onChange={(e) => {
                          if (e.target.value.length <= 150) {
                            setEditedHeadline(e.target.value);
                          }
                        }}
                        className={styles.formTextarea}
                        maxLength={150}
                        placeholder="What you do for a living (e.g., Software Engineer at Tech Corp)"
                        rows={3}
                      />
                    </div>
                    {saveError && (
                      <div className={styles.errorMessage}>{saveError}</div>
                    )}
                    {saveSuccess && (
                      <div className={styles.successMessage}>Profile updated successfully!</div>
                    )}
                    <div className={styles.formActions}>
                      <button
                        onClick={handleCancel}
                        className={styles.cancelButton}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className={styles.saveButton}
                        disabled={isSaving}
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.nameRow}>
                      <h1 className={styles.name}>{profile?.name || 'Patreek User'}</h1>
                      {profile?.username && (
                        <p className={styles.username}>@{profile.username}</p>
                      )}
                    </div>
                    {profile?.headline && (
                      <p className={styles.headline}>{profile.headline}</p>
                    )}
                    {profile?.email && <p className={styles.email}>{profile.email}</p>}
                    {profile?.createdAt && (
                      <p className={styles.joined}>
                        Joined {new Date(profile.createdAt).toLocaleDateString()}
                      </p>
                    )}
                    <div className={styles.heroActions}>
                      <button onClick={handleEdit} className={styles.editButton}>
                        Edit Profile
                      </button>
                      <Link href="/home" className={styles.primaryButton}>View your pats</Link>
                      <Link href="/profile/categories" className={styles.secondaryButton}>Manage categories</Link>
                    </div>
                  </>
                )}
              </div>
            </div>
                  <div className={styles.statsRow}>
              <div className={styles.statChip}>
                <span className={styles.statLabel}>Pats</span>
                <span className={styles.statValue}>{profile?.totalPats ?? 0}</span>
              </div>
              <div className={styles.statChip}>
                <span className={styles.statLabel}>Comments</span>
                <span className={styles.statValue}>{profile?.totalComments ?? 0}</span>
              </div>
              <div className={styles.statChip}>
                <span className={styles.statLabel}>Shares</span>
                <span className={styles.statValue}>{profile?.totalShares ?? 0}</span>
              </div>
              <div className={styles.statChip}>
                <span className={styles.statLabel}>Pat Coins</span>
                <span className={styles.statValue}>{profile?.coins ?? 0}</span>
              </div>
            </div>
          </section>

          <div className={styles.progressSection}>
            <XpProgressBar
              currentXp={currentXp}
              targetXp={targetXp}
              rankName={profile?.rank?.name ?? 'Fledgling'}
              dailyXp={profile?.dailyXp ?? 0}
            />
            <div className={styles.adStatus}>
              {adSlots === 0 ? (
                <span className={styles.vipBadge}>VIP: Ad-Free Experience</span>
              ) : (
                <span className={styles.adBadge}>Ads Active ({adSlots} slots) - Level Up to Remove</span>
              )}
            </div>
            <button 
              onClick={handleBuyRankBoost} 
              className={styles.rankBoostButton}
              disabled={!canBuyRankBoost(profile)}
            >
              Buy Rank Boost ({getNextRankCost(rankLevel)} Pat Coins)
            </button>
          </div>
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.sectionTitle}>Account</h2>
              </div>
              <div className={styles.settingList}>
                <Link href="/profile/settings" className={styles.settingItem}>
                  <div className={styles.settingLeft}>
                    <span className={styles.settingIcon}>👤</span>
                    <span className={styles.settingLabel}>Profile settings</span>
                  </div>
                  <span className={styles.settingArrow}>→</span>
                </Link>
                <Link href="/profile/categories" className={styles.settingItem}>
                  <div className={styles.settingLeft}>
                    <span className={styles.settingIcon}>📰</span>
                    <span className={styles.settingLabel}>News categories</span>
                  </div>
                  <span className={styles.settingArrow}>→</span>
                </Link>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.sectionTitle}>Preferences</h2>
              </div>
              <div className={styles.settingList}>
                <div className={styles.settingItem}>
                  <div className={styles.settingLeft}>
                    <span className={styles.settingIcon}>🌙</span>
                    <span className={styles.settingLabel}>Dark mode</span>
                  </div>
                  <label className={styles.toggle}>
                    <input type="checkbox" checked={darkMode} onChange={handleDarkModeToggle} />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.sectionTitle}>Support</h2>
              </div>
              <div className={styles.settingList}>
                <Link href="/terms" className={styles.settingItem}>
                  <div className={styles.settingLeft}>
                    <span className={styles.settingIcon}>📄</span>
                    <span className={styles.settingLabel}>Terms & Conditions</span>
                  </div>
                  <span className={styles.settingArrow}>→</span>
                </Link>
                <Link href="/contact" className={styles.settingItem}>
                  <div className={styles.settingLeft}>
                    <span className={styles.settingIcon}>💬</span>
                    <span className={styles.settingLabel}>Help & Support</span>
                  </div>
                  <span className={styles.settingArrow}>→</span>
                </Link>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.sectionTitle}>Account actions</h2>
              </div>
              <div className={styles.settingList}>
                <button onClick={handleSignOut} className={`${styles.settingItem} ${styles.signOutButton}`}>
                  <div className={styles.settingLeft}>
                    <span className={styles.settingIcon}>🚪</span>
                    <span className={styles.settingLabel}>Sign out</span>
                  </div>
                  <span className={styles.settingArrow}>→</span>
                </button>
                <button
                  className={`${styles.settingItem} ${styles.deleteButton}`}
                  onClick={() => {
                    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                      console.log('Delete account');
                    }
                  }}
                >
                  <div className={styles.settingLeft}>
                    <span className={styles.settingIcon}>🗑️</span>
                    <span className={styles.settingLabel}>Delete account</span>
                  </div>
                  <span className={styles.settingArrow}>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
