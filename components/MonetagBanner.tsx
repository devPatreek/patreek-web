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
  showPlaceholder = true, // Default to true for debugging - set to false once ads are working
  size = 'responsive',
}: MonetagBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adVisible, setAdVisible] = useState(false);

  useEffect(() => {
    // Only load ads in browser environment
    if (typeof window === 'undefined') return;
    if (!adRef.current) return;
    if (!zoneId) return;

    // Create a unique container ID for this ad slot
    const containerId = `monetag-banner-${zoneId}-${placementId || 'default'}`;
    adRef.current.id = containerId;

    // Monetag banner ads use the exact script pattern provided:
    // (function(s){s.dataset.zone='ZONE_ID',s.src='https://gizokraijaw.net/vignette.min.js'})(...)
    // We'll inject this script using dangerouslySetInnerHTML to match Monetag's exact format
    const scriptCode = `(function(s){s.dataset.zone='${zoneId}',s.src='https://gizokraijaw.net/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`;
    
    // Create script element with the exact Monetag pattern
    const script = document.createElement('script');
    script.textContent = scriptCode;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    
    if (placementId) {
      script.setAttribute('data-placement', placementId);
    }

    // Wrap in try-catch to suppress Monetag's internal errors
    script.onerror = () => {
      // Suppress errors - Monetag may have internal timeout issues that don't break functionality
      if (showPlaceholder) {
        setAdLoaded(false);
      }
    };

    // Append script to the ad container
    adRef.current.appendChild(script);
    
    // Check if ad content appears in the container
    const checkAdVisibility = () => {
      if (adRef.current) {
        // Check if Monetag has injected content (iframe, img, or other elements)
        const hasContent = adRef.current.querySelector('iframe, img, div[style*="position"]') !== null;
        if (hasContent) {
          setAdVisible(true);
          setAdLoaded(true);
          return true;
        }
      }
      return false;
    };
    
    // Check periodically for ad content
    const visibilityTimer = setInterval(() => {
      if (checkAdVisibility()) {
        clearInterval(visibilityTimer);
      }
    }, 500);
    
    // Mark as loaded after a delay (Monetag loads asynchronously)
    const timer = setTimeout(() => {
      checkAdVisibility();
      clearInterval(visibilityTimer);
      setAdLoaded(true); // Mark as loaded even if no ad content yet
    }, 3000);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      clearInterval(visibilityTimer);
      if (adRef.current && script.parentNode === adRef.current) {
        adRef.current.removeChild(script);
      }
    };
  }, [zoneId, placementId, showPlaceholder]);

  if (!zoneId) {
    return null;
  }

  // Show placeholder if requested and ad content isn't visible
  const shouldShowPlaceholder = showPlaceholder && !adVisible;

  return (
    <div 
      ref={adRef}
      className={`${styles.monetagBanner} ${shouldShowPlaceholder ? styles.withPlaceholder : ''}`}
      data-zone={String(zoneId)}
      data-placement={placementId}
      data-size={size}
      style={{
        minHeight: size === '728x90' ? '90px' : size === '300x250' ? '250px' : size === '320x50' ? '50px' : '100px',
        width: '100%',
        position: 'relative',
      }}
    >
      {/* Monetag script will inject the ad content here */}
      {shouldShowPlaceholder && (
        <div className={styles.placeholderOverlay}>
          <div className={styles.placeholderContent}>
            <span className={styles.placeholderText}>
              Ad Slot: {placementId || 'banner'} (Zone: {zoneId})
            </span>
            <span className={styles.placeholderSubtext}>
              {adLoaded ? 'Waiting for ad content...' : 'Loading ad...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

