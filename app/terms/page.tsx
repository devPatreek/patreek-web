'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

const TERMS = [
  {
    title: 'Welcome to Patreek!',
    description:
      'These Terms and Conditions ("Terms") govern your access to and use of the Patreek website ("Website"), the related services offered by Sentigraph Inc. ("we," "us," or "our"), and the content available through the Website (collectively, the "Service").',
  },
  {
    title: '1. Acceptance of Terms',
    description:
      'By accessing or using the Website, you agree to be bound by these Terms. If you do not agree to all of these Terms, you may not access or use the Service.',
  },
  {
    title: '2. Age Requirement',
    description:
      'You must be at least 13 years old to use the Service. By using the Service, you represent and warrant that you are at least 13 years old and of legal capacity to enter into a binding agreement.',
  },
  {
    title: '3. User Accounts',
    description:
      'You may need to create an account to access certain features of the Service. You are responsible for maintaining the confidentiality of your account information, including your username and password. You are also responsible for all activity that occurs under your account.',
  },
  {
    title: '4. Content',
    description:
      'The Service contains content owned or licensed by us and our licensors ("Content"). The Content is protected by copyright, trademark, and other intellectual property laws. You agree not to copy, modify, distribute, sell, or create derivative works of the Content without our express written permission.',
  },
  {
    title: '5. User Generated Content',
    description:
      'You may be able to submit content to the Service, such as comments or reviews ("User Generated Content"). You retain all ownership rights to your User Generated Content. However, by submitting User Generated Content, you grant us a non-exclusive, royalty-free, worldwide license to use, modify, publish, and translate your User Generated Content in connection with the Service. You also represent and warrant that your User Generated Content does not violate any third-party rights.',
  },
  {
    title: '6. Third-Party Services',
    description:
      'The Service may contain links to third-party websites or services. We are not responsible for the content or practices of any third-party websites or services. Your use of third-party websites or services is subject to the terms and conditions of those websites or services.',
  },
  {
    title: '7. Disclaimers',
    description:
      'THE SERVICE IS PROVIDED "AS IS" AND WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING, BUT NOT LIMITED TO, WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND AVAILABILITY. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE.',
  },
  {
    title: '8. Limitation of Liability',
    description:
      'TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE WILL NOT BE LIABLE FOR ANY DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, INCLUDING, BUT NOT LIMITED TO, DIRECT, INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, PUNITIVE, OR EXEMPLARY DAMAGES.',
  },
  {
    title: '9. Termination',
    description:
      'We may terminate your access to the Service for any reason or no reason, at any time, without notice.',
  },
  {
    title: '10. Governing Law',
    description:
      'These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States of America, without regard to its conflict of laws provisions.',
  },
  {
    title: '11. Dispute Resolution',
    description:
      'Any dispute arising out of or relating to these Terms will be settled by binding arbitration in accordance with the rules of the American Arbitration Association. The arbitration shall be held in Melissa, Texas, United States of America.',
  },
  {
    title: '12. Entire Agreement',
    description:
      'These Terms constitute the entire agreement between you and us regarding your use of the Service.',
  },
  {
    title: '13. Severability',
    description:
      'If any provision of these Terms is held to be invalid or unenforceable, such provision shall be struck and the remaining provisions shall remain in full force and effect.',
  },
  {
    title: '14. Updates to Terms',
    description:
      'We may update these Terms from time to time. We will notify you of any changes by posting the new Terms on the Website. You are advised to review these Terms periodically for any changes. Your continued use of the Service after the revised Terms are posted constitutes your acceptance of the revised Terms.',
  },
  {
    title: '15. Contact Us',
    description:
      'If you have any questions about these Terms, please contact us at dev@patreek.com.',
  },
];

export default function TermsPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.logoLink}>
          <Image
            src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675caa3a2f73ad268a86b51a_Patreek%20logo_slogan.png"
            alt="Patreek"
            width={111}
            height={60}
            className={styles.logo}
          />
        </Link>
      </header>
      <main className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.title}>Patreek Website Terms and Conditions</h1>
          <p className={styles.date}>Last updated: July 31, 2024</p>
          <div className={styles.divider}></div>
          {TERMS.map(({ title, description }) => (
            <div key={title} className={styles.section}>
              <h2 className={styles.sectionTitle}>{title}</h2>
              <p className={styles.sectionText}>{description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

