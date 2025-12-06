'use client';

import { useState } from 'react';
import Link from 'next/link';
import MainHeader from '@/components/MainHeader';
import styles from './page.module.css';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedBody = body.trim();
    if (trimmedBody.length < 5) {
      setError('Message must be at least 5 characters.');
      return;
    }
    setStatus('submitting');
    setError(null);
    try {
      const response = await fetch('https://api.patreek.com/api/v1/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          title,
          body: trimmedBody,
        }),
      });
      if (!response.ok) {
        let message = 'Unable to submit feedback right now';
        try {
          const data = await response.json();
          message =
            data?.error?.details?.message ||
            data?.error?.message ||
            data?.message ||
            message;
        } catch {
          // fall through
        }
        throw new Error(message);
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Submission failed');
    }
  };

  const disabled =
    status === 'submitting' ||
    status === 'success' ||
    body.trim().length < 5;

  return (
    <div className={styles.page}>
      <MainHeader hasSession={false} />

      <header className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/" className={styles.backLink}>
            ← Back to home
          </Link>
        </div>
        <h1 className={styles.heading}>Contact Patreek</h1>
        <p className={styles.subhead}>Send us feedback, requests, or partnership ideas.</p>
      </header>

      <main className={styles.main}>
        {status === 'success' ? (
          <div className={styles.successCard}>
            <p className={styles.successText}>Thank you, your submission has been received.</p>
            <Link href="/" className={styles.backLink}>
              ← Back to home
            </Link>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className={styles.input}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                required
                disabled={disabled}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className={styles.input}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
                disabled={disabled}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="title">
                Title
              </label>
              <input
                id="title"
                className={styles.input}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="My coins"
                required
                disabled={disabled}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="body">
                Message
              </label>
              <textarea
                id="body"
                className={styles.textarea}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="My contact message here"
                rows={6}
                required
                minLength={5}
                maxLength={10000}
                disabled={disabled}
              />
              <p className={styles.helper}>Minimum 5 characters. Max 10,000.</p>
            </div>
            {status === 'error' && <div className={styles.error}>{error}</div>}
            <button type="submit" className={styles.submit} disabled={disabled}>
              {status === 'submitting' ? 'Submitting…' : 'Submit'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
