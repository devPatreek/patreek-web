'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import styles from './page.module.css';
import {
  Category,
  getCategories,
  getPublicCategories,
  getSocialAuthUrl,
  loginUser,
  registerUser,
  SigninPayload,
  SignupPayload,
} from '@/lib/api';

type Status =
  | { type: 'idle' }
  | { type: 'error'; message: string }
  | { type: 'success'; message: string };

export default function RegistrationPage() {
  const router = useRouter();
  const [activeForm, setActiveForm] = useState<'signup' | 'signin'>('signup');

  // Sign up form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [signupStatus, setSignupStatus] = useState<Status>({ type: 'idle' });
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Sign in form state
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [signinStatus, setSigninStatus] = useState<Status>({ type: 'idle' });
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadCategories() {
      setIsLoadingCategories(true);
      const data = await getPublicCategories();
      if (mounted) {
        setCategories(data && data.length ? data : []);
        setIsLoadingCategories(false);
      }
      if (mounted && (!data || data.length === 0)) {
        // Fallback to authenticated endpoint if public one returns nothing
        const fallback = await getCategories();
        setCategories(fallback || []);
        setIsLoadingCategories(false);
      }
    }
    loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

  const canSelectMore = selectedCategories.length < 5;

  const toggleCategory = (id: number) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter(item => item !== id));
    } else if (canSelectMore) {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const categoryChips = useMemo(() => {
    if (isLoadingCategories) {
      return <div className={styles.muted}>Loading categories…</div>;
    }
    if (!categories.length) {
      return <div className={styles.muted}>Categories will appear here soon.</div>;
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

  const handleSocial = (provider: 'google' | 'apple') => {
    if (typeof window === 'undefined') return;
    const redirectUri = window.location.origin + '/';
    const url = getSocialAuthUrl(provider, redirectUri);
    window.location.href = url;
  };

  const handleSignupSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setSignupStatus({ type: 'error', message: 'Please fill in name, email, and password.' });
      return;
    }
    if (selectedCategories.length === 0) {
      setSignupStatus({ type: 'error', message: 'Pick at least one category (up to 5).' });
      return;
    }
    setIsSigningUp(true);
    setSignupStatus({ type: 'idle' });
    const payload: SignupPayload = {
      name: name.trim(),
      email: email.trim(),
      password,
      categoryIds: selectedCategories,
    };
    try {
      const response = await registerUser(payload);
      const sessionValue = response.token || 'signed_up';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('patreek_session', sessionValue);
      }
      setSignupStatus({ type: 'success', message: 'Account created! You are all set.' });
      router.push('/');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to sign up right now. Please try again.';
      setSignupStatus({ type: 'error', message });
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleSigninSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!signinEmail.trim() || !signinPassword.trim()) {
      setSigninStatus({ type: 'error', message: 'Enter your email and password to continue.' });
      return;
    }
    setIsSigningIn(true);
    setSigninStatus({ type: 'idle' });
    const payload: SigninPayload = {
      email: signinEmail.trim(),
      password: signinPassword,
      rememberMe,
    };
    try {
      const response = await loginUser(payload);
      const sessionValue = response.token || 'signed_in';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('patreek_session', sessionValue);
      }
      setSigninStatus({ type: 'success', message: 'Signed in! Redirecting…' });
      router.push('/');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to sign in right now. Please try again.';
      setSigninStatus({ type: 'error', message });
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logoLink} aria-label="Back to home">
          <Image
            src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675caa3a2f73ad268a86b51a_Patreek%20logo_slogan.png"
            alt="Patreek"
            width={120}
            height={44}
            className={styles.logo}
          />
        </Link>
        <div className={styles.headerActions}>
          <Link className={styles.headerLink} href="/">
            Home
          </Link>
          <Link className={styles.headerLink} href="/registration">
            Sign up
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}>Mobile-first, web ready</p>
            <h1 className={styles.heroTitle}>Create your Patreek account.</h1>
            <p className={styles.heroSubtitle}>
              Pick up to 5 categories, mirror the mobile onboarding, and unlock your personalized pats.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>Stay signed in sync</span>
              <span className={styles.badge}>Google & Apple SSO</span>
              <span className={styles.badge}>Fast desktop flow</span>
            </div>
          </div>
        </section>

        <section className={styles.formShell}>
          <div className={styles.card}>
            <div className={styles.formToggle} role="tablist" aria-label="Auth selection">
              <button
                className={`${styles.toggleButton} ${
                  activeForm === 'signup' ? styles.toggleActive : ''
                }`}
                onClick={() => setActiveForm('signup')}
                role="tab"
                aria-selected={activeForm === 'signup'}
              >
                Sign up
              </button>
              <button
                className={`${styles.toggleButton} ${
                  activeForm === 'signin' ? styles.toggleActive : ''
                }`}
                onClick={() => setActiveForm('signin')}
                role="tab"
                aria-selected={activeForm === 'signin'}
              >
                Sign in
              </button>
            </div>

            {activeForm === 'signup' ? (
              <form className={styles.form} onSubmit={handleSignupSubmit}>
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
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    className={styles.input}
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.labelRow}>
                    <label className={styles.label}>Pick up to 5 categories</label>
                    <span className={styles.counter}>{selectedCategories.length} / 5</span>
                  </div>
                  {categoryChips}
                </div>

                {signupStatus.type === 'success' && (
                  <div className={styles.status}>{signupStatus.message}</div>
                )}
                {signupStatus.type === 'error' && (
                  <div className={`${styles.status} ${styles.error}`}>{signupStatus.message}</div>
                )}

                <div className={styles.actions}>
                  <button type="submit" className={styles.primary} disabled={isSigningUp}>
                    {isSigningUp ? 'Signing you up…' : 'Create account'}
                  </button>
                  <div className={styles.socialRow}>
                    <button
                      type="button"
                      className={styles.social}
                      onClick={() => handleSocial('google')}
                    >
                      Continue with Google
                    </button>
                    <button
                      type="button"
                      className={styles.social}
                      onClick={() => handleSocial('apple')}
                    >
                      Continue with Apple
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form className={styles.form} onSubmit={handleSigninSubmit}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="signin-email">
                    Username, email, or mobile
                  </label>
                  <input
                    id="signin-email"
                    className={styles.input}
                    type="email"
                    value={signinEmail}
                    onChange={e => setSigninEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="signin-password">
                    Password
                  </label>
                  <input
                    id="signin-password"
                    className={styles.input}
                    type="password"
                    value={signinPassword}
                    onChange={e => setSigninPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>

                <div className={styles.helperRow}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                    />
                    <span>Stay signed in</span>
                  </label>
                  <Link href="/" className={styles.helperLink}>
                    Forgot password?
                  </Link>
                </div>

                {signinStatus.type === 'success' && (
                  <div className={styles.status}>{signinStatus.message}</div>
                )}
                {signinStatus.type === 'error' && (
                  <div className={`${styles.status} ${styles.error}`}>{signinStatus.message}</div>
                )}

                <div className={styles.actions}>
                  <button type="submit" className={styles.primary} disabled={isSigningIn}>
                    {isSigningIn ? 'Signing in…' : 'Next'}
                  </button>
                  <div className={styles.socialRow}>
                    <button
                      type="button"
                      className={styles.social}
                      onClick={() => handleSocial('google')}
                    >
                      Sign in with Google
                    </button>
                  </div>
                  <div className={styles.switchRow}>
                    <span>New to Patreek?</span>
                    <button
                      type="button"
                      className={styles.textButton}
                      onClick={() => setActiveForm('signup')}
                    >
                      Create an account
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
