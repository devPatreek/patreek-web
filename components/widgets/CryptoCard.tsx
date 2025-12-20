'use client';

import useSWR from 'swr';

interface CryptoResponse {
  bitcoin?: {
    usd: number;
    usd_24h_change: number;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch crypto prices');
  return res.json();
});

export default function CryptoCard() {
  const { data, error } = useSWR<CryptoResponse>(
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: false,
      dedupingInterval: 60 * 60 * 1000,
      revalidateIfStale: false,
    }
  );

  const price = data?.bitcoin?.usd;
  const change = data?.bitcoin?.usd_24h_change;
  const changeSign = change !== undefined ? (change >= 0 ? '+' : '') : '';

  return (
    <div id="crypto-widget" style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={labelStyle}>Bitcoin</span>
        <span style={miniStyle}>1 BTC</span>
      </div>
      {error && <p style={errorStyle}>Price feed offline.</p>}
      {!error && (
        <>
          <p style={valueStyle}>
            {price !== undefined ? `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '…'}
          </p>
          <p style={{ ...changeStyle, color: change && change < 0 ? '#f87171' : '#4ade80' }}>
            {change !== undefined ? `${changeSign}${change.toFixed(2)}% (24h)` : 'Updating…'}
          </p>
        </>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#111827',
  color: '#f8fafc',
  padding: '16px',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const labelStyle: React.CSSProperties = {
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  fontSize: '11px',
  color: '#94a3b8',
};

const miniStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#cbd5f5',
};

const valueStyle: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 700,
  margin: '4px 0',
};

const changeStyle: React.CSSProperties = {
  fontSize: '14px',
  margin: 0,
};

const errorStyle: React.CSSProperties = {
  color: '#f87171',
  fontSize: '13px',
  margin: 0,
};
