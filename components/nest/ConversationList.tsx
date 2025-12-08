'use client';

import { useEffect, useMemo } from 'react';
import useSWR from 'swr';
import styles from './Nest.module.css';

export interface ConversationSummary {
  id: string;
  otherUserId: string;
  otherUserName?: string;
  otherUserAvatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

interface ConversationListProps {
  activeUserId?: string;
  onSelectUser: (conversation: ConversationSummary, options?: { openChat?: boolean }) => void;
}

const normalizeConversation = (item: any): ConversationSummary => {
  const safeOtherUserId =
    item.otherUserId ??
    item.partnerId ??
    item.recipientId ??
    item.senderId ??
    item.conversationId ??
    '';

  const displayName =
    item.otherUserName ||
    item.recipientName ||
    item.senderName ||
    item.username ||
    item.name ||
    'Patreek User';

  const fallbackConversationId = `${item.senderId ?? '0'}-${item.recipientId ?? '0'}`;
  const safeConversationId = item.id?.toString?.() ?? safeOtherUserId;

  return {
    id: safeConversationId || fallbackConversationId,
    otherUserId: safeOtherUserId?.toString() ?? '',
    otherUserName: displayName,
    otherUserAvatar: item.otherUserAvatarUrl ?? item.avatarUrl ?? item.profileImage,
    lastMessage: item.lastMessage ?? item.lastMessageBody ?? item.body ?? item.subject ?? '',
    lastMessageAt: item.lastMessageAt ?? item.updatedAt ?? item.createdAt,
    unreadCount: Number(item.unreadCount ?? item.unread ?? item.unreadMessages ?? 0),
  };
};

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Unable to load conversations');
  }

  const payload = await response.json();
  const items = payload?.content ?? payload?.data ?? payload ?? [];

  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => normalizeConversation(item));
};

const formatTimeAgo = (value?: string) => {
  if (!value) {
    return '';
  }
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) {
    return value;
  }
  const diffMinutes = Math.floor((Date.now() - then) / 60000);
  if (diffMinutes < 1) return 'now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getInitials = (name?: string) => {
  if (!name) return 'PU';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return 'PU';
  const initials = parts.slice(0, 2).map((part) => part[0]).join('');
  return initials.toUpperCase();
};

export default function ConversationList({ activeUserId, onSelectUser }: ConversationListProps) {
  const { data, error, isValidating } = useSWR<ConversationSummary[]>('/api/v1/nest/conversations', fetcher);

  const conversations = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      const timeA = new Date(a.lastMessageAt || '').getTime();
      const timeB = new Date(b.lastMessageAt || '').getTime();
      return (timeB || 0) - (timeA || 0);
    });
  }, [data]);

  useEffect(() => {
    if (!activeUserId && conversations.length > 0) {
      onSelectUser(conversations[0], { openChat: false });
    }
  }, [activeUserId, conversations, onSelectUser]);

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <p className={styles.sidebarTitle}>Conversations</p>
        <p className={styles.sidebarSubtitle}>Tap or click to continue a DM.</p>
      </div>

      {error && <p className={styles.errorMessage}>Unable to load conversations.</p>}
      {isValidating && conversations.length === 0 ? (
        <p className={styles.placeholder}>Loading conversations…</p>
      ) : conversations.length === 0 ? (
        <p className={styles.placeholder}>No conversations yet.</p>
      ) : (
        <div className={styles.list}>
          {conversations.map((conversation) => {
            const isActive = Boolean(conversation.otherUserId && conversation.otherUserId === activeUserId);
            const preview =
              conversation.lastMessage && conversation.lastMessage.length > 70
                ? `${conversation.lastMessage.slice(0, 70)}…`
                : conversation.lastMessage;
            const timestamp = formatTimeAgo(conversation.lastMessageAt);

            return (
              <button
                key={conversation.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => onSelectUser(conversation, { openChat: true })}
                className={`${styles.conversationItem} ${isActive ? styles.conversationActive : ''}`}
              >
                <div className={styles.conversationAvatar}>
                  {conversation.otherUserAvatar ? (
                    <img src={conversation.otherUserAvatar} alt={`${conversation.otherUserName ?? 'User'} avatar`} />
                  ) : (
                    <span>{getInitials(conversation.otherUserName)}</span>
                  )}
                </div>
                <div className={styles.conversationContent}>
                  <div className={styles.conversationTopRow}>
                    <span className={styles.conversationName}>{conversation.otherUserName || 'Patreek User'}</span>
                    {timestamp && <span className={styles.conversationTime}>{timestamp}</span>}
                  </div>
                  <p className={styles.conversationPreview}>{preview || 'No messages yet.'}</p>
                  <div className={styles.conversationBottomRow}>
                    <span className={styles.conversationTime}>
                      {conversation.lastMessageAt
                        ? new Date(conversation.lastMessageAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })
                        : ''}
                    </span>
                    {conversation.unreadCount ? (
                      <span className={styles.unreadBadge}>{conversation.unreadCount}</span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
