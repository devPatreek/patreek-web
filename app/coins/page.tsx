'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import styles from './page.module.css';
import Footer from '@/components/Footer';

export default function CoinsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [coins, setCoins] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get session token from localStorage
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('patreek_session') : null;
    setSessionToken(stored);
    setHasSession(Boolean(stored));
  }, []);

  useEffect(() => {
    if (!sessionToken) {
      setLoading(false);
      return;
    }

    // Fetch user profile to get coins
    const fetchCoins = async () => {
      try {
        const response = await fetch('https://api.patreek.com/api/v1/user/profile', {
          headers: {
            'X-Session-Token': sessionToken,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCoins(data.data?.patCoins ?? 0);
        } else {
          setError('Failed to load coins');
        }
      } catch (err) {
        setError('Error loading coins');
      } finally {
        setLoading(false);
      }
    };

    fetchCoins();
  }, [sessionToken]);

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <Link href="/" className={styles.logoLink} aria-label="Back to home">
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
            <button
              className={`${styles.navButtonLink} ${pathname === '/coins' ? styles.activeLink : ''}`}
              onClick={() => router.push('/coins')}
              type="button"
            >
              Coins
            </button>
            <button className={styles.navButtonLink} onClick={() => window.open('https://store.patreek.com', '_blank')} type="button">
              Store
            </button>
            <button className={styles.navButtonLink} onClick={() => router.push('/media')} type="button">
              Media
            </button>
            <button className={styles.navButtonLink} onClick={() => router.push('/community')} type="button">
              Community
            </button>
            <button className={styles.navButtonLink} onClick={() => router.push('/opinion')} type="button">
              Opinion
            </button>
          </nav>

          {hasSession ? (
            <button className={styles.profileButton} type="button" onClick={() => router.push('/home')}>
              Profile
            </button>
          ) : (
            <Link className={styles.signInButton} href="/registration">
              Sign up
            </Link>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.heading}>Pat Coins</h1>
          <p className={styles.subhead}>
            Your Pat Coins balance and gamification rewards
          </p>

          {loading ? (
            <div className={styles.loading}>Loading coins...</div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : sessionToken ? (
            <div className={styles.coinsCard}>
              <div className={styles.coinsDisplay}>
                <div className={styles.coinsIcon}>🪙</div>
                <div className={styles.coinsAmount}>
                  {coins !== null ? coins.toLocaleString() : '0'}
                </div>
                <div className={styles.coinsLabel}>Pat Coins</div>
              </div>
              <p className={styles.coinsDescription}>
                Earn coins by commenting, sharing, and patting articles. Use coins to purchase in-app items and rank upgrades.
              </p>
            </div>
          ) : (
            <div className={styles.signInPrompt}>
              <p>Please sign in to view your Pat Coins balance.</p>
              <Link href="/registration" className={styles.signInLink}>
                Sign In
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
