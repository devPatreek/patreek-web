'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import styles from './Nest.module.css';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  body: string;
  createdAt: string;
  pending?: boolean;
}

interface ChatWindowProps {
  otherUserId?: string;
  otherUserName?: string;
  otherUserAvatar?: string;
  currentUserId?: string | number;
  onClose?: () => void;
}

const normalizeMessage = (item: any): ChatMessage => {
  const senderId = (item.senderId ?? item.userId ?? item.senderUserId ?? item.senderUsername ?? 'unknown').toString?.() ?? 'unknown';
  const createdAt = item.createdAt ?? item.timestamp ?? new Date().toISOString();
  const body = item.body ?? item.text ?? item.message ?? '';

  return {
    id: item.id?.toString?.() ?? `${senderId}-${createdAt}`,
    senderId,
    senderName: item.senderName ?? item.displayName ?? item.senderUsername,
    body,
    createdAt,
  };
};

const messagesFetcher = async (url: string) => {
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Unable to load chat history');
  }

  const payload = await response.json();
  const items = payload?.content ?? payload?.data ?? payload ?? [];

  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((entry) => normalizeMessage(entry));
};

const formatTime = (value?: string) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

export default function ChatWindow({
  otherUserId,
  otherUserName,
  otherUserAvatar,
  currentUserId,
  onClose,
}: ChatWindowProps) {
  const normalizedUserId = currentUserId?.toString();
  const endpoint = otherUserId ? `/api/v1/nest/messages/${encodeURIComponent(otherUserId)}` : null;
  const { data, error, isValidating, mutate } = useSWR<ChatMessage[]>(
    endpoint,
    endpoint ? messagesFetcher : null,
    {
      refreshInterval: 3000,
      revalidateOnFocus: false,
    }
  );

  const messages = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [data]);

  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const handleSend = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) {
      event.preventDefault();
    }
    if (!endpoint || !draft.trim() || isSending) {
      return;
    }

    setIsSending(true);
    const trimmed = draft.trim();
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}-${Math.random()}`,
      senderId: normalizedUserId ?? 'me',
      senderName: 'You',
      body: trimmed,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    mutate((current = []) => [...current, optimisticMessage], false);
    setDraft('');
    setSendError('');

    try {
      const response = await fetch('/api/v1/nest/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ recipientId: otherUserId, body: trimmed }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      await mutate();
    } catch (sendErr) {
      mutate((current = []) => current.filter((msg) => msg.id !== optimisticMessage.id), false);
      setSendError('Unable to send message. Please try again.');
      console.error(sendErr);
    } finally {
      setIsSending(false);
    }
  };

  const isChatReady = Boolean(endpoint);

  return (
    <div className={styles.chatArea}>
      <div className={styles.chatHeader}>
        {onClose && (
          <button type="button" className={styles.mobileBack} onClick={onClose} aria-label="Back to conversations">
            ←
          </button>
        )}
        <div className={styles.chatHeaderInfo}>
          <span className={styles.chatUserName}>{otherUserName || 'Choose a conversation'}</span>
          <span className={styles.chatSubtitle}>{otherUserAvatar ? 'Live chat' : 'Message nest user'}</span>
        </div>
      </div>

      {!isChatReady ? (
        <div className={styles.chatPlaceholder}>Select a conversation to open the chat.</div>
      ) : error ? (
        <div className={styles.chatPlaceholder}>Unable to load chat history.</div>
      ) : (
        <div ref={scrollRef} className={styles.chatMessages}>
          {messages.map((message) => {
            const isMine = Boolean(normalizedUserId && message.senderId === normalizedUserId);
            return (
              <div key={message.id} className={styles.chatMessageRow}>
                <div
                  className={`${styles.chatBubble} ${isMine ? styles.chatBubbleMine : ''} ${message.pending ? styles.chatBubblePending : ''}`}
                >
                  {message.body}
                </div>
                <span className={`${styles.chatTimestamp} ${isMine ? styles.chatTimestampMine : ''}`}>
                  {formatTime(message.createdAt)} {message.pending ? '• Sending…' : ''}
                </span>
              </div>
            );
          })}
          {isValidating && !messages.length && <p className={styles.placeholder}>Loading messages…</p>}
        </div>
      )}

      {isChatReady && (
        <div className={styles.chatFooter}>
          {sendError && <p className={styles.errorMessage}>{sendError}</p>}
          <form className={styles.chatForm} onSubmit={handleSend}>
            <textarea
              className={styles.chatInput}
              placeholder="Write a message…"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={2}
            />
            <button
              type="submit"
              className={`${styles.sendButton} ${draft.trim() && !isSending ? styles.sendButtonActive : ''}`}
              disabled={isSending || !draft.trim()}
            >
              {isSending ? 'Sending…' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
