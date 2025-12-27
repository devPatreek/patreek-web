'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from '@/lib/api';
import styles from './Nest.module.css';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

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
  currentUsername?: string | null;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  composerPlaceholder?: string;
  channelId?: string;
}

type DisplayMessage = {
  id: string | number;
  content: string;
  senderUsername: string;
  timestamp: string;
  pending?: boolean;
  isMine?: boolean;
};

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
  currentUsername,
  onClose,
  title,
  subtitle,
  composerPlaceholder,
  channelId,
}: ChatWindowProps) {
  const normalizedUserId = currentUserId?.toString();
  const endpoint = otherUserId ? `${API_BASE_URL}/api/v1/nest/messages/${encodeURIComponent(otherUserId)}` : null;
  const { data, error, isValidating, mutate } = useSWR<ChatMessage[]>(
    endpoint,
    endpoint ? messagesFetcher : null,
    {
      refreshInterval: 3000,
      revalidateOnFocus: false,
    }
  );

  const [channelMessages, setChannelMessages] = useState<DisplayMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stompClientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const isChannelMode = Boolean(channelId);
  const activeChannel = channelId || 'town-square';

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [channelMessages.length, data?.length]);

  useEffect(() => {
    if (!isChannelMode) return;
    let cancelled = false;
    const loadHistory = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/chat/history?channelId=${encodeURIComponent(activeChannel)}`,
          { credentials: 'include' }
        );
        if (!response.ok) return;
        const history = await response.json();
        if (!cancelled) {
          setChannelMessages(
            history.map((msg: any) => ({
              id: msg.id,
              content: msg.content,
              senderUsername: msg.senderUsername,
              timestamp: msg.timestamp,
            }))
          );
        }
      } catch (err) {
        console.warn('[Chat] Failed to load history', err);
      }
    };
    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [isChannelMode, activeChannel]);

  useEffect(() => {
    if (!isChannelMode) {
      setChannelMessages([]);
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
      return;
    }

    const socketFactory = () => new SockJS(`${API_BASE_URL}/ws-chat`);
    const client = new Client({
      webSocketFactory: socketFactory,
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        client.subscribe(`/topic/${activeChannel}`, (frame) => {
          try {
            const payload = JSON.parse(frame.body);
            setChannelMessages((prev) => [
              ...prev,
              {
                id: payload.id,
                content: payload.content,
                senderUsername: payload.senderUsername,
                timestamp: payload.timestamp,
              },
            ]);
          } catch (err) {
            console.warn('[Chat] Failed to parse message', err);
          }
        });
      },
      onDisconnect: () => setIsConnected(false),
      onStompError: () => setIsConnected(false),
    });

    stompClientRef.current = client;
    client.activate();

    return () => {
      setIsConnected(false);
      client.deactivate();
      stompClientRef.current = null;
    };
  }, [isChannelMode, activeChannel]);

  const dmMessages = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [data]);

  const normalizedDmMessages = useMemo<DisplayMessage[]>(() => {
    if (isChannelMode) return [];
    return dmMessages.map((message) => ({
      id: message.id,
      content: message.body,
      senderUsername:
        message.senderId === normalizedUserId ? currentUsername || 'You' : otherUserName || 'Member',
      timestamp: message.createdAt,
      pending: message.pending,
      isMine: message.senderId === normalizedUserId,
    }));
  }, [dmMessages, normalizedUserId, otherUserName, currentUsername, isChannelMode]);

  const displayMessages = isChannelMode ? channelMessages : normalizedDmMessages;

  const handleSend = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) {
      event.preventDefault();
    }
    if (!draft.trim() || isSending) {
      return;
    }

    if (isChannelMode) {
      if (!isConnected || !stompClientRef.current) {
        setSendError('Chat is reconnecting. Hold on…');
        return;
      }
      const payload = {
        channelId: activeChannel,
        content: draft.trim(),
        senderUsername: currentUsername || 'Guest',
      };
      setIsSending(true);
      setSendError('');
      setDraft('');
      setShowEmojiPicker(false);
      try {
        stompClientRef.current.publish({
          destination: '/app/chat.sendMessage',
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error('[Chat] Failed to publish message', err);
        setSendError('Unable to send message right now.');
      } finally {
        setIsSending(false);
      }
      return;
    }

    if (!endpoint) {
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
      const response = await fetch(`${API_BASE_URL}/api/v1/nest/message`, {
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

  const isChatReady = isChannelMode ? true : Boolean(endpoint);
  const chatTitle = title || otherUserName || (isChannelMode ? 'Town Square' : 'Choose a conversation');
  const chatSubtitle =
    subtitle || (isChannelMode ? 'Global chat' : otherUserAvatar ? 'Live chat' : 'Message nest user');

  const formattedMessages = displayMessages;

  return (
    <div className={styles.chatArea}>
      <div className={styles.chatHeader}>
        {onClose && (
          <button type="button" className={styles.mobileBack} onClick={onClose} aria-label="Back to conversations">
            ←
          </button>
        )}
        <div className={styles.chatHeaderInfo}>
          <span className={styles.chatUserName}>{chatTitle}</span>
          <span className={styles.chatSubtitle}>{chatSubtitle}</span>
        </div>
      </div>

      {!isChatReady ? (
        <div className={styles.chatPlaceholder}>Select a conversation to open the chat.</div>
      ) : !isChannelMode && error ? (
        <div className={styles.chatPlaceholder}>Unable to load chat history.</div>
      ) : (
        <div ref={scrollRef} className={styles.chatMessages}>
          {formattedMessages.map((message) => {
            const isMine = message.isMine || (isChannelMode && message.senderUsername === (currentUsername || 'Guest'));
            return (
              <div key={message.id} className={styles.chatMessageRow}>
                <div
                  className={`${styles.chatBubble} ${isMine ? styles.chatBubbleMine : ''} ${message.pending ? styles.chatBubblePending : ''}`}
                >
                  <strong>{message.senderUsername}</strong>
                  <span>{message.content}</span>
                  <small>{formatTime(message.timestamp)} {message.pending ? '• sending…' : ''}</small>
                </div>
              </div>
            );
          })}
          {!formattedMessages.length && (
            <p className={styles.placeholder}>{isChannelMode ? 'No chatter yet. Say hi!' : 'Loading messages…'}</p>
          )}
        </div>
      )}

      {isChatReady && (
        <div className={styles.chatFooter}>
          {sendError && <p className={styles.errorMessage}>{sendError}</p>}
          <form className={styles.chatForm} onSubmit={handleSend}>
            <textarea
              className={styles.chatInput}
              placeholder={composerPlaceholder || 'Write a message…'}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={2}
              style={{ maxHeight: 40, minHeight: 40 }}
            />
            <div className={styles.emojiToggle}>
              <button type="button" onClick={() => setShowEmojiPicker((prev) => !prev)} aria-label="Toggle emoji">
                🙂
              </button>
              {showEmojiPicker && (
                <div className={styles.emojiPicker}>
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      setDraft((prev) => `${prev}${emojiData.emoji}`);
                    }}
                  />
                </div>
              )}
            </div>
            <button
              type="submit"
              className={`${styles.sendButton} ${draft.trim() && !isSending ? styles.sendButtonActive : ''}`}
              disabled={isSending || !draft.trim()}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path
                  d="M3.4 20.4 21 12 3.4 3.6 3 10l11 2-11 2z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
