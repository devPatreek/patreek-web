import React from 'react';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  // Normalize string to lowercase to handle API variations (e.g., "ACTIVE" vs "active")
  const normalized = status?.toLowerCase() || 'unknown';

  let variantClass = styles.neutral;

  if (['active', 'approved', 'published', 'resolved', 'unlocked'].includes(normalized)) {
    variantClass = styles.success;
  } else if (['banned', 'rejected', 'suspended', 'deleted', 'locked'].includes(normalized)) {
    variantClass = styles.danger;
  } else if (['pending', 'review', 'warning'].includes(normalized)) {
    variantClass = styles.warning;
  }

  return (
    <span className={`${styles.badge} ${variantClass} ${className}`}>
      {status}
    </span>
  );
}
