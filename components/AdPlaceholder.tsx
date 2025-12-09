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
  /**
   * The viewer's rank level to decide whether ads should be shown
   */
  rankLevel?: number;
}

/**
 * Generic Ad Placeholder component
 * Reserved space for future ad network integration
 * Currently displays a placeholder, ready for ad network implementation
 */
export default function AdPlaceholder({
  placementId,
  showPlaceholder = true,
  rankLevel,
}: AdPlaceholderProps) {
  if (!showPlaceholder) {
    return null;
  }

  if (typeof rankLevel === 'number' && rankLevel >= 5) {
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
