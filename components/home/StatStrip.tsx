'use client';

import styles from './StatStrip.module.css';

const stats = [
  { label: 'S&P 500', value: '↗ 0.15%', color: '#16a34a' },
  { label: 'BTC', value: '↘ 1.2%', color: '#dc2626' },
  { label: 'Melissa, TX', value: '☀️ 64°F', color: '#f97316' },
  { label: 'Daily Tip', value: 'Drink water', color: '#0ea5e9' },
];

export default function StatStrip() {
  return (
    <div className={styles.strip}>
      {stats.map(stat => (
        <div key={stat.label} className={styles.item}>
          <span className={styles.label}>{stat.label}</span>
          <span className={styles.value} style={{ color: stat.color }}>
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
