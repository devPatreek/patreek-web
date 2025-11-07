'use client';

import Link from 'next/link';
import styles from './page.module.css';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.logoLink}>
          <img
            src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675caa3a2f73ad268a86b51a_Patreek%20logo_slogan.png"
            alt="Patreek"
            className={styles.logo}
          />
        </Link>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.lastUpdated}>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Introduction</h2>
            <p>
              Welcome to Patreek. Patreek App is owned and operated by Sentigraph Inc. ("we," "our," or "us"). 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
              use our website located at patreek.com and our mobile application (collectively, the "Service").
            </p>
            <p>
              Please read this Privacy Policy carefully. By using our Service, you agree to the collection and use 
              of information in accordance with this policy.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Information We Collect</h2>
            <h3 className={styles.subsectionTitle}>2.1 Information You Provide</h3>
            <p>We may collect information that you provide directly to us, including:</p>
            <ul>
              <li>Account registration information (name, email address, password)</li>
              <li>Profile information and preferences</li>
              <li>Content you create, post, or share through the Service</li>
              <li>Communications with us (support requests, feedback)</li>
            </ul>

            <h3 className={styles.subsectionTitle}>2.2 Automatically Collected Information</h3>
            <p>When you use our Service, we may automatically collect certain information, including:</p>
            <ul>
              <li>Device information (device type, operating system, unique device identifiers)</li>
              <li>Usage data (pages visited, features used, time spent)</li>
              <li>Location information (if you grant permission)</li>
              <li>Log data (IP address, browser type, access times)</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our Service</li>
              <li>Personalize your experience and deliver relevant content</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, prevent, and address technical issues and fraudulent activity</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Advertising</h2>
            <p>
              We use Google AdSense to display advertisements on our Service. Google AdSense may use cookies and 
              similar technologies to provide personalized advertising based on your interests and browsing behavior.
            </p>
            <p>
              You can opt out of personalized advertising by visiting Google's Ad Settings at 
              <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className={styles.link}>
                {' '}https://www.google.com/settings/ads
              </a>.
            </p>
            <p>
              For more information about how Google uses data when you use our Service, please visit 
              <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className={styles.link}>
                {' '}Google's Privacy & Terms
              </a>.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. Information Sharing and Disclosure</h2>
            <p>We may share your information in the following circumstances:</p>
            <ul>
              <li><strong>Service Providers:</strong> We may share information with third-party service providers who perform services on our behalf</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid requests by public authorities</li>
              <li><strong>Business Transfers:</strong> In connection with any merger, sale, or transfer of assets</li>
              <li><strong>With Your Consent:</strong> We may share information with your explicit consent</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information. 
              However, no method of transmission over the Internet or electronic storage is 100% secure, and we 
              cannot guarantee absolute security.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>7. Your Rights and Choices</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access and receive a copy of your personal information</li>
              <li>Rectify inaccurate or incomplete information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to processing of your personal information</li>
              <li>Request restriction of processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>8. Children's Privacy</h2>
            <p>
              Our Service is not intended for children under the age of 13. We do not knowingly collect personal 
              information from children under 13. If you are a parent or guardian and believe your child has provided 
              us with personal information, please contact us.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>9. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the 
              new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this 
              Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <p>
              <strong>Sentigraph Inc.</strong><br />
              Email: <a href="mailto:privacy@patreek.com" className={styles.link}>privacy@patreek.com</a><br />
              Website: <a href="https://patreek.com" target="_blank" rel="noopener noreferrer" className={styles.link}>patreek.com</a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

