"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './AuthWallModal.module.css';

interface AuthWallModalProps {
  isOpen: boolean;
  triggerAction: string;
  onClose?: () => void;
  onRegister?: () => void;
  disableClose?: boolean;
}

export default function AuthWallModal({
  isOpen,
  triggerAction,
  onClose,
  onRegister,
  disableClose = false,
}: AuthWallModalProps) {
  const router = useRouter();

  if (!isOpen) {
    return null;
  }

  const handleGoHome = () => {
    router.push('/');
    onClose?.();
  };

  const handleSignIn = () => {
    router.push('/registration');
    onClose?.();
  };

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Members only</p>
          <h3>Unlock this {triggerAction}</h3>
          {!disableClose && onClose && (
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close modal">
              ×
            </button>
          )}
        </div>
        <p className={styles.copy}>
          Signing in gives you access to full articles, leaderboard chats, and private categories.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={handleSignIn}>
            Sign In
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={onRegister ?? handleSignIn}
          >
            Register
          </button>
          <button type="button" className={styles.link} onClick={handleGoHome}>
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}
