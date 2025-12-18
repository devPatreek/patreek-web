'use client';

import tips from '@/data/tips.json';

export default function DailyTipCard() {
  const index = Math.floor(Date.now() / 86_400_000) % tips.length;
  const tip = tips[index];

  return (
    <div style={cardStyle}>
      <span style={labelStyle}>Daily Tip</span>
      <p style={tipStyle}>{tip}</p>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#fff7ed',
  border: '1px solid #fed7aa',
  borderRadius: '16px',
  padding: '16px',
  color: '#7c2d12',
};

const labelStyle: React.CSSProperties = {
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  fontSize: '11px',
  color: '#b45309',
};

const tipStyle: React.CSSProperties = {
  margin: '8px 0 0',
  fontSize: '14px',
  lineHeight: 1.5,
};
