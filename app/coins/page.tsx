'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Footer from '@/components/Footer';
import MainHeader from '@/components/MainHeader';

export default function CoinsPage() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);
  const [coins, setCoins] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState('100');
  const [purchaseMethod, setPurchaseMethod] = useState<'card' | 'usdc'>('card');
  const [redeemBenefit, setRedeemBenefit] = useState('Ad-free day');
  const [redeemAmount, setRedeemAmount] = useState('50');
  const [sendAmount, setSendAmount] = useState('25');
  const [sendUser, setSendUser] = useState('');

  useEffect(() => {
    // Check session status and fetch coins
    // Tries cookie first (preferred), then localStorage token as header (fallback)
    const checkSessionAndFetchCoins = async () => {
      try {
        const { checkSessionStatus, getUserProfile } = await import('@/lib/api');
        
        // First check if user has a valid session
        const sessionResult = await checkSessionStatus();
        const isAuthenticated = sessionResult.authenticated;
        setHasSession(isAuthenticated);

        if (!isAuthenticated) {
          setLoading(false);
          return;
        }

        // Fetch user profile to get coins
        // API will try cookie first, then localStorage token as header
        const profileData = await getUserProfile();
        if (profileData) {
          setCoins(profileData.coins ?? 0);
        } else {
          setError('Failed to load coins');
        }
      } catch (err) {
        setError('Error loading coins');
      } finally {
        setLoading(false);
      }
    };

    checkSessionAndFetchCoins();
  }, []);

  const benefits = [
    { name: 'Ad-free day', cost: 50, description: 'Hide ads for 24 hours' },
    { name: 'Boosted pat', cost: 100, description: 'Feature your pat higher for 6 hours' },
    { name: 'Profile flair', cost: 75, description: 'Unlock a rare badge for 7 days' },
    { name: 'Comment highlight', cost: 40, description: 'Highlight one comment for extra visibility' },
  ];

  const handleStub = (msg: string) => {
    alert(`${msg} — wire this to backend when ready.`);
  };

  return (
    <div className={styles.page}>
      <MainHeader active="coins" hasSession={hasSession} />

      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.heroRow}>
            <div>
              <h1 className={styles.heading}>Pat Coins</h1>
              <p className={styles.subhead}>Earn, redeem, or send coins. 1 Pat = $1 (in-app).</p>
            </div>
            <div className={styles.feePill}>
              <span className={styles.feeDot} /> In-app redemptions have 0% fee. External cash-out not enabled.
            </div>
          </div>

          {loading ? (
            <div className={styles.loading}>Loading coins...</div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : hasSession ? (
            <>
              <div className={styles.balanceCard}>
                <div>
                  <p className={styles.balanceLabel}>Available</p>
                  <h2 className={styles.balanceValue}>{coins !== null ? coins.toLocaleString() : '0'}</h2>
                  <p className={styles.balanceSub}>Pat Coins</p>
                </div>
                <div className={styles.balanceMeta}>
                  <p className={styles.metaTitle}>Earning tips</p>
                  <ul className={styles.metaList}>
                    <li>+ Pats on your posts</li>
                    <li>+ Approved comments</li>
                    <li>+ Shares of your pats</li>
                  </ul>
                </div>
              </div>

              <div className={styles.grid}>
                <section className={styles.card}>
                  <header className={styles.cardHeader}>
                    <div>
                      <p className={styles.cardEyebrow}>Buy</p>
                      <h3 className={styles.cardTitle}>Purchase Pat Coins</h3>
                    </div>
                    <div className={styles.chip}>Fiat / Stable</div>
                  </header>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Amount</label>
                    <div className={styles.inputRow}>
                      <input
                        type="number"
                        min="1"
                        value={purchaseAmount}
                        onChange={e => setPurchaseAmount(e.target.value)}
                        className={styles.input}
                      />
                      <span className={styles.inputSuffix}>Pat</span>
                    </div>
                    <p className={styles.hint}>= ${(Number(purchaseAmount) || 0).toFixed(2)} USD</p>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Pay with</label>
                    <div className={styles.segment}>
                      <button
                        className={`${styles.segmentBtn} ${purchaseMethod === 'card' ? styles.segmentActive : ''}`}
                        onClick={() => setPurchaseMethod('card')}
                      >
                        💳 Card
                      </button>
                      <button
                        className={`${styles.segmentBtn} ${purchaseMethod === 'usdc' ? styles.segmentActive : ''}`}
                        onClick={() => setPurchaseMethod('usdc')}
                      >
                        🪙 USDC
                      </button>
                    </div>
                  </div>
                  <button className={styles.primaryAction} onClick={() => handleStub('Purchase flow')}>
                    Purchase
                  </button>
                  <p className={styles.finePrint}>Payment processing fee may apply from provider. No Patreek fee to buy.</p>
                </section>

                <section className={styles.card}>
                  <header className={styles.cardHeader}>
                    <div>
                      <p className={styles.cardEyebrow}>Redeem</p>
                      <h3 className={styles.cardTitle}>Swap coins for benefits</h3>
                    </div>
                    <div className={styles.chip}>0% fee</div>
                  </header>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Choose benefit</label>
                    <select
                      className={styles.select}
                      value={redeemBenefit}
                      onChange={e => setRedeemBenefit(e.target.value)}
                    >
                      {benefits.map(b => (
                        <option key={b.name} value={b.name}>
                          {b.name} — {b.cost} Pat
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.swapBox}>
                    <div className={styles.swapRow}>
                      <div>
                        <p className={styles.swapLabel}>Paying</p>
                        <div className={styles.swapAmount}>
                          <input
                            type="number"
                            min="0"
                            value={redeemAmount}
                            onChange={e => setRedeemAmount(e.target.value)}
                          />
                          <span>Pat</span>
                        </div>
                      </div>
                      <div className={styles.swapIcon}>⇅</div>
                      <div>
                        <p className={styles.swapLabel}>Receiving</p>
                        <p className={styles.swapResult}>{redeemBenefit}</p>
                      </div>
                    </div>
                    <p className={styles.hint}>No fee when redeeming for in-app benefits.</p>
                  </div>
                  <button className={styles.primaryAction} onClick={() => handleStub('Redeem flow')}>
                    Redeem
                  </button>
                </section>

                <section className={styles.card}>
                  <header className={styles.cardHeader}>
                    <div>
                      <p className={styles.cardEyebrow}>Send</p>
                      <h3 className={styles.cardTitle}>Tip another user</h3>
                    </div>
                    <div className={styles.chip}>1% fee on cash-out only</div>
                  </header>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Recipient username</label>
                    <input
                      type="text"
                      placeholder="@username"
                      value={sendUser}
                      onChange={e => setSendUser(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Amount</label>
                    <div className={styles.inputRow}>
                      <input
                        type="number"
                        min="1"
                        value={sendAmount}
                        onChange={e => setSendAmount(e.target.value)}
                        className={styles.input}
                      />
                      <span className={styles.inputSuffix}>Pat</span>
                    </div>
                  </div>
                  <button className={styles.primaryAction} onClick={() => handleStub('Send flow')}>
                    Send tip
                  </button>
                  <p className={styles.finePrint}>Transfers are instant. Only cash-out to stablecoin (future) would incur 1% fee.</p>
                </section>
              </div>
            </>
          ) : (
            <div className={styles.signInPrompt}>
              <p className={styles.promptText}>Sign in to see your Pat Coins balance and start earning!</p>
              <button className={styles.signInButton} onClick={() => router.push('/registration')}>
                Sign up or Sign in
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
