import styles from './RankBadge.module.css';

interface RankBadgeProps {
  rankName?: string;
  className?: string;
}

export default function RankBadge({ rankName = 'Reader', className = '' }: RankBadgeProps) {
  // Simple helper to determine color based on rank name
  const getRankColorClass = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('gold') || lower.includes('expert')) return styles.gold;
    if (lower.includes('silver') || lower.includes('pro')) return styles.silver;
    if (lower.includes('bronze') || lower.includes('newbie')) return styles.bronze;
    return styles.default;
  };

  return (
    <span className={`${styles.badge} ${getRankColorClass(rankName)} ${className}`}>
      {rankName}
    </span>
  );
}

