'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import styles from './page.module.css';
import {
  Category,
  getCategories,
  getAllCategories,
  getPublicCategories,
  getSocialAuthUrl,
  checkUsernameAvailability,
  loginUser,
  registerUser,
  SigninPayload,
  SignupPayload,
} from '@/lib/api';
import AdsterraSlot from '@/components/AdsterraSlot';
import countriesData from '@/data/countries.json';

type Country = { code: string; name: string };

type Status =
  | { type: 'idle' }
  | { type: 'error'; message: string }
  | { type: 'success'; message: string };

export default function RegistrationPage() {
  const router = useRouter();
  const [activeForm, setActiveForm] = useState<'signup' | 'signin'>('signup');

  // Sign up form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [countryQuery, setCountryQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const [signupStatus, setSignupStatus] = useState<Status>({ type: 'idle' });
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Sign in form state
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [signinStatus, setSigninStatus] = useState<Status>({ type: 'idle' });
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<Status>({ type: 'idle' });
  const [usernameMessage, setUsernameMessage] = useState('');

  // Load categories on component mount and when switching to signup form
  useEffect(() => {
    // Only load categories when on signup form
    if (activeForm !== 'signup') {
      return;
    }
    
    let mounted = true;
    let isCancelled = false;
    
    async function loadCategories() {
      if (isCancelled || !mounted) return;
      
      console.log('[Registration] useEffect triggered - Loading categories...');
      setIsLoadingCategories(true);
      setCategoriesError(null);
      
      try {
        console.log('[Registration] Calling getAllCategories()...');
        const data = await getAllCategories();
        console.log('[Registration] Categories response received:', data);
        
        if (!mounted || isCancelled) return;
        
        if (data && Array.isArray(data) && data.length > 0) {
          console.log('[Registration] Setting', data.length, 'categories');
          setCategories(data);
          setCategoriesError(null);
        } else {
          console.warn('[Registration] No categories returned or empty array');
          setCategories([]);
          setCategoriesError('No categories available. Please try again later.');
        }
        setIsLoadingCategories(false);
      } catch (error) {
        console.error('[Registration] Failed to load public categories:', error);
        if (mounted && !isCancelled) {
          setCategories([]);
          setCategoriesError('Failed to load categories. Please refresh the page.');
          setIsLoadingCategories(false);
        }
      }
    }
    
    loadCategories();
    
    return () => {
      mounted = false;
      isCancelled = true;
    };
  }, [activeForm]);

  // Close country dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement)?.closest(`#country`)
      ) {
        setIsCountryDropdownOpen(false);
      }
    }

    if (isCountryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isCountryDropdownOpen]);

  const canSelectMore = selectedCategories.length < 5;

  const parents = useMemo(() => categories.filter(cat => !cat.parentId), [categories]);

  const childrenByParent = useMemo(() => {
    const map = new Map<number, Category[]>();

    const walkChildren = (parentId: number, kids?: Category[]) => {
      if (!kids || kids.length === 0) return;
      const existing = map.get(parentId) || [];
      existing.push(...kids);
      map.set(parentId, existing);
      kids.forEach(child => {
        if (child.children && child.children.length) {
          walkChildren(child.id, child.children);
        }
      });
    };

    parents.forEach(parent => {
      walkChildren(parent.id, parent.children);
    });

    // Also include any categories returned flat with parentId set (defensive)
    categories
      .filter(cat => cat.parentId)
      .forEach(child => {
        const list = map.get(child.parentId!) || [];
        if (!list.find(c => c.id === child.id)) {
          list.push(child);
          map.set(child.parentId!, list);
        }
      });

    return map;
  }, [categories, parents]);

  const toggleParentExpand = (id: number) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
    if (categoriesError) {
      return (
        <div className={`${styles.muted} ${styles.error}`}>
          {categoriesError}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={styles.retryButton}
            style={{ marginLeft: '8px', padding: '4px 8px', fontSize: '12px' }}
          >
            Retry
          </button>
        </div>
      );
    }
    if (!parents.length) {
      return <div className={styles.muted}>No categories available. Please try again later.</div>;
    }
    return (
      <div className={styles.accordion}>
        {parents.map(parent => {
          const kids = childrenByParent.get(parent.id) || [];
          const expanded = expandedCategories.has(parent.id);
          return (
            <div key={parent.id} className={styles.accordionItem}>
              <button
                type="button"
                className={styles.accordionHeader}
                onClick={() => toggleParentExpand(parent.id)}
                aria-expanded={expanded}
              >
                <span className={styles.accordionTitle}>{parent.name}</span>
                <span className={styles.accordionChevron}>{expanded ? '▴' : '▾'}</span>
              </button>
              {expanded && (
                <div className={styles.accordionBody}>
                  {kids.length ? (
                    <div className={styles.categoryGrid}>
                      {kids.map(child => {
                        const isSelected = selectedCategories.includes(child.id);
                        const disabled = !isSelected && !canSelectMore;
                        return (
                          <button
                            key={child.id}
                            type="button"
                            className={[
                              styles.chip,
                              isSelected ? styles.chipSelected : '',
                              disabled ? styles.chipDisabled : '',
                            ].join(' ')}
                            onClick={() => toggleCategory(child.id)}
                            disabled={disabled}
                            aria-pressed={isSelected}
                          >
                            {child.name}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.muted}>No subcategories available.</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }, [
    parents,
    childrenByParent,
    selectedCategories,
    canSelectMore,
    isLoadingCategories,
    categoriesError,
    expandedCategories,
  ]);

  const filteredCountries = useMemo(() => {
    if (!countryQuery.trim()) return countriesData as Country[];
    return (countriesData as Country[]).filter(country =>
      country.name.toLowerCase().includes(countryQuery.trim().toLowerCase()) ||
      country.code.toLowerCase().includes(countryQuery.trim().toLowerCase()),
    );
  }, [countryQuery]);

  const handleUsernameBlur = async () => {
    if (!username.trim()) {
      setUsernameStatus({ type: 'idle' });
      setUsernameMessage('');
      return;
    }
    setUsernameStatus({ type: 'idle' });
    try {
      const result = await checkUsernameAvailability(username.trim());
      if (result.available) {
        setUsernameStatus({ type: 'success', message: result.message || 'Username is available' });
        setUsernameMessage(result.message || 'Username is available');
      } else {
        setUsernameStatus({ type: 'error', message: result.message || 'Username is not available' });
        setUsernameMessage(result.message || 'Username is not available');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Username unavailable';
      setUsernameStatus({ type: 'error', message });
      setUsernameMessage(message);
    }
  };

  const handleSocial = (provider: 'google' | 'apple') => {
    if (typeof window === 'undefined') return;
    const redirectUri = window.location.origin + '/';
    const url = getSocialAuthUrl(provider, redirectUri);
    window.location.href = url;
  };

  const handleSignupSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setSignupStatus({ type: 'error', message: 'Please fill in name, username, email, and password.' });
      return;
    }
    if (password !== confirmPassword) {
      setSignupStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    if (!selectedCountry) {
      setSignupStatus({ type: 'error', message: 'Please select your country.' });
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
      username: username.trim(),
      email: email.trim(),
      password,
      categoryIds: selectedCategories,
      countryCode: selectedCountry,
    };
    try {
      await registerUser(payload);
      setSignupStatus({
        type: 'success',
        message: 'Account created! Please check your email to verify and then sign in.',
      });
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

        <div className={styles.getApp}>
          <span className={styles.getAppText}>Get the App</span>
          <a
            href="https://apps.apple.com/us/app/patreek/id6547858283"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.storeIcon}
            aria-label="Download on the App Store"
          >
            <Image
              src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/67a3729b558347b9bf210a5a_Store%3DApp%20Store%2C%20Type%3DDark%2C%20Language%3DEnglish%402x.png"
              alt="App Store"
              width={95}
              height={30}
            />
          </a>
          <a
            href=""
            className={styles.storeIcon}
            aria-label="Get it on Google Play (coming soon)"
          >
            <Image
              src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/67a3727c8abb3515ab42d712_Store%3DGoogle%20Play%2C%20Type%3DDark%2C%20Language%3DEnglish%402x.png"
              alt="Google Play"
              width={95}
              height={30}
            />
          </a>
        </div>

        <nav className={styles.headerNav} aria-label="Registration navigation">
          <Link className={styles.headerLink} href="/contact">
            Help
          </Link>
          <Link className={styles.headerLink} href="/terms">
            Terms
          </Link>
          <Link className={styles.headerLink} href="/privacy">
            Privacy
          </Link>
        </nav>
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
                <label className={styles.label} htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  className={styles.input}
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value);
                    setUsernameStatus({ type: 'idle' });
                    setUsernameMessage('');
                  }}
                  onBlur={handleUsernameBlur}
                  placeholder="yourhandle"
                  autoComplete="username"
                  required
                />
                {usernameStatus.type === 'success' && (
                  <div className={`${styles.statusInline} ${styles.successInline}`}>
                    {usernameMessage || 'Username is available'}
                  </div>
                )}
                {usernameStatus.type === 'error' && (
                  <div className={`${styles.statusInline} ${styles.errorInline}`}>
                    {usernameMessage || 'Username is taken or invalid'}
                  </div>
                )}
              </div>
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
                  <div className={styles.inputWithToggle}>
                    <input
                      id="password"
                      className={styles.input}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className={styles.eyeButton}
                      onClick={() => setShowPassword(prev => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="confirm-password">
                    Confirm password
                  </label>
                  <div className={styles.inputWithToggle}>
                    <input
                      id="confirm-password"
                      className={styles.input}
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className={styles.eyeButton}
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <div className={`${styles.statusInline} ${styles.errorInline}`}>
                      Passwords must match.
                    </div>
                  )}
                </div>

              <div className={styles.fieldGroup} ref={countryDropdownRef}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="country">
                    Country
                  </label>
                  {selectedCountry && (
                    <span className={styles.countryPill}>{selectedCountry}</span>
                  )}
                </div>
                <input
                  id="country"
                  className={styles.input}
                  value={countryQuery}
                  onChange={e => {
                    setCountryQuery(e.target.value);
                    setIsCountryDropdownOpen(true);
                  }}
                  onFocus={() => setIsCountryDropdownOpen(true)}
                  placeholder="Search country"
                  autoComplete="off"
                />
                {isCountryDropdownOpen && filteredCountries.length > 0 && (
                  <div className={styles.countryList}>
                    {filteredCountries.map(country => (
                      <button
                        key={country.code}
                        type="button"
                        className={`${styles.countryItem} ${
                          selectedCountry === country.code ? styles.countryItemSelected : ''
                        }`}
                        onClick={() => {
                          setSelectedCountry(country.code);
                          setCountryQuery('');
                          setIsCountryDropdownOpen(false);
                        }}
                      >
                        <span className={styles.countryName}>{country.name}</span>
                        <span className={styles.countryCode}>{country.code}</span>
                      </button>
                    ))}
                  </div>
                )}
                {!selectedCountry && !isCountryDropdownOpen && (
                  <div className={`${styles.statusInline} ${styles.errorInline}`}>
                    Select your country to continue.
                  </div>
                )}
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
                    aria-label="Continue with Google"
                    >
                      <svg
                        className={styles.socialIcon}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 488 512"
                        role="img"
                        aria-hidden="true"
                      >
                        <path
                          fill="#EA4335"
                          d="M488 261.8c0-17.4-1.6-34.1-4.6-50.4H249v95.4h135.5c-5.9 32-23.5 59.1-50.1 77.3v64.3h80.9c47.3-43.6 74.7-107.9 74.7-186.6z"
                        />
                        <path
                          fill="#34A853"
                          d="M249 492c67.6 0 124.3-22.4 165.7-60.9l-80.9-64.3c-22.6 15.2-51.5 24.2-84.8 24.2-65 0-120.1-43.9-139.8-103.1H25.9v64.8C67.2 438.4 151.7 492 249 492z"
                        />
                        <path
                          fill="#4A90E2"
                          d="M109.2 287.9c-4.9-15.2-7.7-31.4-7.7-48s2.8-32.8 7.7-48.1v-64.8H25.9C9.4 160.9 0 202.6 0 247.9s9.4 87 25.9 120.9l83.3-64.9z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M249 141.8c35.7 0 67.6 12.3 92.7 36.2l69.5-69.5C373.3 60.3 316.6 36 249 36c-97.3 0-181.8 53.6-223.1 131.9l83.3 64.9C128.9 185.7 184 141.8 249 141.8z"
                        />
                      </svg>
                      <span className={styles.srOnly}>Continue with Google</span>
                    </button>
                    <button
                      type="button"
                      className={styles.social}
                      onClick={() => handleSocial('apple')}
                    aria-label="Continue with Apple"
                    >
                      <svg
                        className={styles.socialIcon}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 448 512"
                        role="img"
                        aria-hidden="true"
                      >
                        <path
                          fill="currentColor"
                          d="M350.14 129.15c-22.01 26.18-52.8 41.47-84.43 38.64-4.08-32.69 10.71-67.43 30.33-88.82 22.01-24.89 57.6-42.32 86.6-43.03 3.84 31.77-8.98 66.04-32.5 93.21zm-47.45 62.03c-47.57-.28-88.24 27.63-110.88 27.63-23.63 0-55.67-26.54-92.06-25.85-47.47.74-91.21 27.57-115.15 70.09-49.06 85.1-12.65 211.14 35.23 280.5 23.36 33.75 51.44 71.74 88.25 70.04 35.29-1.43 48.65-22.79 91.31-22.79 42.67 0 54.89 22.79 91.38 22.06 37.91-.59 61.73-34.44 84.98-68.2 26.67-38.97 37.63-76.68 37.99-78.7-.82-.36-72.76-27.94-73.3-110.95-.59-69.24 56.17-101.58 58.72-102.94-32.07-47.1-81.79-52.33-99.47-53.79z"
                        />
                      </svg>
                      <span className={styles.srOnly}>Continue with Apple</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form className={styles.form} onSubmit={handleSigninSubmit}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="signin-email">
                    Email
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
                      aria-label="Sign in with Google"
                    >
                      <svg
                        className={styles.socialIcon}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 488 512"
                        role="img"
                        aria-hidden="true"
                      >
                        <path
                          fill="#EA4335"
                          d="M488 261.8c0-17.4-1.6-34.1-4.6-50.4H249v95.4h135.5c-5.9 32-23.5 59.1-50.1 77.3v64.3h80.9c47.3-43.6 74.7-107.9 74.7-186.6z"
                        />
                        <path
                          fill="#34A853"
                          d="M249 492c67.6 0 124.3-22.4 165.7-60.9l-80.9-64.3c-22.6 15.2-51.5 24.2-84.8 24.2-65 0-120.1-43.9-139.8-103.1H25.9v64.8C67.2 438.4 151.7 492 249 492z"
                        />
                        <path
                          fill="#4A90E2"
                          d="M109.2 287.9c-4.9-15.2-7.7-31.4-7.7-48s2.8-32.8 7.7-48.1v-64.8H25.9C9.4 160.9 0 202.6 0 247.9s9.4 87 25.9 120.9l83.3-64.9z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M249 141.8c35.7 0 67.6 12.3 92.7 36.2l69.5-69.5C373.3 60.3 316.6 36 249 36c-97.3 0-181.8 53.6-223.1 131.9l83.3 64.9C128.9 185.7 184 141.8 249 141.8z"
                        />
                      </svg>
                      <span className={styles.srOnly}>Sign in with Google</span>
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

      <section className={styles.adSection} aria-label="Sponsored banner">
        <div className={styles.adInner}>
          <AdsterraSlot variant="native" className={styles.adCard} />
        </div>
      </section>

      <Footer />
    </div>
  );
}
