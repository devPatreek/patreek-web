"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import MainHeader from "@/components/MainHeader";
import styles from "./page.module.css";

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const t = params?.get("token") || "";
    setToken(t);
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!token) {
      setError("Reset link is missing or invalid.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/auth/reset-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Unable to reset password. The link may have expired.");
      }
      setMessage("Password updated successfully. You can sign in with your new password.");
      setTimeout(() => router.push("/registration"), 1200);
    } catch (err: any) {
      setError(err?.message || "Unable to reset password. The link may have expired.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <MainHeader />
      <div className={styles.content}>
        <div className={styles.card}>
          <h1 className={styles.title}>Set a new password</h1>
          <p className={styles.subtitle}>Create a strong password to secure your account.</p>
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label}>
              New password
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>
            <label className={styles.label}>
              Confirm password
              <input
                className={styles.input}
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>
            <button className={styles.button} type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Update password"}
            </button>
          </form>
          {message && <div className={`${styles.card} ${styles.success}`}>{message}</div>}
          {error && <div className={`${styles.card} ${styles.error}`}>{error}</div>}
          <p className={styles.note}>
            Done? <Link className={styles.link} href="/registration">Go to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className={styles.page}><MainHeader /><div className={styles.content}>Loading...</div></div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
