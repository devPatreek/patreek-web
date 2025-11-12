'use client';

import styles from './AdPlaceholder.module.css';

interface AdPlaceholderProps {
  /**
   * Ad placement identifier (for future ad network integration)
   * This can be used to identify different ad positions
   */
  placementId?: string | number;
  /**
   * Whether to show the placeholder
   * Set to false to hide the ad space completely
   */
  showPlaceholder?: boolean;
}

/**
 * Generic Ad Placeholder component
 * Reserved space for future ad network integration
 * Currently displays a placeholder, ready for ad network implementation
 */
export default function AdPlaceholder({
  placementId,
  showPlaceholder = true,
}: AdPlaceholderProps) {
  if (!showPlaceholder) {
    return null;
  }

  return (
    <div className={styles.adPlaceholder}>
      <div className={styles.placeholderContent}>
        <span className={styles.placeholderText}>Advertisement</span>
      </div>
    </div>
  );
}

