'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <Link href="/" className={styles.logoLink}>
            <Image
              src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675caa3a2f73ad268a86b51a_Patreek%20logo_slogan.png"
              alt="Patreek"
              width={111}
              height={60}
              className={styles.footerLogo}
            />
          </Link>
          <div className={styles.footerColumn}>
            <div className={styles.columnTitle}>Product</div>
            <Link href="/" className={styles.footerLink}>
              Home
            </Link>
            <a href="https://patreek.com/features" className={styles.footerLink} target="_blank" rel="noopener noreferrer">
              Features
            </a>
            <a href="https://patreek.com/pricing" className={styles.footerLink} target="_blank" rel="noopener noreferrer">
              Pricing
            </a>
          </div>
          <div className={styles.footerColumn}>
            <div className={styles.columnTitle}>Company</div>
            <a href="https://patreek.com/about" className={styles.footerLink} target="_blank" rel="noopener noreferrer">
              About
            </a>
            <a href="https://patreek.com/contact" className={styles.footerLink} target="_blank" rel="noopener noreferrer">
              Contact
            </a>
            <Link href="/privacy" className={styles.footerLink}>
              Privacy Policy
            </Link>
            <Link href="/terms" className={styles.footerLink}>
              Terms & Conditions
            </Link>
          </div>
          <div className={styles.footerColumn}>
            <div className={styles.columnTitle}>Social</div>
            <a href="https://x.com/" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
              X (Twitter)
            </a>
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              Instagram
            </a>
            <a
              href="https://www.linkedin.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              LinkedIn
            </a>
          </div>
        </div>
        <div className={styles.divider}></div>
        <div className={styles.footerBottom}>
          <div className={styles.copyright}>© {new Date().getFullYear()} Patreek. All rights reserved.</div>
          <div className={styles.companyInfo}>Patreek App is owned by Sentigraph Inc.</div>
        </div>
      </div>
    </footer>
  );
}

