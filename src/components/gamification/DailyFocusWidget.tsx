import React from 'react';
import styles from './DailyFocusWidget.module.css';

interface DailyFocusWidgetProps {
  current: number;
  max: number;
}

const DailyFocusWidget: React.FC<DailyFocusWidgetProps> = ({ current, max }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (current / max) * circumference;
  const isComplete = current >= max;

  return (
    <div className={styles.root}>
      <svg className={styles.ring} width="150" height="150" viewBox="0 0 150 150">
        <circle
          className={styles.ringBg}
          strokeWidth="10"
          fill="transparent"
          r={radius}
          cx="75"
          cy="75"
        />
        <circle
          className={`${styles.ringFg} ${isComplete ? styles.gold : ''}`}
          strokeWidth="10"
          fill="transparent"
          r={radius}
          cx="75"
          cy="75"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: isComplete ? 0 : offset,
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
          }}
        />
      </svg>
      <div className={styles.textContainer}>
        <div className={styles.mainText}>Daily Focus</div>
        <div className={styles.progressText}>{`${current}/${max}`}</div>
      </div>
    </div>
  );
};

export default DailyFocusWidget;
