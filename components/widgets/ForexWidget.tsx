'use client';

import { useEffect, useState } from 'react';
import styles from './ForexWidget.module.css';

interface ExchangeRate {
  currency: string;
  symbol: string;
  rate: number | string; // Can be number or formatted string
  change: number | string; // Percentage change (can be number or formatted string)
}

interface ForexWidgetProps {
  isUSUser?: boolean; // Whether user is US-based
  localCurrency?: string; // User's local currency code (e.g., 'NGN', 'EUR')
  countryCode?: string; // User's country code
}

export default function ForexWidget({ isUSUser = false, localCurrency, countryCode }: ForexWidgetProps) {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');
  const [detectedCurrency, setDetectedCurrency] = useState<string>('USD');

  useEffect(() => {
    const fetchForexRates = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Determine base currency
        let base = 'USD';
        let currency = localCurrency;

        if (isUSUser) {
          base = 'USD';
          currency = 'USD';
        } else {
          // Detect currency from IP or use provided currency
          if (!currency) {
            try {
              const ipResponse = await fetch('https://ipapi.co/json/');
              if (ipResponse.ok) {
                const ipData = await ipResponse.json();
                currency = ipData.currency || 'USD';
                base = currency || 'USD';
              } else {
                // Fallback: use country code to determine currency
                currency = getCurrencyFromCountryCode(countryCode || 'US');
                base = currency || 'USD';
              }
            } catch (ipError) {
              currency = getCurrencyFromCountryCode(countryCode || 'US');
              base = currency || 'USD';
            }
          } else {
            base = currency || 'USD';
          }
        }

        setBaseCurrency(base || 'USD');
        setDetectedCurrency(currency || 'USD');

        // Define target currencies based on user location
        const targetCurrencies = isUSUser
          ? ['EUR', 'GBP', 'JPY', 'XAU', 'BTC'] // US users see rates against these
          : ['USD', 'EUR', 'GBP', 'JPY', 'XAU', 'BTC']; // Non-US users see rates against these

        // Fetch exchange rates
        // Using a free forex API (e.g., exchangerate-api.com or fixer.io)
        // Note: You'll need to add your API key to environment variables
        const apiKey = process.env.NEXT_PUBLIC_FOREX_API_KEY || '';
        
        if (!apiKey) {
          // Fallback: Use mock data for development
          const mockRates = targetCurrencies.map((curr) => ({
            currency: curr,
            symbol: getCurrencySymbol(curr),
            rate: getMockRate(base || 'USD', curr),
            change: parseFloat((Math.random() * 2 - 1).toFixed(2)), // Random change between -1% and 1%
          }));
          setRates(mockRates);
          setIsLoading(false);
          return;
        }

        // Fetch real rates from API
        // Example using exchangerate-api.com (free tier available)
        const ratesResponse = await fetch(
          `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`
        );

        if (!ratesResponse.ok) {
          throw new Error('Failed to fetch exchange rates');
        }

        const data = await ratesResponse.json();
        
        // Transform API response to our format
        const exchangeRates = targetCurrencies.map((curr) => {
          let rate = 1;
          if (curr === base) {
            rate = 1;
          } else if (curr === 'XAU') {
            // Gold price in base currency (would need separate API)
            rate = getMockRate(base, 'XAU');
          } else if (curr === 'BTC') {
            // Bitcoin price in base currency (would need separate API)
            rate = getMockRate(base, 'BTC');
          } else {
            rate = data.conversion_rates?.[curr] || 1;
          }

          return {
            currency: curr,
            symbol: getCurrencySymbol(curr),
            rate: parseFloat(rate.toFixed(4)),
            change: parseFloat((Math.random() * 2 - 1).toFixed(2)), // Would come from API in production
          };
        });

        setRates(exchangeRates);
      } catch (err) {
        console.error('Error fetching forex rates:', err);
        setError('Unable to load exchange rates');
        // Set fallback data
        const targetCurrencies = isUSUser
          ? ['EUR', 'GBP', 'JPY', 'XAU', 'BTC']
          : ['USD', 'EUR', 'GBP', 'JPY', 'XAU', 'BTC'];
        setRates(
          targetCurrencies.map((curr) => ({
            currency: curr,
            symbol: getCurrencySymbol(curr),
            rate: getMockRate(baseCurrency || 'USD', curr),
            change: 0.0,
          }))
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchForexRates();
  }, [isUSUser, localCurrency, countryCode]);

  const getCurrencySymbol = (code: string): string => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      NGN: '₦',
      XAU: 'Au',
      BTC: '₿',
    };
    return symbols[code] || code;
  };

  const getCurrencyFromCountryCode = (code: string): string => {
    const currencyMap: Record<string, string> = {
      US: 'USD',
      GB: 'GBP',
      EU: 'EUR',
      JP: 'JPY',
      NG: 'NGN',
      KE: 'KES',
      ZA: 'ZAR',
      CA: 'CAD',
      AU: 'AUD',
      DE: 'EUR',
      FR: 'EUR',
      IT: 'EUR',
      ES: 'EUR',
      NL: 'EUR',
    };
    return currencyMap[code] || 'USD';
  };

  const getMockRate = (base: string, target: string): number => {
    // Mock exchange rates for development
    const mockRates: Record<string, Record<string, number>> = {
      USD: { EUR: 0.92, GBP: 0.79, JPY: 150.0, XAU: 0.0005, BTC: 0.000015 },
      EUR: { USD: 1.09, GBP: 0.86, JPY: 163.0, XAU: 0.00054, BTC: 0.000016 },
      GBP: { USD: 1.27, EUR: 1.16, JPY: 190.0, XAU: 0.00063, BTC: 0.000019 },
      NGN: { USD: 0.00067, EUR: 0.00061, GBP: 0.00053, JPY: 0.10, XAU: 0.00000034, BTC: 0.00000001 },
    };
    return mockRates[base]?.[target] || 1;
  };

  if (isLoading) {
    return (
      <div className={styles.widget}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerBar}></div>
            <span className={styles.headerTitle}>Exchange Rates</span>
          </div>
        </div>
        <div className={styles.loading}>Loading exchange rates...</div>
      </div>
    );
  }

  if (error && rates.length === 0) {
    return (
      <div className={styles.widget}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerBar}></div>
            <span className={styles.headerTitle}>Exchange Rates</span>
          </div>
        </div>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerBar}></div>
          <span className={styles.headerTitle}>Exchange Rates</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.baseCurrency}>1 {baseCurrency}</span>
        </div>
      </div>

      <div className={styles.ratesList}>
        {rates.map((rate) => (
          <div key={rate.currency} className={styles.rateItem}>
            <div className={styles.rateLeft}>
              <span className={styles.rateSymbol}>{rate.symbol}</span>
              <span className={styles.rateCurrency}>{rate.currency}</span>
            </div>
            <div className={styles.rateRight}>
              <span className={styles.rateValue}>{rate.rate}</span>
              <span
                className={`${styles.rateChange} ${
                  (typeof rate.change === 'number' ? rate.change : parseFloat(rate.change)) >= 0
                    ? styles.positive
                    : styles.negative
                }`}
              >
                {(typeof rate.change === 'number' ? rate.change : parseFloat(rate.change)) >= 0
                  ? '+'
                  : ''}
                {rate.change}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
