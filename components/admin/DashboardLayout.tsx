'use client';

import type { ReactNode } from 'react';
import styles from './DashboardLayout.module.css';

type TabKey = 'overview' | 'users' | 'feeds' | 'reports';

interface DashboardLayoutProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  children: ReactNode;
}

const tabs: { key: TabKey; label: string; description: string }[] = [
  { key: 'overview', label: 'Overview', description: 'Live operations summary' },
  { key: 'users', label: 'Users', description: 'Manage user base' },
  { key: 'feeds', label: 'Feeds', description: 'Approve pending stories' },
  { key: 'reports', label: 'Reports', description: 'Activity & audit logs' },
];

export default function DashboardLayout({ activeTab, onChangeTab, children }: DashboardLayoutProps) {
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div>
          <p className={styles.brand}>Patreek Admin</p>
          <p className={styles.tagline}>Operational control center</p>
        </div>
        <nav className={styles.nav} aria-label="Admin navigation">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={styles.navButton}
              aria-pressed={activeTab === tab.key}
              onClick={() => onChangeTab(tab.key)}
            >
              <span className={styles.navLabel}>{tab.label}</span>
              <span aria-hidden>↗</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className={styles.contentArea}>{children}</main>
    </div>
  );
}
