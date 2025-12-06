'use client';

import { useMemo, useState } from 'react';
import styles from './page.module.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.patreek.com';

const codeSample = `curl -X GET \\
  "${API_BASE_URL}/api/v1/feeds/public?page=0&size=10" \\
  -H "Accept: application/json"
`;

export default function DeveloperPage() {
  const [activeTab, setActiveTab] = useState<'docs' | 'swagger' | 'pricing'>('docs');
  const baseUrl = useMemo(() => API_BASE_URL, []);

  return (
    <div className={styles.page}>
      <header className={styles.heroShell}>
        <div className={styles.headerContent}>
          <div className={styles.badgeRow}>
            <span className={styles.pill}>New</span>
            <span className={styles.kicker}>REST + Realtime ready</span>
            <span className={styles.pillSecondary}>99.9% uptime</span>
          </div>
          <h1 className={styles.title}>Build with Patreek</h1>
          <p className={styles.subtitle}>
            Ship social-grade news feeds, analytics, and user engagement features with a fast, predictable API.
          </p>
          <div className={styles.heroActions}>
            <a href="#docs" className={`${styles.btn} ${styles.primary}`}>View docs</a>
            <a
              href={`${API_BASE_URL}/swagger-ui.html`}
              target="_blank"
              rel="noreferrer"
              className={`${styles.btn} ${styles.ghost}`}
            >
              Open Swagger
            </a>
          </div>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <p className={styles.muted}>Latency</p>
              <strong>~120 ms</strong>
              <span className={styles.muted}>avg P99 across US-East</span>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.muted}>Requests/day</p>
              <strong>12M+</strong>
              <span className={styles.muted}>burst-friendly</span>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.muted}>Authentication</p>
              <strong>Session &amp; JWT</strong>
              <span className={styles.muted}>ready for mobile + web</span>
            </div>
            <div className={styles.baseCard}>
              <p className={styles.muted}>Base URL</p>
              <code className={styles.inlineCode}>{baseUrl}</code>
              <span className={styles.muted}>Global edge routing</span>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.container}>
          <section className={styles.quickstart} id="docs">
            <div className={styles.sectionHeader}>
              <p className={styles.kicker}>Kickoff in minutes</p>
              <h2>Quickstart</h2>
              <p className={styles.muted}>Authenticate, fetch feeds, and ship.</p>
            </div>
            <div className={styles.cardGrid}>
              <div className={styles.quickCard}>
                <p className={styles.kicker}>01 · Authenticate</p>
                <p>Use session token or JWT Bearer. Both work across web and mobile.</p>
              </div>
              <div className={styles.quickCard}>
                <p className={styles.kicker}>02 · Request</p>
                <p>Hit <code className={styles.inlineCode}>/api/v1/feeds/public</code> or category endpoints to get content.</p>
              </div>
              <div className={styles.quickCard}>
                <p className={styles.kicker}>03 · Delight</p>
                <p>Layer in pats, shares, comments, and analytics for instant engagement.</p>
              </div>
            </div>
            <div className={styles.codeSample}>
              <div className={styles.codeHeader}>
                <span>Fetch public feeds</span>
                <span className={styles.pillSecondary}>cURL</span>
              </div>
              <pre className={styles.codeBlock}>{codeSample}</pre>
            </div>
          </section>

          <section className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <p className={styles.kicker}>Feeds</p>
              <h3>Curated news + social</h3>
              <p className={styles.muted}>Fetch public or personalized feeds, categories, and media-rich stories.</p>
            </div>
            <div className={styles.featureCard}>
              <p className={styles.kicker}>Social signals</p>
              <h3>Pats, shares, comments</h3>
              <p className={styles.muted}>Read and write engagement data, then rank with our analytics endpoints.</p>
            </div>
            <div className={styles.featureCard}>
              <p className={styles.kicker}>Auth</p>
              <h3>Session + JWT</h3>
              <p className={styles.muted}>Flexible auth for mobile, web, and server-to-server workflows.</p>
            </div>
            <div className={styles.featureCard}>
              <p className={styles.kicker}>Observability</p>
              <h3>Rate limits that flex</h3>
              <p className={styles.muted}>Transparent headers, sane defaults, and burst handling.</p>
            </div>
          </section>

          <nav className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'docs' ? styles.active : ''}`}
              onClick={() => setActiveTab('docs')}
            >
              Documentation
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'swagger' ? styles.active : ''}`}
              onClick={() => setActiveTab('swagger')}
            >
              Interactive API
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'pricing' ? styles.active : ''}`}
              onClick={() => setActiveTab('pricing')}
            >
              Pricing
            </button>
          </nav>

          <div className={styles.content}>
            {activeTab === 'docs' && (
              <div className={styles.docsSection}>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Getting Started</h2>
                  <div className={styles.sectionContent}>
                    <p>Welcome to the Patreek API! Our RESTful API provides access to news feeds, categories, social interactions, and user data.</p>

                    <h3 className={styles.subsectionTitle}>Base URL</h3>
                    <code className={styles.codeBlock}>{API_BASE_URL}</code>

                    <h3 className={styles.subsectionTitle}>Authentication</h3>
                    <p>Most endpoints require authentication. Use one of the following methods:</p>
                    <ul className={styles.list}>
                      <li><strong>Session Token:</strong> Include <code className={styles.inlineCode}>X-Session-Token</code> header (for web/mobile apps)</li>
                      <li><strong>JWT Bearer:</strong> Include <code className={styles.inlineCode}>Authorization: Bearer &lt;token&gt;</code> header</li>
                    </ul>

                    <h3 className={styles.subsectionTitle}>Public Endpoints</h3>
                    <p>These endpoints don't require authentication:</p>
                    <ul className={styles.list}>
                      <li><code className={styles.inlineCode}>GET /api/v1/feeds/public</code> - Get public feeds</li>
                      <li><code className={styles.inlineCode}>GET /api/v1/categories</code> - Get all categories</li>
                      <li><code className={styles.inlineCode}>GET /api/v1/categories/public</code> - Get public categories</li>
                      <li><code className={styles.inlineCode}>GET /api/v1/analytics/**</code> - Analytics endpoints</li>
                      <li><code className={styles.inlineCode}>POST /api/v1/auth/signup</code> - User registration</li>
                      <li><code className={styles.inlineCode}>POST /api/v1/auth/signin</code> - User sign-in</li>
                    </ul>
                  </div>
                </section>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Rate Limiting</h2>
                  <div className={styles.sectionContent}>
                    <p>To ensure fair usage and prevent abuse, we implement rate limiting on our API endpoints.</p>

                    <h3 className={styles.subsectionTitle}>Rate Limit Details</h3>
                    <div className={styles.rateLimitTable}>
                      <div className={styles.rateLimitRow}>
                        <div className={styles.rateLimitCell}><strong>Endpoint Type</strong></div>
                        <div className={styles.rateLimitCell}><strong>Limit</strong></div>
                        <div className={styles.rateLimitCell}><strong>Window</strong></div>
                      </div>
                      <div className={styles.rateLimitRow}>
                        <div className={styles.rateLimitCell}>Public Feeds</div>
                        <div className={styles.rateLimitCell}>100 requests</div>
                        <div className={styles.rateLimitCell}>1 minute</div>
                      </div>
                      <div className={styles.rateLimitRow}>
                        <div className={styles.rateLimitCell}>Authentication</div>
                        <div className={styles.rateLimitCell}>5 attempts</div>
                        <div className={styles.rateLimitCell}>15 minutes</div>
                      </div>
                      <div className={styles.rateLimitRow}>
                        <div className={styles.rateLimitCell}>General API</div>
                        <div className={styles.rateLimitCell}>1000 requests</div>
                        <div className={styles.rateLimitCell}>1 hour</div>
                      </div>
                    </div>

                    <h3 className={styles.subsectionTitle}>Rate Limit Headers</h3>
                    <p>All API responses include rate limit information in headers:</p>
                    <ul className={styles.list}>
                      <li><code className={styles.inlineCode}>X-RateLimit-Limit</code> - Maximum requests allowed</li>
                      <li><code className={styles.inlineCode}>X-RateLimit-Remaining</code> - Remaining requests in window</li>
                      <li><code className={styles.inlineCode}>X-RateLimit-Reset</code> - Timestamp when limit resets</li>
                    </ul>

                    <h3 className={styles.subsectionTitle}>Rate Limit Exceeded</h3>
                    <p>When you exceed the rate limit, you'll receive a <code className={styles.inlineCode}>429 Too Many Requests</code> response with a <code className={styles.inlineCode}>Retry-After</code> header indicating when you can retry.</p>
                  </div>
                </section>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>API Endpoints</h2>
                  <div className={styles.sectionContent}>
                    <h3 className={styles.subsectionTitle}>Feeds</h3>
                    <ul className={styles.list}>
                      <li><code className={styles.inlineCode}>GET /api/v1/feeds/public</code> - Get paginated public feeds</li>
                      <li><code className={styles.inlineCode}>GET /api/v1/feeds/{'{id}'}</code> - Get single feed by ID</li>
                      <li><code className={styles.inlineCode}>GET /api/v1/feeds</code> - Get feeds for authenticated user</li>
                    </ul>

                    <h3 className={styles.subsectionTitle}>Categories</h3>
                    <ul className={styles.list}>
                      <li><code className={styles.inlineCode}>GET /api/v1/categories</code> - Get all categories (hierarchical)</li>
                      <li><code className={styles.inlineCode}>GET /api/v1/categories/public</code> - Get public categories only</li>
                    </ul>

                    <h3 className={styles.subsectionTitle}>Analytics</h3>
                    <ul className={styles.list}>
                      <li><code className={styles.inlineCode}>GET /api/v1/analytics/top-1-commenter</code> - Top commenter</li>
                      <li><code className={styles.inlineCode}>GET /api/v1/analytics/top-10-commenters</code> - Top 10 commenters</li>
                      <li><code className={styles.inlineCode}>GET /api/v1/analytics/top-1-sharer</code> - Top sharer</li>
                      <li><code className={styles.inlineCode}>GET /api/v1/analytics/top-10-sharers</code> - Top 10 sharers</li>
                      <li><code className={styles.inlineCode}>GET /api/v1/analytics/top-1-patter</code> - Top patter</li>
                      <li><code className={styles.inlineCode}>GET /api/v1/analytics/top-10-patters</code> - Top 10 patters</li>
                      <li><code className={styles.inlineCode}>GET /api/v1/analytics/top-coin-holder</code> - Top coin holder</li>
                      <li><code className={styles.inlineCode}>GET /api/v1/analytics/top-10-coin-holders</code> - Top 10 coin holders</li>
                    </ul>

                    <h3 className={styles.subsectionTitle}>Authentication</h3>
                    <ul className={styles.list}>
                      <li><code className={styles.inlineCode}>POST /api/v1/auth/signup</code> - Register new user</li>
                      <li><code className={styles.inlineCode}>POST /api/v1/auth/signin</code> - Sign in user</li>
                      <li><code className={styles.inlineCode}>POST /api/v1/auth/signout</code> - Sign out user</li>
                      <li><code className={styles.inlineCode}>GET /api/v1/auth/session</code> - Check session status</li>
                      <li><code className={styles.inlineCode}>GET /api/v1/auth/verify-email</code> - Verify email address</li>
                    </ul>
                  </div>
                </section>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Response Format</h2>
                  <div className={styles.sectionContent}>
                    <p>All API responses follow a consistent format:</p>
                    <pre className={styles.codeBlock}>
{`{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "error": null,
  "timestamp": "2024-01-01T00:00:00Z"
}`}
                    </pre>

                    <h3 className={styles.subsectionTitle}>Error Responses</h3>
                    <p>Error responses include error details:</p>
                    <pre className={styles.codeBlock}>
{`{
  "success": false,
  "data": null,
  "message": "Error description",
  "error": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z"
}`}
                    </pre>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'swagger' && (
              <div className={styles.swaggerSection}>
                <iframe
                  src={`${API_BASE_URL}/swagger-ui.html`}
                  className={styles.swaggerFrame}
                  title="Swagger UI"
                />
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className={styles.pricingSection}>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>API Pricing</h2>
                  <div className={styles.sectionContent}>
                    <p className={styles.comingSoon}>Pricing plans coming soon! We're working on flexible pricing options for developers.</p>
                    <p>Future features will include:</p>
                    <ul className={styles.list}>
                      <li>Free tier with basic rate limits</li>
                      <li>Pro tier with higher limits and priority support</li>
                      <li>Enterprise tier with custom limits and SLA</li>
                      <li>API key management</li>
                      <li>Usage analytics and billing</li>
                    </ul>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
