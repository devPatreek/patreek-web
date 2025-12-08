'use client';

import styles from './PricingCard.module.css';

export interface PricingCardProps {
  title: string;
  coins: number;
  priceLabel: string;
  description?: string;
  isPopular?: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export default function PricingCard({
  title,
  coins,
  priceLabel,
  description,
  isPopular = false,
  onSelect,
  disabled = false,
}: PricingCardProps) {
  return (
    <article className={`${styles.card} ${isPopular ? styles.popular : ''}`}>
      {isPopular && <span className={styles.ribbon}>Most Popular</span>}
      <header className={styles.header}>
        <p className={styles.title}>{title}</p>
        <p className={styles.coins}>{coins.toLocaleString()} Coins</p>
      </header>
      <p className={styles.price}>{priceLabel}</p>
      {description && <p className={styles.description}>{description}</p>}
      <button
        type="button"
        className={`${styles.action} ${disabled ? styles.disabled : ''}`}
        onClick={onSelect}
        disabled={disabled}
      >
        {disabled ? 'Processing…' : 'Buy now'}
      </button>
    </article>
  );
}
