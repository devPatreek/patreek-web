"use client";

import { useEffect, useMemo, useState, useId } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './MainHeader.module.css';
import { getUserProfile, checkSessionStatus, getEconomyMetadata } from '@/lib/api';

type Props = {
  hasSession?: boolean;
  active?: string;
};

type NavItem = {
  label: string;
  path: string;
};

export default function MainHeader({ hasSession = false, active }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [coinPrice, setCoinPrice] = useState<number | null>(null);
  const normalizedActive = useMemo(() => active?.toLowerCase(), [active]);

  const navItems: NavItem[] = [
    { label: 'Coins', path: '/coins' },
    { label: 'Community', path: '/community' },
    { label: 'Shop', path: 'https://shop.patreek.com' },
    { label: 'Opinion', path: '/opinion' },
    { label: 'Write', path: '/write' },
  ];

  useEffect(() => {
    const fetch = async () => {
      if (!hasSession) return;
      try {
        const session = await checkSessionStatus();
        if (!session.authenticated) return;
        const profile = await getUserProfile();
        if (profile?.username) {
          setUsername(profile.username);
        }
      } catch {
        setUsername(null);
      }
    };
    fetch();
  }, [hasSession]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const metadata = await getEconomyMetadata();
        if (!cancelled && metadata && Number.isFinite(metadata.unitPrice)) {
          setCoinPrice(metadata.unitPrice);
        }
      } catch (error) {
        console.warn('[Header] Failed to load Pat Coin price', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleProfile = () => {
    if (hasSession && username) {
      router.push(`/u/${username}`);
    } else {
      router.push('/registration');
    }
  };

  const isLinkActive = (item: NavItem) => {
    if (normalizedActive && normalizedActive === item.label.toLowerCase()) {
      return true;
    }
    if (pathname && item.path.startsWith('/') && pathname.startsWith(item.path)) {
      return true;
    }
    return false;
  };

  const coinPriceDisplay = useMemo(() => {
    const value = coinPrice ?? 0.01;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value);
  }, [coinPrice]);

  return (
    <header className={styles.header}>
      <div className={styles.brand} onClick={() => router.push('/')}>
        Patreek
      </div>
      <nav className={styles.nav}>
        {navItems.map(item => (
          <Link
            key={item.label}
            href={item.path}
            className={`${styles.navLink} ${isLinkActive(item) ? styles.activeLink : ''}`}
            target={item.path.startsWith('http') ? '_blank' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className={styles.actions}>
        <Link
          href="/coins"
          className={styles.coinWidget}
          aria-label={`Open Pat Coins — 1 P equals ${coinPriceDisplay}`}
        >
          <PatCoinIcon className={styles.coinIcon} />
          <div className={styles.coinText}>
            <span className={styles.coinLabel}>Pat Coin</span>
            <span className={styles.coinValue}>
              1&nbsp;P = {coinPriceDisplay}
            </span>
          </div>
        </Link>
        <button
          type="button"
          className={styles.profileCircle}
          onClick={handleProfile}
          aria-label="Open profile"
        >
          {username ? username[0].toUpperCase() : 'P'}
        </button>
        <button
          type="button"
          className={styles.hamburger}
          onClick={() => setIsMenuOpen(prev => !prev)}
          aria-label="Toggle navigation"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      {isMenuOpen && (
        <div className={styles.mobileNav}>
          {navItems.map(item => (
            <Link
              key={item.label}
              href={item.path}
              className={styles.mobileNavItem}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

function PatCoinIcon({ className }: { className?: string }) {
  const gradientId = useId();

  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="45%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill={`url(#${gradientId})`} />
      <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <path
        d="M11.5 9h6.2c3 0 5.3 2.2 5.3 4.9 0 2.6-2.3 4.9-5.3 4.9h-3.1v4.2h-3.1V9zm6 7.1c1.3 0 2.2-.9 2.2-2.1s-.9-2-2.2-2h-2.9v4.1z"
        fill="#fff"
      />
    </svg>
  );
}
