"use client";

import { useEffect, useState } from 'react';
import styles from './AppDownloadBanner.module.css';

export default function AppDownloadBanner() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!isMobile) {
    return null;
  }

  return (
    <div className={styles.banner}>
      <p className={styles.title}>Get the Patreek app</p>
      <div className={styles.buttons}>
        <a href="#" className={styles.storeButton}>
          App Store
        </a>
        <a href="#" className={styles.storeButton}>
          Google Play
        </a>
      </div>
    </div>
  );
}
