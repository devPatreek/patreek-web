"use client";

import { useState } from "react";
import Link from "next/link";
import MainHeader from "@/components/MainHeader";
import styles from "./page.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/v1/auth/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Unable to send reset link. Please try again.");
      }
      setMessage("If that email exists, a reset link has been sent. Please check your inbox.");
    } catch (err: any) {
      setError(err?.message || "Unable to send reset link. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <MainHeader />
      <div className={styles.content}>
        <div className={styles.card}>
          <h1 className={styles.title}>Reset your password</h1>
          <p className={styles.subtitle}>
            Enter the email linked to your Patreek account. We&apos;ll send a secure link to reset your password.
          </p>
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label}>
              Email
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <button className={styles.button} type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send reset link"}
            </button>
          </form>
          {message && <div className={`${styles.card} ${styles.success}`}>{message}</div>}
          {error && <div className={styles.card} style={{ borderColor: "#f87171", color: "#991b1b", background: "#fef2f2" }}>{error}</div>}
          <p className={styles.note}>
            Remembered it? <Link className={styles.link} href="/registration">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
