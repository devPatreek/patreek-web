'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './MonetagBanner.module.css';

interface MonetagBannerProps {
  /**
   * Monetag zone ID for this banner ad placement
   * Each ad slot should have its own zone ID from Monetag dashboard
   * Get this from Monetag when creating a Banner ad zone
   */
  zoneId: string | number;
  /**
   * Placement identifier (for tracking/debugging)
   */
  placementId?: string;
  /**
   * Whether to show a placeholder when ads are disabled or unavailable
   */
  showPlaceholder?: boolean;
  /**
   * Ad size/style
   */
  size?: 'auto' | '728x90' | '300x250' | '320x50' | 'responsive';
}

/**
 * Monetag Banner Ad component
 * Displays banner ads in designated ad slots using Monetag's placement system
 * 
 * Note: You need to create Banner ad zones in Monetag dashboard and get zone IDs
 * for each placement (top-banner, in-feed, bottom-banner, etc.)
 */
export default function MonetagBanner({
  zoneId,
  placementId,
  showPlaceholder = false,
  size = 'responsive',
}: MonetagBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    // Only load ads in browser environment
    if (typeof window === 'undefined') return;
    if (!adRef.current) return;
    if (!zoneId) return;

    // Create a unique container ID for this ad slot
    const containerId = `monetag-banner-${zoneId}-${placementId || 'default'}`;
    adRef.current.id = containerId;

    // Monetag banner ads work by creating divs with data-zone attributes
    // The global vignette script (from layout.tsx) will detect these divs
    // and render banner ads in them
    
    // Set data attributes for Monetag to detect
    adRef.current.setAttribute('data-zone', String(zoneId));
    adRef.current.setAttribute('data-slot', String(zoneId));
    
    if (placementId) {
      adRef.current.setAttribute('data-placement', placementId);
    }

    // Check if Monetag script is loaded (from layout.tsx)
    const checkMonetagLoaded = () => {
      // The vignette script should be loaded globally
      // Monetag will automatically detect divs with data-zone attributes
      setAdLoaded(true);
    };

    // Wait a bit for Monetag script to initialize
    const timer = setTimeout(checkMonetagLoaded, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [zoneId, placementId]);

  // Show placeholder if requested and ad hasn't loaded
  if (showPlaceholder && (!zoneId || !adLoaded)) {
    return (
      <div className={styles.placeholder}>
        <div className={styles.placeholderContent}>
          <span className={styles.placeholderText}>Advertisement ({placementId || 'banner'})</span>
        </div>
      </div>
    );
  }

  if (!zoneId) {
    return null;
  }

  return (
    <div 
      ref={adRef}
      className={styles.monetagBanner}
      data-zone={String(zoneId)}
      data-placement={placementId}
      data-size={size}
      style={{
        minHeight: size === '728x90' ? '90px' : size === '300x250' ? '250px' : size === '320x50' ? '50px' : '100px',
        width: '100%',
      }}
    >
      {/* Monetag script will inject the ad content here */}
    </div>
  );
}

