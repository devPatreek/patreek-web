'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './SignupModal.module.css';
import {
  Category,
  getCategories,
  getSocialAuthUrl,
  registerUser,
  SignupPayload,
} from '@/lib/api';

type SignupModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

type StatusState =
  | { type: 'idle' }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

export default function SignupModal({ open, onClose, onSuccess }: SignupModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<StatusState>({ type: 'idle' });

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    setIsLoadingCategories(true);
    getCategories()
      .then(data => {
        if (isMounted) {
          setCategories(data || []);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      // Reset when closing
      setStatus({ type: 'idle' });
      setIsSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const canSelectMore = selectedCategories.length < 5;

  const toggleCategory = (id: number) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter(item => item !== id));
    } else if (canSelectMore) {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setStatus({ type: 'error', message: 'Please fill in name, email, and password.' });
      return;
    }
    if (selectedCategories.length === 0) {
      setStatus({ type: 'error', message: 'Pick at least one category (up to 5).' });
      return;
    }
    setIsSubmitting(true);
    setStatus({ type: 'idle' });
    const payload: SignupPayload = {
      name: name.trim(),
      email: email.trim(),
      password,
      categoryIds: selectedCategories,
    };
    try {
      await registerUser(payload);
      setStatus({ type: 'success', message: 'Account created! Redirecting…' });
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to sign up right now. Please try again.';
      setStatus({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocial = (provider: 'google' | 'apple') => {
    if (typeof window === 'undefined') return;
    const redirectUri = window.location.origin + '/';
    const url = getSocialAuthUrl(provider, redirectUri);
    window.location.href = url;
  };

  const categoryChips = useMemo(() => {
    if (isLoadingCategories) {
      return (
        <div className={styles.muted}>Loading categories…</div>
      );
    }
    if (!categories.length) {
      return <div className={styles.muted}>Categories will load here once available.</div>;
    }
    return (
      <div className={styles.categoryGrid}>
        {categories.map(category => {
          const isSelected = selectedCategories.includes(category.id);
          const disabled = !isSelected && !canSelectMore;
          return (
            <button
              key={category.id}
              type="button"
              className={[
                styles.chip,
                isSelected ? styles.chipSelected : '',
                disabled ? styles.chipDisabled : '',
              ].join(' ')}
              onClick={() => toggleCategory(category.id)}
              disabled={disabled}
              aria-pressed={isSelected}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    );
  }, [categories, selectedCategories, canSelectMore, isLoadingCategories]);

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.side}>
          <div>
            <h3 className={styles.sideTitle}>Personalized pats in minutes.</h3>
            <p className={styles.sideText}>
              Sign up, choose up to 5 categories, and we&apos;ll build your lane of headlines—just like the mobile experience.
            </p>
            <ul className={styles.sideList}>
              <li className={styles.sideListItem}>⚡ Instant access</li>
              <li className={styles.sideListItem}>📱 Mirror mobile onboarding</li>
              <li className={styles.sideListItem}>🎯 Curated by your picks</li>
            </ul>
          </div>
        </div>
        <div className={styles.main}>
          <div className={styles.header}>
            <h2 className={styles.title}>Create your Patreek account</h2>
            <button className={styles.closeButton} aria-label="Close signup" onClick={onClose}>
              ×
            </button>
          </div>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                className={styles.input}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className={styles.input}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                type="email"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className={styles.input}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                autoComplete="new-password"
              />
            </div>
            <div className={styles.fieldGroup}>
              <div className={styles.label}>Pick up to 5 categories</div>
              <div className={styles.categories}>{categoryChips}</div>
              <div className={styles.muted}>
                {selectedCategories.length} / 5 selected
              </div>
            </div>
            {status.type === 'success' && (
              <div className={styles.status}>{status.message}</div>
            )}
            {status.type === 'error' && (
              <div className={`${styles.status} ${styles.error}`}>{status.message}</div>
            )}
            <div className={styles.actions}>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing you up…' : 'Sign up'}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => handleSocial('google')}
              >
                Continue with Google
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => handleSocial('apple')}
              >
                Continue with Apple
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
