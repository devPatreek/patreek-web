"use client";

import Link from 'next/link';
import styles from './Footer.module.css';

const navLinks = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Help', href: '/help' },
  { label: 'About', href: '/about' },
];

const socialLinks = [
  { label: 'X', href: 'https://x.com/patreek', aria: 'Open Patreek on X' },
  { label: 'Facebook', href: 'https://facebook.com', aria: 'Open Patreek on Facebook' },
  { label: 'Instagram', href: 'https://instagram.com', aria: 'Open Patreek on Instagram' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.links}>
        {navLinks.map(link => (
          <Link key={link.label} href={link.href} className={styles.link}>
            {link.label}
          </Link>
        ))}
      </div>
      <div className={styles.right}>
        <span className={styles.copy}>© {year} Patreek</span>
        <div className={styles.socials}>
          {socialLinks.map(social => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.aria}
              className={styles.socialButton}
            >
              {social.label === 'X' ? 'X' : social.label.charAt(0)}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
