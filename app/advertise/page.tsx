'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import MainHeader from '@/components/MainHeader';
import { getUserProfile, UserProfile } from '@/lib/api';
import styles from './page.module.css';

type AdTier = {
  id: string;
  label: string;
  durationHours: number;
  priceCoins: number;
  description?: string;
};

const defaultTiers: AdTier[] = [
  {
    id: '1h',
    label: '1 hour',
    durationHours: 1,
    priceCoins: 1000,
    description: 'Morning blast to light up a trending slot.',
  },
  {
    id: '3h',
    label: '3 hours',
    durationHours: 3,
    priceCoins: 2600,
    description: 'Sustain attention for a full news cycle.',
  },
  {
    id: '24h',
    label: '24 hours',
    durationHours: 24,
    priceCoins: 9000,
    description: 'Command a whole-day premium placement.',
  },
];

type RequestStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function AdvertisePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tiers, setTiers] = useState<AdTier[]>(defaultTiers);
  const [selectedDuration, setSelectedDuration] = useState<string>(defaultTiers[0].id);
  const [targetUrl, setTargetUrl] = useState('https://');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ratioError, setRatioError] = useState<string | null>(null);
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [queuedFor, setQueuedFor] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getUserProfile().then((data) => {
      if (active) setProfile(data);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    let cancelled = false;

    async function loadPricing() {
      try {
        const response = await fetch('/api/v1/ads/pricing', { cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json();
        const rawTiers: any[] = Array.isArray(payload.tiers)
          ? payload.tiers
          : Array.isArray(payload)
            ? payload
            : payload?.tiers ?? [];
        if (!rawTiers.length) return;

        const mapped = rawTiers.map((tier) => ({
          id: `tier-${tier.durationHours}-${tier.priceCoins}`,
          label: tier.label || `${tier.durationHours} hour${tier.durationHours > 1 ? 's' : ''}`,
          durationHours: tier.durationHours,
          priceCoins: tier.priceCoins,
          description: tier.description,
        }));

        if (cancelled) return;

        setTiers(mapped);
        setSelectedDuration((current) =>
          mapped.some((item) => item.id === current) ? current : mapped[0].id
        );
      } catch (error) {
        console.warn('[Advertise] Failed to load pricing', error);
      }
    }

    loadPricing();

    return () => {
      cancelled = true;
    };
  }, []);

  const option = useMemo(
    () => tiers.find((item) => item.id === selectedDuration) ?? tiers[0],
    [selectedDuration, tiers]
  );

  const availableCoins = profile?.coins ?? 0;
  const shortfall = option ? Math.max(0, option.priceCoins - availableCoins) : 0;
  const canAfford = Boolean(option && shortfall === 0);
  const disabled =
    status === 'submitting' || !imageFile || !targetUrl || !option || !canAfford || Boolean(ratioError);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      setRatioError(null);
      return;
    }

    const preview = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const ratio = img.width / img.height;
      if (Math.abs(ratio - 4) > 0.4) {
        setRatioError('Please upload a 4:1 banner (wide and short).');
        setImageFile(null);
        setImagePreview(null);
        URL.revokeObjectURL(preview);
      } else {
        setRatioError(null);
        setImageFile(file);
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(preview);
      }
    };

    img.onerror = () => {
      setRatioError('Unable to read the file.');
      URL.revokeObjectURL(preview);
    };

    img.src = preview;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!option || !imageFile) return;
    if (!canAfford) {
      setStatus('error');
      setStatusMessage('You need more coins to book this slot.');
      return;
    }

    setStatus('submitting');
    setStatusMessage('');
    setQueuedFor(null);

    try {
      const formData = new FormData();
      formData.append('durationHours', option.durationHours.toString());
      formData.append('targetUrl', targetUrl);
      formData.append('costCoins', option.priceCoins.toString());
      formData.append('image', imageFile);

      const response = await fetch('/api/v1/ads/book', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Unable to queue the slot.');
      }

      const payload = await response.json().catch(() => ({}));
      const startTime = payload.startTime || payload.start_at || payload.queueTime;
      const humanTime = startTime ? new Date(startTime).toLocaleString() : 'shortly';

      setStatus('success');
      setQueuedFor(humanTime);
      setStatusMessage('Your ad is scheduled 🎉');
    } catch (error) {
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Submit failed.');
    }
  };

  return (
    <div className={styles.page}>
      <MainHeader hasSession={Boolean(profile)} />
      <section className={styles.hero}>
        <p className={styles.tag}>Advertising</p>
        <h1 className={styles.title}>Book a premium news slot</h1>
        <p className={styles.subtitle}>
          Spend your Pat Coins for curated exposure. Slots book in real time and queue automatically.
        </p>
      </section>

      <main className={styles.layout}>
        <div className={styles.profileSummary}>
          <p className={styles.summaryLabel}>Your Wallet</p>
          <p className={styles.coins}>{availableCoins.toLocaleString()} Pats</p>
          <p className={styles.summaryCopy}>Coins update instantly when purchases or boosts occur.</p>
          <Link href="/coins" className={styles.ctaLink}>
            Get more coins
          </Link>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.grid}>
            {tiers.map((tier) => {
              const isActive = option ? tier.id === option.id : false;
              return (
                <button
                  type="button"
                  key={tier.id}
                  onClick={() => setSelectedDuration(tier.id)}
                  className={`${styles.durationCard} ${isActive ? styles.active : ''}`}
                >
                  <p className={styles.durationLabel}>{tier.label}</p>
                  <p className={styles.durationCost}>{tier.priceCoins.toLocaleString()} Pats</p>
                  {tier.description && <p className={styles.durationCopy}>{tier.description}</p>}
                </button>
              );
            })}
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Target URL</span>
            <input
              type="url"
              placeholder="https://yourbrand.com"
              value={targetUrl}
              onChange={(event) => setTargetUrl(event.target.value)}
              className={styles.input}
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Upload banner (4:1 ratio)</span>
            <div className={styles.upload}>
              <input
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={handleImageChange}
                required
              />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className={styles.preview} />
              ) : (
                <p className={styles.uploadHint}>Select an image (approx. 4:1 ratio)</p>
              )}
            </div>
            {ratioError && <span className={styles.error}>{ratioError}</span>}
          </label>

          <div className={styles.statusRow}>
            <span className={styles.label}>Slot cost</span>
            <span className={styles.cost}>{(option?.priceCoins ?? 0).toLocaleString()} Pats</span>
          </div>

          <button type="submit" className={styles.submit} disabled={disabled}>
            {status === 'submitting' ? 'Queuing slot…' : 'Queue this slot'}
          </button>

          {!canAfford && (
            <p className={styles.warning}>
              You need {shortfall.toLocaleString()} more coins. <Link href="/coins">Buy coins</Link>.
            </p>
          )}

          {statusMessage && (
            <p className={`${styles.statusMessage} ${status === 'error' ? styles.error : styles.success}`}>
              {statusMessage}
            </p>
          )}

          {status === 'success' && queuedFor && (
            <p className={styles.successCopy}>
              Your creative is queued for <strong>{queuedFor}</strong>.
            </p>
          )}
        </form>
      </main>
    </div>
  );
}
