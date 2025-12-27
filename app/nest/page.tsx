'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainHeader from '@/components/MainHeader';
import Footer from '@/components/Footer';
import ConversationList, { ConversationSummary } from '@/components/nest/ConversationList';
import ChatWindow from '@/components/nest/ChatWindow';
import styles from '@/components/nest/Nest.module.css';
import { checkSessionStatus, getUserProfile, UserProfile } from '@/lib/api';

export default function NestPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [activeConversation, setActiveConversation] = useState<ConversationSummary | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const session = await checkSessionStatus();
        if (!session.authenticated) {
          router.replace('/registration');
          return;
        }
        if (!isMounted) return;

        setIsAuthenticated(true);
        const profile = await getUserProfile();
        if (isMounted) {
          setCurrentUser(profile);
        }
      } catch (error) {
        console.error('[Nest] session check failed', error);
        router.replace('/registration');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    init();

    if (typeof window !== 'undefined') {
      setDarkMode(localStorage.getItem('darkMode') === 'true');
    }

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 980);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setShowMobileChat(false);
    }
  }, [isMobile]);

  const handleSelectConversation = useCallback(
    (conversation: ConversationSummary, options?: { openChat?: boolean }) => {
      setActiveConversation(conversation);
      const shouldOpen = options?.openChat !== false;
      if (isMobile && shouldOpen) {
        setShowMobileChat(true);
      }
    },
    [isMobile]
  );

  const handleCloseChat = useCallback(() => {
    if (isMobile) {
      setShowMobileChat(false);
    }
  }, [isMobile]);

  const userId = useMemo(() => currentUser?.id?.toString?.() ?? '', [currentUser]);

  if (isLoading) {
    return (
      <div className={`${styles.page} ${darkMode ? styles.dark : ''}`}>
        <MainHeader hasSession />
        <main className={styles.main}>
          <div className={styles.intro}>
            <h1 className={styles.introTitle}>Message Nest</h1>
            <p className={styles.introSubtitle}>Loading conversations…</p>
          </div>
          <div className={styles.chatPlaceholder}>Hang tight while we connect you to the nest.</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`${styles.page} ${darkMode ? styles.dark : ''}`}>
      <MainHeader hasSession />
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.introTitle}>Message Nest</h1>
          <p className={styles.introSubtitle}>A Twitter DM inspired experience for your stack.</p>
        </div>
        <section className={styles.layout}>
          <div className={`${styles.sidebar} ${isMobile && showMobileChat ? styles.mobileHidden : ''}`}>
            <ConversationList activeUserId={activeConversation?.otherUserId} onSelectUser={handleSelectConversation} />
          </div>
          <div className={`${styles.chatColumn} ${isMobile && !showMobileChat ? styles.mobileHidden : ''}`}>
            <ChatWindow
              otherUserId={activeConversation?.otherUserId}
              otherUserName={activeConversation?.otherUserName}
              otherUserAvatar={activeConversation?.otherUserAvatar}
              currentUserId={userId}
              currentUsername={currentUser?.username ?? currentUser?.name ?? null}
              onClose={isMobile ? handleCloseChat : undefined}
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
