import React from 'react';
import styles from './MessageBubble.module.css';

type MessageBubbleProps = {
  text: string;
  createdAt: string;
  isOwn: boolean;
  status?: 'sending' | 'sent' | 'error';
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, createdAt, isOwn, status }) => {
  const containerClasses = [
    styles.messageContainer,
    isOwn ? styles.own : styles.other,
    status === 'sending' ? styles.sending : ''
  ].join(' ');

  return (
    <div className={containerClasses}>
      <div className={styles.bubble}>
        {text}
      </div>
      <div className={styles.createdAt}>
        {createdAt}
        {isOwn && status === 'error' && <span style={{ color: '#ef4444', marginLeft: '8px' }}>Failed</span>}
      </div>
    </div>
  );
};

export default MessageBubble;
