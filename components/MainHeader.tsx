"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './MainHeader.module.css';
import { getUserProfile, checkSessionStatus } from '@/lib/api';

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
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Search Patreek"
        >
          🔍
        </button>
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
