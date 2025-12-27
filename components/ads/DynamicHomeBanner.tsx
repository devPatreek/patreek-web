'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import styles from './DynamicHomeBanner.module.css';

type BannerState = 'loading' | 'active' | 'empty' | 'error';

type ActiveBanner = {
  imageUrl: string;
  targetUrl: string;
  sponsorName?: string;
};

export default function DynamicHomeBanner() {
  const [state, setState] = useState<BannerState>('loading');
  const [banner, setBanner] = useState<ActiveBanner | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAd() {
      setState('loading');
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/ads/active/home_banner`, {
          cache: 'no-store',
          credentials: 'include',
        });

        if (cancelled) return;

        if (response.status === 204) {
          setState('empty');
          return;
        }

        if (!response.ok) {
          setState('error');
          return;
        }

        const data = await response.json();
        setBanner(data);
        setState('active');
      } catch (error) {
        if (!cancelled) {
          setState('error');
        }
      }
    }

    fetchAd();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'active' && banner) {
    return (
      <section className={styles.banner}>
        <a
          className={styles.adCard}
          href={banner.targetUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Sponsored content"
        >
          <span className={styles.sponsoredBadge}>Sponsored</span>
          <img src={banner.imageUrl} alt="Patreek Sponsored Slot" className={styles.image} />
        </a>
      </section>
    );
  }

  return (
    <section className={styles.banner}>
      <div className={styles.fallback}>
        <p className={styles.tag}>Featured Partner</p>
        <h2 className={styles.title}>Book a premium news slot</h2>
        <p className={styles.copy}>
          Spotlight your brand inside the Patreek newsroom and multiply impressions across curated audiences.
        </p>
        <div className={styles.actions}>
          <Link href="/advertise" className={styles.cta}>
            Book this slot
          </Link>
          <span className={styles.secondary}>Reserve limited inventory</span>
        </div>
      </div>
    </section>
  );
}
