import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Patreek – AI-Powered Personalized News Feeds',
  description:
    'Stay ahead with Patreek, the smart news app that delivers AI-curated, real-time news tailored to your interests. Get personalized insights, breaking stories, and trending updates without the clutter.',
  openGraph: {
    title: 'Patreek – AI-Powered Personalized News Feeds',
    description:
      'Stay ahead with Patreek, the smart news app that delivers AI-curated, real-time news tailored to your interests.',
    images: ['https://imgur.com/a/bUe41HI'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Patreek – AI-Powered Personalized News Feeds',
    description:
      'Stay ahead with Patreek, the smart news app that delivers AI-curated, real-time news tailored to your interests.',
    images: ['https://imgur.com/a/bUe41HI'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Varela&family=Oswald:wght@200;300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="shortcut icon"
          href="https://cdn.prod.website-files.com/675ca775325477a121669e3c/67ab9a17fce18100514ddc88_patreek-favicon.png"
        />
        <link
          rel="apple-touch-icon"
          href="https://cdn.prod.website-files.com/675ca775325477a121669e3c/67ab990473bace7594cd4617_patreek-logo.png"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

