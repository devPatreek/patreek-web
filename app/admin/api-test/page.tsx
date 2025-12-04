'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainHeader from '@/components/MainHeader';
import Footer from '@/components/Footer';
import styles from './page.module.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.patreek.com';

interface ApiRequest {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  endpoint: string;
  headers: string;
  body: string;
}

export default function ApiTestPage() {
  const router = useRouter();
  const [request, setRequest] = useState<ApiRequest>({
    method: 'GET',
    endpoint: '/api/v1/feeds/public',
    headers: '{}',
    body: '',
  });
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMethodChange = (method: ApiRequest['method']) => {
    setRequest({ ...request, method });
  };

  const handleEndpointChange = (endpoint: string) => {
    setRequest({ ...request, endpoint: endpoint.startsWith('/') ? endpoint : `/${endpoint}` });
  };

  const handleHeadersChange = (headers: string) => {
    setRequest({ ...request, headers });
  };

  const handleBodyChange = (body: string) => {
    setRequest({ ...request, body });
  };

  const executeRequest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let headersObj: Record<string, string> = {};
      try {
        headersObj = JSON.parse(request.headers || '{}');
      } catch (e) {
        throw new Error('Invalid JSON in headers');
      }

      const url = `${API_BASE_URL}${request.endpoint}`;
      const options: RequestInit = {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...headersObj,
        },
      };

      if (request.body && ['POST', 'PATCH', 'PUT'].includes(request.method)) {
        try {
          JSON.parse(request.body);
          options.body = request.body;
        } catch (e) {
          throw new Error('Invalid JSON in request body');
        }
      }

      const res = await fetch(url, options);
      const contentType = res.headers.get('content-type');
      let responseData: any;

      if (contentType?.includes('application/json')) {
        responseData = await res.json();
      } else {
        responseData = await res.text();
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data: responseData,
      });
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    }
  };

  const presetEndpoints = [
    { method: 'GET' as const, endpoint: '/api/v1/feeds/public', label: 'Public Feeds' },
    { method: 'GET' as const, endpoint: '/api/v1/categories', label: 'All Categories' },
    { method: 'GET' as const, endpoint: '/api/v1/categories/public', label: 'Public Categories' },
    { method: 'GET' as const, endpoint: '/api/v1/analytics/top-1-commenter', label: 'Top Commenter' },
    { method: 'GET' as const, endpoint: '/api/v1/analytics/top-10-commenters', label: 'Top 10 Commenters' },
    { method: 'GET' as const, endpoint: '/api/v1/analytics/top-1-sharer', label: 'Top Sharer' },
    { method: 'GET' as const, endpoint: '/api/v1/analytics/top-10-sharers', label: 'Top 10 Sharers' },
    { method: 'GET' as const, endpoint: '/api/v1/analytics/top-1-patter', label: 'Top Patter' },
    { method: 'GET' as const, endpoint: '/api/v1/analytics/top-10-patters', label: 'Top 10 Patters' },
    { method: 'GET' as const, endpoint: '/api/v1/analytics/top-coin-holder', label: 'Top Coin Holder' },
    { method: 'GET' as const, endpoint: '/api/v1/analytics/top-10-coin-holders', label: 'Top 10 Coin Holders' },
  ];

  const loadPreset = (preset: typeof presetEndpoints[0]) => {
    setRequest({
      method: preset.method,
      endpoint: preset.endpoint,
      headers: '{}',
      body: '',
    });
  };

  return (
    <div className={styles.page}>
      <MainHeader hasSession={true} />

      <main className={styles.main}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h1 className={styles.title}>API Testing</h1>
            <p className={styles.subtitle}>Test backend API endpoints</p>
            <a href="/admin" className={styles.backLink}>← Back to Admin</a>
          </header>

          <div className={styles.content}>
            <div className={styles.requestSection}>
              <h2 className={styles.sectionTitle}>Request</h2>

              <div className={styles.methodSelector}>
                {(['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] as const).map((method) => (
                  <button
                    key={method}
                    className={`${styles.methodButton} ${request.method === method ? styles.active : ''}`}
                    onClick={() => handleMethodChange(method)}
                  >
                    {method}
                  </button>
                ))}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Endpoint</label>
                <input
                  type="text"
                  className={styles.input}
                  value={request.endpoint}
                  onChange={(e) => handleEndpointChange(e.target.value)}
                  placeholder="/api/v1/feeds/public"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Headers (JSON)</label>
                <textarea
                  className={styles.textarea}
                  value={request.headers}
                  onChange={(e) => handleHeadersChange(e.target.value)}
                  placeholder='{"X-Custom-Header": "value"}'
                  rows={4}
                />
              </div>

              {['POST', 'PATCH', 'PUT'].includes(request.method) && (
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Body (JSON)</label>
                  <textarea
                    className={styles.textarea}
                    value={request.body}
                    onChange={(e) => handleBodyChange(e.target.value)}
                    placeholder='{"key": "value"}'
                    rows={8}
                  />
                </div>
              )}

              <div className={styles.presets}>
                <label className={styles.label}>Quick Presets</label>
                <div className={styles.presetButtons}>
                  {presetEndpoints.map((preset, idx) => (
                    <button
                      key={idx}
                      className={styles.presetButton}
                      onClick={() => loadPreset(preset)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className={styles.executeButton}
                onClick={executeRequest}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Execute Request'}
              </button>
            </div>

            <div className={styles.responseSection}>
              <h2 className={styles.sectionTitle}>Response</h2>

              {error && (
                <div className={styles.error}>
                  <strong>Error:</strong> {error}
                </div>
              )}

              {response && (
                <>
                  <div className={styles.responseMeta}>
                    <span className={`${styles.statusBadge} ${response.status >= 200 && response.status < 300 ? styles.success : styles.error}`}>
                      {response.status} {response.statusText}
                    </span>
                    <button className={styles.copyButton} onClick={copyResponse}>
                      Copy Response
                    </button>
                  </div>

                  <div className={styles.responseContent}>
                    <details className={styles.details}>
                      <summary className={styles.summary}>Headers</summary>
                      <pre className={styles.pre}>{JSON.stringify(response.headers, null, 2)}</pre>
                    </details>

                    <details className={styles.details} open>
                      <summary className={styles.summary}>Body</summary>
                      <pre className={styles.pre}>{JSON.stringify(response.data, null, 2)}</pre>
                    </details>
                  </div>
                </>
              )}

              {!response && !error && !loading && (
                <div className={styles.placeholder}>
                  Execute a request to see the response here
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

