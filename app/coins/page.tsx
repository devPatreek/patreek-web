'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Footer from '@/components/Footer';
import MainHeader from '@/components/MainHeader';
import PricingCard from '@/components/ui/PricingCard';
import { checkSessionStatus, getUserProfile, UserProfile } from '@/lib/api';

const bundles = [
  { id: 'coins_100', title: 'Small Bundle', coins: 100, price: 0.99, description: 'Kickstart your pat streak with a small boost.' },
  { id: 'coins_550', title: 'Medium Bundle', coins: 550, price: 4.99, description: 'Popular choice for creators and comment champions.', popular: true },
  { id: 'coins_1200', title: 'Large Bundle', coins: 1200, price: 9.99, description: 'Best value for heavy tasters and community builders.' },
];

export default function CoinsPage() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);

  useEffect(() => {
    const checkSessionAndFetch = async () => {
      try {
        const sessionResult = await checkSessionStatus();
        if (!sessionResult.authenticated) {
          setHasSession(false);
          return;
        }
        setHasSession(true);
        const userProfile = await getUserProfile();
        setProfile(userProfile);
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    };

    checkSessionAndFetch();
  }, []);

  const handlePurchase = async (bundle: typeof bundles[number]) => {
    setToast(null);
    setPurchaseLoading(bundle.id);
    try {
      const createIntent = await fetch('/api/v1/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bundleId: bundle.id }),
      });
      if (!createIntent.ok) {
        throw new Error('Unable to start payment.');
      }
      const intentData = await createIntent.json();
      const intentId = intentData.data?.id || intentData.id || '';

      const confirm = await fetch('/api/v1/payment/mock-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paymentIntentId: intentId, bundleId: bundle.id }),
      });
      if (!confirm.ok) {
        throw new Error('Unable to confirm payment.');
      }

      const confirmData = await confirm.json();
      if (confirmData.success) {
        const updatedProfile = await getUserProfile();
        if (updatedProfile) {
          setProfile(updatedProfile);
          const balanceText = updatedProfile.coins !== undefined ? updatedProfile.coins : '—';
          setToast(`Success! ${bundle.coins} Pat Coins added. New balance: ${balanceText}`);
        } else {
          setToast(`Success! ${bundle.coins} Pat Coins added.`);
        }
      } else {
        throw new Error(confirmData.error || 'Payment confirmation failed.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Purchase failed.';
      setToast(message);
    } finally {
      setPurchaseLoading(null);
    }
  };

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className={styles.page}>
      <MainHeader active="coins" hasSession={hasSession} />

      <main className={styles.main}>
        <section className={styles.heroRow}>
          <div>
            <h1 className={styles.heading}>Pat Coins Store</h1>
            <p className={styles.subhead}>Top up instantly and keep your community shining.</p>
          </div>
          <div className={styles.badge}>Earn 1 Pat = $1 inside Patreek</div>
        </section>

        {toast && <div className={styles.toast}>{toast}</div>}

        {loading ? (
          <div className={styles.loading}>Checking your session…</div>
        ) : !hasSession ? (
          <div className={styles.signInPrompt}>
            <p className={styles.promptText}>Sign in to unlock coin balances and instant payments.</p>
            <button className={styles.signInButton} onClick={() => router.push('/registration')}>
              Sign up or Sign in
            </button>
          </div>
        ) : (
          <>
            <section className={styles.balanceCard}>
              <div>
                <p className={styles.balanceLabel}>Your balance</p>
                <h2 className={styles.balanceValue}>{(profile?.coins ?? 0).toLocaleString()}</h2>
                <p className={styles.balanceMeta}>Pat Coins</p>
              </div>
              <div className={styles.balanceSupplement}>
                <p className={styles.balanceSupplementLabel}>Earning boosts</p>
                <p className={styles.balanceSupplementCopy}>Complete daily challenges to earn extra coins.</p>
              </div>
            </section>

            <section className={styles.bundleSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Coin bundles</h2>
                <p className={styles.sectionSubtitle}>All purchases go through secure payment and confirm automatically.</p>
              </div>
              <div className={styles.bundleGrid}>
                {bundles.map((bundle) => (
                  <PricingCard
                    key={bundle.id}
                    title={bundle.title}
                    coins={bundle.coins}
                    priceLabel={`$${bundle.price.toFixed(2)}`}
                    description={bundle.description}
                    isPopular={Boolean(bundle.popular)}
                    onSelect={() => handlePurchase(bundle)}
                    disabled={purchaseLoading === bundle.id}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
