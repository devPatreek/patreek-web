"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthWallModal from '@/components/auth/AuthWallModal';
import Footer from '@/components/Footer';
import MainHeader from '@/components/MainHeader';
import ChatWindow from '@/components/nest/ChatWindow';
import { checkSessionStatus, getCommunityLeaderboard, LeaderboardEntry } from '@/lib/api';
import styles from './page.module.css';

const podiumLabels = ['Gold', 'Silver', 'Bronze'];
const podiumColors = ['#facc15', '#cbd5f5', '#f97316'];
const COMMUNITY_CHANNEL_ID = 'town-square-channel';

export default function CommunityPage() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [loadingRanks, setLoadingRanks] = useState(true);
  const [authWallOpen, setAuthWallOpen] = useState(false);
  const [sessionUsername, setSessionUsername] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await checkSessionStatus();
        setHasSession(session.authenticated);
        setSessionUserId(session.userId ?? null);
        setSessionUsername(session.username ?? null);
      } catch {
        setHasSession(false);
        setSessionUserId(null);
      }
    };
    loadSession();
  }, []);

  useEffect(() => {
    const loadRankings = async () => {
      try {
        setLoadingRanks(true);
        const data = await getCommunityLeaderboard('pats', 20);
        setRankings(data);
      } catch (error) {
        console.error('Failed to load community leaderboard', error);
        setRankings([]);
      } finally {
        setLoadingRanks(false);
      }
    };

    loadRankings();
  }, []);

  useEffect(() => {
    setAuthWallOpen(!hasSession);
  }, [hasSession]);

  const podiumEntries = useMemo(() => rankings.slice(0, 3), [rankings]);
  const listEntries = useMemo(() => rankings.slice(3, 20), [rankings]);

  const handleUserNavigate = (username?: string) => {
    if (!username) return;
    router.push(`/u/${username}`);
  };

  if (!hasSession) {
    // still show page but keep modal open
  }

  return (
    <div className={styles.page}>
      <MainHeader active="community" hasSession={hasSession} />

      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Patreek Arena</p>
            <h1 className={styles.title}>Community Standings</h1>
            <p className={styles.subtitle}>
              A live scoreboard of the top Patreek contributors. Tap any user to inspect their story.
            </p>
          </div>
          <div className={styles.heroBadge}>
            <span className={styles.dot} />
            Real-time ranks
          </div>
        </section>

        <div className={styles.townGrid}>
          <div className={styles.skyscraper}>Vertical Ad Space</div>

          <div className={styles.arenaColumn}>
            <div className={styles.sponsorBanner}>
              <div className={styles.bannerText}>
                <span className={styles.bannerLabel}>Top Sponsor</span>
                <p className={styles.bannerHeadline}>Boost your community drop with Spotlight Ads.</p>
              </div>
              <div className={styles.bannerCta}>Reserve Slot</div>
            </div>

            <section className={styles.arena}>
              <div className={styles.podium}>
                {loadingRanks
                  ? Array.from({ length: 3 }).map((_, idx) => (
                      <div key={`placeholder-${idx}`} className={styles.podiumCard}>
                        <div className={styles.podiumRank}>#{idx + 1}</div>
                        <div className={styles.podiumAvatar} />
                        <div className={styles.podiumName}>Loading…</div>
                        <div className={styles.podiumMeta}>Loading XP</div>
                      </div>
                    ))
                  : podiumEntries.map((entry, index) => (
                      <button
                        key={`${entry.username}-${entry.rank}`}
                        className={styles.podiumCard}
                        style={{ borderColor: podiumColors[index] }}
                        onClick={() => handleUserNavigate(entry.username)}
                        type="button"
                      >
                        <span className={styles.podiumRank}>#{entry.rank}</span>
                        <div
                          className={styles.podiumAvatar}
                          aria-hidden="true"
                          style={{
                            background: index === 0 ? 'linear-gradient(135deg, #fbbf24, #f97316)' : '#94a3b8',
                          }}
                        >
                          {entry.displayName?.charAt(0) || entry.username?.charAt(0) || 'P'}
                        </div>
                        <div className={styles.podiumDetails}>
                          <p className={styles.podiumName}>{entry.displayName || entry.username}</p>
                          <p className={styles.podiumMeta}>{entry.total.toLocaleString()} XP</p>
                        </div>
                        <span className={styles.podiumLabel}>{podiumLabels[index]}</span>
                      </button>
                    ))}
              </div>

              <div className={styles.tableSection}>
                <div className={styles.tableHeader}>
                  <h2>Ranks 4–20</h2>
                  <p>Tap a row to visit a creator’s profile.</p>
                </div>
                <div className={styles.tableBody}>
                  {loadingRanks ? (
                    <p className={styles.muted}>Loading leaderboard…</p>
                  ) : (
                    listEntries.map(entry => (
                      <button
                        key={`${entry.username}-${entry.rank}`}
                        className={styles.tableRow}
                        type="button"
                        onClick={() => handleUserNavigate(entry.username)}
                      >
                        <span className={styles.rowRank}>#{entry.rank}</span>
                        <div className={styles.rowUser}>
                          <div className={styles.rowAvatar}>{(entry.displayName || entry.username || '?').slice(0, 1)}</div>
                          <div>
                            <p className={styles.rowName}>{entry.displayName || entry.username}</p>
                            <p className={styles.rowHandle}>@{entry.username}</p>
                          </div>
                        </div>
                        <span className={styles.rowXp}>{entry.total.toLocaleString()} XP</span>
                      </button>
                    ))
                  )}
                  {!loadingRanks && listEntries.length === 0 && (
                    <p className={styles.muted}>More Pat community members are coming soon.</p>
                  )}
                </div>
              </div>
            </section>

            <div className={styles.squareBannerRow}>
              <div className={styles.squareBanner}>
                <span>Creator Toolkit</span>
                <strong>Reserve a featured block</strong>
              </div>
              <div className={styles.squareBanner}>
                <span>Town Hall</span>
                <strong>Host a space with Pat Coins</strong>
              </div>
            </div>
          </div>

          <div className={styles.chatColumn}>
            <div className={styles.chatShell}>
              {hasSession ? (
                <ChatWindow
                  channelId={COMMUNITY_CHANNEL_ID}
                  currentUserId={sessionUserId ?? undefined}
                  currentUsername={sessionUsername}
                  title="Town Square Chat"
                  subtitle="Live firehose from Pat citizens"
                  composerPlaceholder="Drop your take…"
                />
              ) : (
                <div className={styles.chatLocked}>
                  <p>Sign in to join the Town Square chat.</p>
                  <button type="button" onClick={() => router.push('/registration')}>
                    Join Patreek
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <AuthWallModal
        isOpen={authWallOpen}
        triggerAction="view the community leaderboard"
        disableClose
        onClose={() => router.push('/')}
      />
    </div>
  );
}
