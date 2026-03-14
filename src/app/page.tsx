'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<'initial' | 'signin'>('initial');
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    router.push('/portal');
  };

  const handleGuestBooking = () => {
    router.push('/booking');
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>ISA<span>.</span>TRAVEL</div>
          <div className={styles.poweredBy}>Powered by CTMS Travel</div>
        </div>
        <button className={styles.supportBtn} onClick={() => setIsContactOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"></path>
          </svg>
          <span className={styles.supportBtnText}>Agent Support</span>
        </button>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          {view === 'initial' ? (
            <div className={styles.textContent} style={{ animation: 'fadeIn 0.4s ease forwards' }}>
              <h1 className={styles.heroTitle}>
                WHEREVER THE GAME<br />
                <span>TAKES YOU.</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Seamless travel logistics, premium accommodations, and high-performance transportation for athletes, teams, and their families worldwide.
              </p>
              <button
                onClick={() => setView('signin')}
                className="geometric-btn"
                style={{ padding: '24px 48px', fontSize: '1.1rem', marginTop: '20px' }}
              >
                Start Booking
              </button>
            </div>
          ) : (
            <div className={styles.authContainer} style={{ animation: 'fadeIn 0.4s ease forwards', width: '100%', maxWidth: '500px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
                <button
                  onClick={() => setView('initial')}
                  className="circle-arrow-btn"
                  style={{ marginRight: '24px', transform: 'rotate(180deg)' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
                <h2 className={styles.heroTitle} style={{ fontSize: '3rem', marginBottom: 0 }}>
                  PORTAL<br />
                  <span>ACCESS</span>
                </h2>
              </div>

              <form onSubmit={handleSignIn} className={styles.formContainer}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Email Address</label>
                  <input
                    type="email"
                    className={styles.loginInput}
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Password</label>
                  <input
                    type="password"
                    className={styles.loginInput}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="geometric-btn" style={{ width: '100%', marginBottom: '24px' }}>
                  Member Sign In
                </button>
              </form>

              <div className={styles.divider}>
                <span style={{ background: 'white' }}>OR</span>
              </div>

              <button onClick={handleGuestBooking} className="geometric-btn geometric-btn-secondary" style={{ width: '100%' }}>
                Continue as Guest
              </button>
            </div>
          )}
        </div>

        <div className={styles.heroRight}>
          <Image
            src="/hero-bg.png"
            alt="Sports Action Background"
            fill
            priority
            style={{ objectFit: 'cover' }}
          />
          <img
            src="https://cdn.prod.website-files.com/687ea668cab796cde037ec77/68978c46a996f62b608074db_ISA%20Stamp-02.svg"
            alt="ISA Stamp"
            className={styles.floatingStampLogo}
          />
        </div>
      </section>

      {isContactOpen && (
        <div className={styles.contactOverlay}>
          <button className={styles.closeOverlayBtn} onClick={() => setIsContactOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div className={styles.contactLeft}>
            <h2 className={styles.contactTitle}>Get in Touch</h2>
            <p className={styles.contactSubtitle}>Our dedicated support team is here to help you with your travel arrangements 24/7.</p>

            <div className={styles.contactMethodRow}>
              <div className={styles.contactMethodIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"></path>
                </svg>
              </div>
              <div className={styles.contactMethodInfo}>
                <div className={styles.contactMethodLabel}>Global Support Phone</div>
                <div className={styles.contactMethodValue}>+1 (800) 555-0199</div>
              </div>
            </div>

            <div className={styles.contactMethodRow}>
              <div className={styles.contactMethodIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"></path>
                </svg>
              </div>
              <div className={styles.contactMethodInfo}>
                <div className={styles.contactMethodLabel}>VIP Support Line</div>
                <div className={styles.contactMethodValue}>+1 (800) 555-0299</div>
              </div>
            </div>

            <div className={styles.contactMethodRow}>
              <div className={styles.contactMethodIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div className={styles.contactMethodInfo}>
                <div className={styles.contactMethodLabel}>Email Support</div>
                <div className={styles.contactMethodValue}>support@isatravel.com</div>
              </div>
            </div>
          </div>

          <div className={styles.contactRight}>
            <div className={styles.chatHeader}>
              <h2 className={styles.chatTitle}>AI Assistant</h2>
              <p className={styles.chatSubtitle}>Get instant answers to your questions and travel advice</p>
            </div>

            <div className={styles.chatWindow}>
              <div className={styles.chatMessages}>
                <div className={`${styles.chatMessage} ${styles.chatMessageBot}`}>
                  Hello! I&apos;m your ISA travel assistant. How can I help you today?
                </div>
                <div className={`${styles.chatMessage} ${styles.chatMessageUser}`}>
                  I&apos;m interested in booking travel for an upcoming tournament.
                </div>
                <div className={`${styles.chatMessage} ${styles.chatMessageBot}`}>
                  I&apos;d be happy to help! You can start by clicking &quot;Start Booking&quot; on the homepage, or sign in to your member portal for a more personalized experience. Would you like me to guide you?
                </div>
              </div>
              <div className={styles.chatInputArea}>
                <input type="text" className={styles.chatInput} placeholder="Type your message..." />
                <button className={styles.sendBtn}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
