'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './SignupModal.module.css';
import {
  Category,
  getCategories,
  checkUsernameAvailability,
  checkEmailAvailability,
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
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<StatusState>({ type: 'idle' });
  const [usernameStatus, setUsernameStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [emailStatus, setEmailStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

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

  const handleUsernameBlur = async () => {
    if (!username.trim()) {
      setUsernameStatus({ type: 'idle', message: '' });
      return;
    }
    setUsernameStatus({ type: 'idle', message: '' });
    try {
      const result = await checkUsernameAvailability(username.trim());
      setUsernameStatus({ type: 'success', message: result.message });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Username unavailable';
      setUsernameStatus({ type: 'error', message });
    }
  };

  const isValidEmailFormat = (email: string): boolean => {
    if (!email || !email.trim()) return false;
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email.trim());
  };

  const handleEmailBlur = async () => {
    if (!email.trim()) {
      setEmailStatus({ type: 'idle', message: '' });
      return;
    }
    
    // Validate email format first (client-side)
    if (!isValidEmailFormat(email)) {
      setEmailStatus({ type: 'error', message: 'Email is invalid' });
      return;
    }
    
    // Only check availability if email format is valid
    setEmailStatus({ type: 'idle', message: '' });
    try {
      const result = await checkEmailAvailability(email.trim());
      if (result.available) {
        setEmailStatus({ type: 'success', message: result.message });
      } else {
        setEmailStatus({ type: 'error', message: result.message });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Email unavailable';
      setEmailStatus({ type: 'error', message });
    }
  };

  // Password validation
  const validatePassword = (pwd: string) => {
    const requirements = {
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
    };
    return requirements;
  };
  
  const getPasswordErrors = (pwd: string): string[] => {
    const errors: string[] = [];
    const reqs = validatePassword(pwd);
    if (!reqs.minLength) errors.push('At least 8 characters');
    if (!reqs.hasUppercase) errors.push('At least one uppercase letter');
    if (!reqs.hasNumber) errors.push('At least one number');
    return errors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    
    // Check native HTML5 validation first
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    if (!name.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setStatus({ type: 'error', message: 'Please fill in name, username, email, and password.' });
      return;
    }
    
    // Validate password requirements
    const passwordErrors = getPasswordErrors(password);
    if (passwordErrors.length > 0) {
      setStatus({ type: 'error', message: `Password must have: ${passwordErrors.join(', ')}` });
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
      username: username.trim(),
      email: email.trim(),
      password,
      categoryIds: selectedCategories,
    };
    try {
      await registerUser(payload);
      // Redirect to submission success page
      router.push('/submission');
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to sign up right now. Please try again.';
      setStatus({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // SSO temporarily disabled - all users must complete the registration form manually
  // const handleSocial = (provider: 'google' | 'apple') => {
  //   if (typeof window === 'undefined') return;
  //   const redirectUri = window.location.origin + '/';
  //   const url = getSocialAuthUrl(provider, redirectUri);
  //   window.location.href = url;
  // };

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
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="username">
                Username
              </label>
              <input
                id="username"
                className={styles.input}
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  setUsernameStatus({ type: 'idle', message: '' });
                }}
                onBlur={handleUsernameBlur}
                placeholder="yourhandle"
                autoComplete="username"
                required
              />
              {usernameStatus.type === 'success' && (
                <div style={{ color: '#10b981', fontSize: '12px', marginTop: '4px' }}>
                  {usernameStatus.message || 'Username is available'}
                </div>
              )}
              {usernameStatus.type === 'error' && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                  {usernameStatus.message || 'Username is taken or invalid'}
                </div>
              )}
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className={styles.input}
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setEmailStatus({ type: 'idle', message: '' });
                }}
                onBlur={handleEmailBlur}
                placeholder="you@example.com"
                autoComplete="email"
                type="email"
                pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                required
              />
              {emailStatus.type === 'success' && (
                <div style={{ color: '#10b981', fontSize: '12px', marginTop: '4px' }}>
                  {emailStatus.message || 'Email is available'}
                </div>
              )}
              {emailStatus.type === 'error' && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                  {emailStatus.message || 'Email is already registered'}
                </div>
              )}
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
                required
                minLength={8}
                pattern="^(?=.*[A-Z])(?=.*[0-9]).{8,}$"
              />
              {password && getPasswordErrors(password).length > 0 && (
                <div style={{ color: '#a4001d', fontSize: '13px', marginTop: '4px', fontWeight: 700 }}>
                  Password must have: {getPasswordErrors(password).join(', ')}
                </div>
              )}
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
