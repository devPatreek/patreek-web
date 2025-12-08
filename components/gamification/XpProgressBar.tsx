'use client';

import styles from './XpProgressBar.module.css';

interface XpProgressBarProps {
  currentXp: number;
  targetXp: number;
  rankName: string;
  dailyXp: number;
  dailyCap: number;
}

export default function XpProgressBar({
  currentXp,
  targetXp,
  rankName,
  dailyXp,
  dailyCap,
}: XpProgressBarProps) {
  const safeCurrent = Math.max(0, Math.floor(currentXp));
  const safeTarget = Math.max(1, Math.floor(targetXp));
  const safeDaily = Math.max(0, Math.floor(dailyXp));
  const safeDailyCap = Math.max(1, Math.floor(dailyCap));

  const levelPercent = safeTarget ? Math.min(100, Math.round((safeCurrent / safeTarget) * 100)) : 0;
  const dailyPercent = safeDailyCap ? Math.min(100, Math.round((safeDaily / safeDailyCap) * 100)) : 0;
  const canBuyRank = safeCurrent >= safeTarget * 0.7;

  return (
    <div className={styles.wrapper}>
      <div className={styles.titleRow}>
        <div>
          <p className={styles.sectionLabel}>Level Progress</p>
          <p className={styles.rankName}>{rankName}</p>
        </div>
        <p className={styles.levelText}>
          {safeCurrent.toLocaleString()} / {safeTarget.toLocaleString()} XP
        </p>
      </div>

      <div className={styles.progressTrack} aria-label="Level progress">
        <div
          className={styles.fill}
          style={{ width: `${levelPercent}%` }}
        />
      </div>

      <div className={styles.dailyRow}>
        <div>
          <p className={styles.dailyLabel}>Daily Focus</p>
          <p className={styles.dailyText}>
            {safeDaily.toLocaleString()} / {safeDailyCap.toLocaleString()} XP today
          </p>
        </div>
        <span className={styles.dailyPercent}>{dailyPercent}%</span>
      </div>

      <div className={styles.dailyTrack} aria-label="Daily focus progress">
        <div
          className={styles.dailyFill}
          style={{ width: `${dailyPercent}%` }}
        />
      </div>

      <div className={styles.actionsRow}>
        <button
          type="button"
          className={`${styles.buyButton} ${canBuyRank ? styles.buyActive : ''}`}
          disabled={!canBuyRank}
        >
          Buy Rank
        </button>
        <span className={styles.buyHint}>
          {canBuyRank ? 'Ready to ascend' : 'Need more XP to unlock next tier'}
        </span>
      </div>
    </div>
  );
}
