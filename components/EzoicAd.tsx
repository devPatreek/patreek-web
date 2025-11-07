'use client';

import { useEffect, useRef } from 'react';
import styles from './EzoicAd.module.css';

interface EzoicAdProps {
  /**
   * Ezoic placement ID (e.g., 101, 102, etc.)
   * This is the ID you create in your Ezoic dashboard
   */
  placementId: number;
  /**
   * Whether to show a placeholder when ads are disabled or unavailable
   */
  showPlaceholder?: boolean;
}

/**
 * Ezoic Ad component
 * Displays Ezoic ads using the ezstandalone API
 */
export default function EzoicAd({
  placementId,
  showPlaceholder = false,
}: EzoicAdProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only load ads in browser environment
    if (typeof window === 'undefined') return;
    if (initializedRef.current) return;

    // Wait for ezstandalone to be available
    const initAd = () => {
      if (!adRef.current) return;

      try {
        // Check if ezstandalone is available
        if (typeof window.ezstandalone === 'undefined') {
          // Retry after a short delay
          setTimeout(initAd, 100);
          return;
        }

        // Initialize the ad
        window.ezstandalone.cmd.push(function () {
          window.ezstandalone.showAds(placementId);
        });

        initializedRef.current = true;
        console.log(`[EzoicAd] ✅ Ad placement ${placementId} initialized`);
      } catch (error) {
        console.error(`[EzoicAd] ❌ Failed to initialize ad placement ${placementId}:`, error);
      }
    };

    // Start initialization
    initAd();
  }, [placementId]);

  // Show placeholder if requested
  if (showPlaceholder && !initializedRef.current) {
    return (
      <div className={styles.placeholder}>
        <div className={styles.placeholderContent}>
          <span className={styles.placeholderText}>Advertisement</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.ezoicAd}>
      <div id={`ezoic-pub-ad-placeholder-${placementId}`} ref={adRef}></div>
    </div>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ezstandalone: {
      cmd: Array<() => void>;
      showAds: (...placementIds: number[]) => void;
      destroyPlaceholders: (...placementIds: number[]) => void;
      destroyAll: () => void;
      /**
       * Turn Anchor Ad on/off for a specific page
       * Must be called BEFORE showAds()
       * @param enabled - true to enable, false to disable
       */
      setEzoicAnchorAd: (enabled: boolean) => void;
      /**
       * Check if Anchor Ad has been closed by the user in this session
       * @returns true if Anchor Ad was closed, false otherwise
       */
      hasAnchorAdBeenClosed: () => boolean;
    };
  }
}

