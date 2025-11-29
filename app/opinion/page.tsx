'use client';

import { useState } from 'react';
import styles from './page.module.css';

type OpinionItem = {
  id: number;
  title: string;
  dek: string;
  author: string;
  ageLabel: string;
  image?: string;
  tag?: string;
};

const navTags = ['White House', 'Congress', 'Civil Rights', 'World', 'Science'];
const appNav = ['Coins', 'Store', 'Media', 'Community', 'Opinion'];

const opinions: OpinionItem[] = [
  {
    id: 1,
    title: 'Too many parents are prosecuted due to junk science. New Jersey finally admitted it.',
    dek: 'The New Jersey ruling underscores how thin empirical support is for much of the forensic evidence used in criminal cases.',
    author: 'John Pfaff',
    ageLabel: '4d ago',
    image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=600&q=80',
    tag: 'Justice',
  },
  {
    id: 2,
    title: 'There’s nothing subtle about the politics of “Wicked: For Good.”',
    dek: 'The similarities between our country and the fictional Oz are unmissable. But will movie-goers react to political messaging?',
    author: 'Jen Chaney',
    ageLabel: '7d ago',
    image: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=600&q=80',
    tag: 'Culture',
  },
  {
    id: 3,
    title: 'Let’s count the ways a reported Ukraine plan rewards Vladimir Putin.',
    dek: 'The proposal rewards Russian aggression — no real surprise given the history of leaning harder on Zelenskyy than Putin.',
    author: 'Nicholas Grossman',
    ageLabel: '7d ago',
    image: 'https://images.unsplash.com/photo-1521292270410-a8c0c9f6d37e?auto=format&fit=crop&w=600&q=80',
    tag: 'World',
  },
  {
    id: 4,
    title: 'One stat reveals how much of a “populist” agenda is funded by billionaires.',
    dek: 'A new report shows an astonishing trend in the way the ultra-wealthy are intervening in politics.',
    author: 'Zeeshan Aleem',
    ageLabel: '1w ago',
    image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=600&q=80',
    tag: 'Economy',
  },
  {
    id: 5,
    title: 'Why a “quiet, piggy” comment should be seen as a warning.',
    dek: 'The vicious and casual comment represents the normalization of misogyny in political culture — and is a potential threat to democracy.',
    author: 'Cynthia Miller-Idriss',
    ageLabel: '1w ago',
    image: 'https://images.unsplash.com/photo-1509099836639-18ba02e2e1ba?auto=format&fit=crop&w=600&q=80',
    tag: 'Culture',
  },
];

export default function OpinionPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className={styles.page}>
      <div className={styles.mobileNavWrap}>
        <button
          className={styles.mobileNavButton}
          type="button"
          aria-label="Open navigation"
          onClick={() => setDrawerOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
        {drawerOpen && (
          <div className={styles.drawer} role="dialog" aria-label="Navigation menu">
            <div className={styles.drawerHeader}>
              <span className={styles.drawerTitle}>Navigate</span>
              <button
                className={styles.closeButton}
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
              >
                ✕
              </button>
            </div>
            <div className={styles.drawerLinks}>
              {appNav.map(item => (
                <button key={item} className={styles.drawerLink} type="button">
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <header className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.kicker}>Perspectives from Patreek Pundits</p>
          <h1 className={styles.title}>Opinion</h1>
          <nav className={styles.nav} aria-label="Opinion sections">
            {navTags.map(tag => (
              <button key={tag} className={styles.navItem} type="button">
                {tag}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className={styles.feed}>
        {opinions.map(item => (
          <article key={item.id} className={styles.card}>
            <div className={styles.meta}>
              <span className={styles.timestamp}>{item.ageLabel}</span>
              {item.tag && <span className={styles.tag}>{item.tag}</span>}
            </div>
            <div className={styles.cardBody}>
              <div className={styles.textBlock}>
                <h2 className={styles.headline}>{item.title}</h2>
                <p className={styles.dek}>{item.dek}</p>
                <p className={styles.author}>{item.author}</p>
              </div>
              {item.image && (
                <div className={styles.imageWrapper}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.title} className={styles.image} />
                </div>
              )}
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}
