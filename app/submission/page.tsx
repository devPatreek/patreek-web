'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function SubmissionPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logoLink} aria-label="Back to home">
          <Image
            src="/logo.png"
            alt="Patreek"
            width={120}
            height={40}
            priority
          />
        </Link>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.iconContainer}>
            <svg
              className={styles.checkIcon}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h1 className={styles.title}>Account Created Successfully!</h1>
          
          <p className={styles.message}>
            Your account has been successfully created. Please check your email to verify your account.
          </p>

          <p className={styles.subMessage}>
            We&apos;ve sent a verification email to the address you provided. Click the link in the email to complete your registration.
          </p>

          <div className={styles.actions}>
            <Link href="/" className={styles.homeLink}>
              Visit Home Page
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

