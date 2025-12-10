'use client';

import styles from './DailyFocusWidget.module.css';

export default function DailyFocusWidget() {
  return (
    <div className={styles.widget}>
      <p className={styles.title}>Daily Focus</p>
      <p className={styles.copy}>
        You’re trending in <strong>Business</strong> — keep patting the stories that matter.
      </p>
      <div className={styles.progress}>
        <span>40 XP</span>
        <span>80 XP Goal</span>
      </div>
      <div className={styles.track}>
        <span style={{ width: '60%' }} />
      </div>
    </div>
  );
}
