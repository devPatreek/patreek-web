'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';
import Footer from '@/components/Footer';
import MainHeader from '@/components/MainHeader';
import {
  ChatMessage,
  LeaderboardEntry,
  LeaderboardMetric,
  checkSessionStatus,
  getCommunityChatHistory,
  getCommunityLeaderboard,
  sendCommunityChatMessage,
} from '@/lib/api';

type MetricConfig = {
  key: LeaderboardMetric;
  label: string;
  accent: string;
  helper: string;
};

const metrics: MetricConfig[] = [
  { key: 'shares', label: 'Top Sharers', accent: 'var(--accent-blue)', helper: 'Most article shares' },
  { key: 'comments', label: 'Top Commenters', accent: 'var(--accent-orange)', helper: 'Most comments' },
  { key: 'pats', label: 'Top Patters', accent: 'var(--accent-teal)', helper: 'Most pats given' },
];

export default function CommunityPage() {
  const [hasSession, setHasSession] = useState(false);
  const [leaderboards, setLeaderboards] = useState<Record<LeaderboardMetric, LeaderboardEntry[]>>({
    shares: [],
    comments: [],
    pats: [],
    coins: [],
  });
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // Session + data load
  useEffect(() => {
    const load = async () => {
      try {
        const session = await checkSessionStatus();
        setHasSession(session.authenticated);
      } catch {
        setHasSession(false);
      }

      try {
        setLoadingBoards(true);
        const results = await Promise.all(metrics.map(m => getCommunityLeaderboard(m.key, 10)));
        const next: Record<LeaderboardMetric, LeaderboardEntry[]> = {
          shares: results[0],
          comments: results[1],
          pats: results[2],
          coins: [],
        };
        setLeaderboards(next);
      } finally {
        setLoadingBoards(false);
      }

      try {
        const history = await getCommunityChatHistory('global');
        setChatMessages(history);
      } catch {
        // fallback handled in api util
      }
    };

    load();
  }, []);

  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text) return;

    const parsedCommand = parseCommand(text);

    setSending(true);
    setChatError(null);
    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      username: 'you',
      displayName: 'You',
      text,
      createdAt: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, optimistic]);
    setChatInput('');
    setCooldown(30);
    const ok = await sendCommunityChatMessage('global', text, parsedCommand);
    setSending(false);
    if (!ok) {
      setChatError('Could not send message. Please try again.');
      // remove optimistic if desired? keep for UX
    }
  };

  const desktopMessages = useMemo(() => chatMessages.slice(-50), [chatMessages]);

  return (
    <div className={styles.page}>
      <MainHeader active="community" hasSession={hasSession} />

      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Community</p>
            <h1 className={styles.title}>Patreek Pulse</h1>
            <p className={styles.subtitle}>
              See who’s leading the conversation and connect in the live lounge. Leaderboards are public; chat is for
              signed-in members on desktop.
            </p>
          </div>
          <div className={styles.heroBadge}>
            <span className={styles.dot} />
            Live pulse
          </div>
        </section>

        <section className={styles.leaderboards}>
          <div className={styles.sectionHeader}>
            <h2>Leaderboards</h2>
            <p>Updated frequently — totals reflect the top 10 contributors.</p>
          </div>
          <div className={styles.boardGrid}>
            {metrics.map(cfg => (
              <LeaderboardCard
                key={cfg.key}
                label={cfg.label}
                helper={cfg.helper}
                accent={cfg.accent}
                loading={loadingBoards}
                entries={leaderboards[cfg.key]}
              />
            ))}
          </div>
        </section>

        <section className={styles.chatSection}>
          <div className={styles.sectionHeader}>
            <h2>Community Lounge</h2>
            <p>Desktop-only real-time chat. Mobile users can view leaderboards.</p>
          </div>
          <div className={styles.chatWrapper}>
            <div className={styles.chatPanel}>
              <div className={styles.chatMessages}>
                {desktopMessages.length === 0 ? (
                  <p className={styles.muted}>No messages yet. Say hello!</p>
                ) : (
                  desktopMessages.map(msg => (
                    <article key={msg.id} className={styles.message}>
                      <div className={styles.messageMeta}>
                        <span className={styles.messageUser}>{msg.displayName || msg.username}</span>
                        <span className={styles.messageTime}>{formatRelativeTime(msg.createdAt)}</span>
                      </div>
                      <p className={styles.messageText}>{msg.text}</p>
                    </article>
                  ))
                )}
              </div>
              <div className={styles.chatInputRow}>
                <input
                  className={styles.chatInput}
                  placeholder={hasSession ? 'Share something with the community...' : 'Sign in to chat'}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  disabled={!hasSession || sending}
                />
                <button
                  className={styles.sendButton}
                  onClick={handleSend}
                  disabled={!hasSession || sending || !chatInput.trim() || cooldown > 0}
                >
                  {sending ? 'Sending…' : cooldown > 0 ? `Wait ${cooldown}s` : 'Send'}
                </button>
              </div>
              {chatError && <p className={styles.error}>{chatError}</p>}
              {!hasSession && <p className={styles.muted}>Chat is available for signed-in users on desktop.</p>}
              {cooldown > 0 && <p className={styles.cooldown}>You can send again in {cooldown}s.</p>}
            </div>
            <div className={styles.chatEmptyNote}>
              <div className={styles.chatCard}>
                <h3>Desktop lounge</h3>
                <p>Open Patreek.com on desktop for the full chat experience. Leaderboards remain available everywhere.</p>
                <div className={styles.commands}>
                  <p className={styles.commandsTitle}>Commands</p>
                  <ul>
                    <li>
                      <code>/tip {'{username} {amount}'}</code> — send Pat Coins to a user. Min 0.05 Pat.
                    </li>
                    <li>
                      Example: <code>/tip alex 1.5</code>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

type LeaderboardCardProps = {
  label: string;
  helper: string;
  accent: string;
  entries: LeaderboardEntry[];
  loading?: boolean;
};

function LeaderboardCard({ label, helper, accent, entries, loading }: LeaderboardCardProps) {
  return (
    <div className={styles.boardCard} style={{ borderTopColor: accent }}>
      <header className={styles.boardHeader}>
        <div>
          <p className={styles.boardEyebrow}>{label}</p>
          <p className={styles.boardHelper}>{helper}</p>
        </div>
      </header>
      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : (
        <ul className={styles.boardList}>
          {entries.map(entry => (
            <li key={`${entry.username}-${entry.rank}`} className={styles.boardItem}>
              <div className={styles.rank}>{entry.rank}</div>
              <div className={styles.userBlock}>
                <div className={styles.avatar}>{(entry.displayName || entry.username || '?').slice(0, 1)}</div>
                <div>
                  <p className={styles.name}>{entry.displayName || entry.username}</p>
                  <p className={styles.handle}>@{entry.username}</p>
                </div>
              </div>
              <div className={styles.score}>{entry.total.toLocaleString()}</div>
            </li>
          ))}
          {entries.length === 0 && <li className={styles.muted}>No data yet.</li>}
        </ul>
      )}
    </div>
  );
}

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function parseCommand(text: string): { name: string; args: string[] } | undefined {
  if (!text.startsWith('/')) return undefined;
  const parts = text.trim().split(/\s+/);
  const command = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  if (command === '/tip' && args.length >= 2) {
    return { name: 'tip', args };
  }
  return undefined;
}
