'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const [tickerIndex, setTickerIndex] = useState(0);
  const tickerWords = ['world', 'needs', 'lifestyle', 'focus', 'interests'];

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerWords.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.page}>
      {/* Navigation */}
      <nav className={styles.nav} role="banner">
        <div className={styles.navContainer}>
          <div className={styles.logoWrapper}>
            <Link href="/" className={styles.logo}>
              <Image
                src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/677e6d6274b355e5da3c9a7b_PATREEK%20-%20text%20logo.png"
                alt="Patreek"
                width={131}
                height={20}
                className={styles.logoImage}
                priority
              />
            </Link>
            <div className={styles.navMenu}>
              <button className={styles.navLink} onClick={() => scrollToSection('features')}>
                Features
              </button>
              <button className={styles.navLink} onClick={() => scrollToSection('pricing')}>
                Pricing
              </button>
            </div>
          </div>
          <div className={styles.actionsWrapper}>
            <button
              className={`${styles.button} ${styles.buttonSmall} ${styles.hideMobile}`}
              onClick={() => scrollToSection('download')}
            >
              Download now
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.section}>
        <div className={styles.containerLarge}>
          <div className={styles.headerLayout}>
            <div className={styles.headerContent}>
              <h1 className={styles.heading2}>Smart news.</h1>
              <div className={styles.textTicker}>
                <h1 className={styles.textTickerText}>Personalized for your</h1>
                <div className={styles.textTickerMask}>
                  <div
                    className={styles.textTickerCarousel}
                    style={{ '--ticker-index': tickerIndex } as React.CSSProperties}
                  >
                    {tickerWords.map((word, index) => (
                      <div
                        key={word}
                        className={`${styles.textTickerText} ${
                          index === tickerIndex ? styles.active : ''
                        }`}
                      >
                        {word}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.imageWrapper}>
              <Image
                src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675caa3a2f73ad268a86b51a_Patreek%20logo_slogan.png"
                alt="Patreek Logo - Great News! It's Patreek"
                width={881}
                height={881}
                className={styles.heroImage}
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.section}>
        <div className={styles.containerLarge}>
          <h2 className={styles.headingLarge}>
            <span className={styles.textGradientOverlay}>
              <strong>How it works</strong>
            </span>
          </h2>
          <div className={styles.spacer80}></div>
          <div className={styles.cardList}>
            <div className={styles.cardItem}>
              <Image
                src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675cb8a91ba91008af1bdd25_personalized.png"
                alt="Personalized"
                width={100}
                height={100}
                className={styles.iconLarge}
              />
              <div className={styles.spacer128}></div>
              <h3 className={styles.headingMedium}>
                <strong>Personalized selection</strong>
              </h3>
              <div className={styles.spacer16}></div>
              <p className={styles.paragraph}>
                Choose from a wide range of categories that matter most to you—whether it's
                technology, health, finance, sports, or entertainment. You have the power to
                customize your news feed, ensuring you get the stories that are most important to
                you.
              </p>
            </div>
            <div className={styles.cardItem}>
              <Image
                src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675cb8a9b84998bb4b835b31_routine.png"
                alt="Daily summaries"
                width={100}
                height={100}
                className={styles.iconLarge}
              />
              <div className={styles.spacer32}></div>
              <h3 className={styles.headingMedium}>Daily summaries</h3>
              <div className={styles.spacer16}></div>
              <p className={styles.paragraph}>
                Get concise summaries delivered to you every day, allowing you to stay updated
                without the clutter.
              </p>
            </div>
            <div className={styles.cardItem}>
              <Image
                src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675cb91365fcd45a810f0516_artificial-intelligence%20(1).png"
                alt="AI-powered"
                width={100}
                height={100}
                className={styles.iconLarge}
              />
              <div className={styles.spacer128}></div>
              <h3 className={styles.headingMedium}>
                <strong>AI-powered personalization</strong>
              </h3>
              <div className={styles.spacer16}></div>
              <p className={styles.paragraph}>
                By learning your preferences and interests, it tailors content specifically for you,
                ensuring you receive news that's relevant to your life.
              </p>
            </div>
            <div className={styles.cardItem}>
              <Image
                src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675cb8a988a0a14adcd75d33_information.png"
                alt="Stay informed"
                width={100}
                height={100}
                className={styles.iconLarge}
              />
              <div className={styles.spacer32}></div>
              <h3 className={styles.headingMedium}>
                <strong>Stay informed anytime, anywhere</strong>
              </h3>
              <div className={styles.spacer16}></div>
              <p className={styles.paragraph}>
                Browse your daily news summaries with ease, allowing you to focus on what matters
                most—staying updated!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={styles.section}>
        <div className={styles.containerLarge}>
          <h1 className={styles.headingExtraLarge}>
            <span className={styles.textGradientOverlay}>Simple and flexible pricing</span>
          </h1>
          <div className={styles.spacer64}></div>
          <div className={styles.pricingList}>
            <div className={styles.pricingCard}>
              <div className={styles.pricingCardTop}>
                <div className={styles.headingSmall}>Starter</div>
                <div className={styles.spacer16}></div>
                <div className={styles.headingLarge}>Free</div>
                <div className={styles.spacer32}></div>
                <div className={styles.dividerLine}></div>
                <div className={styles.spacer40}></div>
                <div className={styles.pricingFeaturesList}>
                  <div className={styles.pricingFeature}>
                    <Image
                      src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675ca775325477a121669f2d_check.svg"
                      alt="Check"
                      width={24}
                      height={24}
                      className={styles.icon24}
                    />
                    <div>
                      Summaries for up to <strong>5 news sub-categories</strong>
                    </div>
                  </div>
                  <div className={styles.pricingFeature}>
                    <Image
                      src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675ca775325477a121669f2d_check.svg"
                      alt="Check"
                      width={24}
                      height={24}
                      className={styles.icon24}
                    />
                    <div>Social media integration. Comments & sharing</div>
                  </div>
                  <div className={styles.pricingFeature}>
                    <Image
                      src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675ca775325477a121669f2d_check.svg"
                      alt="Check"
                      width={24}
                      height={24}
                      className={styles.icon24}
                    />
                    <div>News updates refreshed once daily</div>
                  </div>
                </div>
              </div>
              <button className={`${styles.buttonSecondary} ${styles.fullWidth}`}>
                Choose Starter
              </button>
            </div>
            <div className={`${styles.cardItem} ${styles.featured}`}>
              <div className={styles.gradientImage}></div>
              <div className={styles.pricingCardContent}>
                <div className={styles.pricingCardTop}>
                  <div className={styles.headingSmall}>Basic</div>
                  <div className={styles.spacer16}></div>
                  <div className={styles.headingLarge}>$4.99 /mo</div>
                  <div className={styles.spacer32}></div>
                  <div className={styles.dividerLine}></div>
                  <div className={styles.spacer40}></div>
                  <div className={styles.pricingFeaturesList}>
                    <div className={styles.pricingFeature}>
                      <Image
                        src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675ca775325477a121669f2d_check.svg"
                        alt="Check"
                        width={24}
                        height={24}
                        className={styles.icon24}
                      />
                      <div>
                        Summaries for up to <strong>10 news sub-categories</strong>
                      </div>
                    </div>
                    <div className={styles.pricingFeature}>
                      <Image
                        src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675ca775325477a121669f2d_check.svg"
                        alt="Check"
                        width={24}
                        height={24}
                        className={styles.icon24}
                      />
                      <div>Social media integration. Comments & sharing</div>
                    </div>
                    <div className={styles.pricingFeature}>
                      <Image
                        src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675ca775325477a121669f2d_check.svg"
                        alt="Check"
                        width={24}
                        height={24}
                        className={styles.icon24}
                      />
                      <div>News updates refreshed 3x daily</div>
                    </div>
                  </div>
                </div>
              </div>
              <button className={`${styles.button} ${styles.fullWidth}`}>Coming Soon...</button>
            </div>
            <div className={styles.cardItem}>
              <div className={styles.headingSmall}>Premium</div>
              <div className={styles.spacer16}></div>
              <div className={styles.headingLarge}>$9.99 /mo</div>
              <div className={styles.spacer32}></div>
              <div className={styles.dividerLine}></div>
              <div className={styles.spacer40}></div>
              <div className={styles.pricingFeaturesList}>
                <div className={styles.pricingFeature}>
                  <Image
                    src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675ca775325477a121669f2d_check.svg"
                    alt="Check"
                    width={24}
                    height={24}
                    className={styles.icon24}
                  />
                  <div>
                    <strong>Unlimited</strong> summaries of news sub-categories
                  </div>
                </div>
                <div className={styles.pricingFeature}>
                  <Image
                    src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675ca775325477a121669f2d_check.svg"
                    alt="Check"
                    width={24}
                    height={24}
                    className={styles.icon24}
                  />
                  <div>
                    Custom subcategories using <strong>prompts</strong>
                  </div>
                </div>
                <div className={styles.pricingFeature}>
                  <Image
                    src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675ca775325477a121669f2d_check.svg"
                    alt="Check"
                    width={24}
                    height={24}
                    className={styles.icon24}
                  />
                  <div>Social media integration. Comments & sharing</div>
                </div>
                <div className={styles.pricingFeature}>
                  <Image
                    src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675ca775325477a121669f2d_check.svg"
                    alt="Check"
                    width={24}
                    height={24}
                    className={styles.icon24}
                  />
                  <div>Streaming breaking news</div>
                </div>
                <div className={styles.pricingFeature}>
                  <Image
                    src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675ca775325477a121669f2d_check.svg"
                    alt="Check"
                    width={24}
                    height={24}
                    className={styles.icon24}
                  />
                  <div>Real time subscriptions (in view)</div>
                </div>
              </div>
              <button className={`${styles.buttonSecondary} ${styles.fullWidth}`}>
                Coming Soon...
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Download CTA Section */}
      <section id="download" className={`${styles.section} ${styles.isRelative}`}>
        <div className={styles.gradientImage}></div>
        <div className={styles.ctaCardContent}>
          <div className={styles.textBox}>
            <h2 className={styles.headingExtraLarge}>
              Don't miss the news that matters to you!
            </h2>
            <div className={styles.spacer16}></div>
            <div className={`${styles.paragraph} ${styles.extraLarge}`}>
              Your personalized news experience is just a click away.
            </div>
          </div>
          <div className={styles.spacer32}></div>
          <div className={styles.flexBlock}>
            <a
              href="https://apps.apple.com/us/app/patreek/id6547858283"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.storeLink}
            >
              <Image
                src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/67a3729b558347b9bf210a5a_Store%3DApp%20Store%2C%20Type%3DDark%2C%20Language%3DEnglish%402x.png"
                alt="Download on App Store"
                width={200}
                height={60}
              />
            </a>
            <a href="#" className={styles.storeLink}>
              <Image
                src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/67a3727c8abb3515ab42d712_Store%3DGoogle%20Play%2C%20Type%3DDark%2C%20Language%3DEnglish%402x.png"
                alt="Get it on Google Play"
                width={200}
                height={60}
              />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className={styles.section}>
        <div className={styles.containerLarge}>
          <div className={styles.footerGrid}>
            <Link href="/" className={styles.logo}>
              <Image
                src="https://cdn.prod.website-files.com/675ca775325477a121669e3c/675caa3a2f73ad268a86b51a_Patreek%20logo_slogan.png"
                alt="Patreek"
                width={111}
                height={60}
                className={styles.footerLogo}
              />
            </Link>
            <div className={styles.footerColumn}>
              <div className={styles.textColorMuted}>Product</div>
              <Link href="/" className={styles.footerLink}>
                Home
              </Link>
              <Link href="/features" className={styles.footerLink}>
                Features
              </Link>
              <a href="#" className={styles.footerLink}>
                Pricing
              </a>
            </div>
            <div className={styles.footerColumn}>
              <div className={styles.textColorMuted}>Company</div>
              <Link href="/about" className={styles.footerLink}>
                About
              </Link>
              <Link href="/contact" className={styles.footerLink}>
                Contact
              </Link>
            </div>
            <div className={styles.footerColumn}>
              <div className={styles.textColorMuted}>Social</div>
              <a href="https://x.com/" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
                X (Twitter)
              </a>
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.footerLink}
              >
                Instagram
              </a>
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.footerLink}
              >
                LinkedIn
              </a>
            </div>
          </div>
          <div className={styles.spacer96}></div>
          <div className={styles.dividerLine}></div>
          <div className={styles.spacer40}></div>
          <div className={styles.footerBottom}>
            <div className={`${styles.footerLink} ${styles.textColorMuted}`}>© Patreek 2025</div>
          </div>
        </div>
      </section>
    </div>
  );
}

