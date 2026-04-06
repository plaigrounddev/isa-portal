'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import styles from './page.module.css';
import Image from 'next/image';

const ROLE_OPTIONS = [
  { value: 'parent', label: 'Parent / Guardian', desc: 'Booking travel for your child or family' },
  { value: 'athlete', label: 'Athlete', desc: 'Traveling for tournaments and competitions' },
  { value: 'coach', label: 'Coach / Staff', desc: 'Managing travel for a team or group' },
  { value: 'team-manager', label: 'Team Manager', desc: 'Coordinating logistics for an organization' },
  { value: 'other', label: 'Other', desc: 'General travel needs' },
];

export default function Home() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const storeUser = useMutation(api.users.storeUser);

  const [view, setView] = useState<'initial' | 'signin' | 'signup'>('initial');
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Signup state
  const [signupStep, setSignupStep] = useState(1);
  const [signupData, setSignupData] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '', role: '',
  });
  const [signupError, setSignupError] = useState('');

  const [authLoading, setAuthLoading] = useState(false);
  const [signInError, setSignInError] = useState('');

  // Pending profile data to store after auth completes
  const pendingProfile = useRef<{ firstName: string; lastName: string; email: string; role: string } | null>(null);

  // When auth completes, store profile and redirect
  useEffect(() => {
    if (!isAuthenticated) return;
    const profile = pendingProfile.current;
    if (profile) {
      pendingProfile.current = null;
      storeUser(profile)
        .then(() => {
          setSignupStep(3);
          setAuthLoading(false);
        })
        .catch(() => {
          setSignupError('Profile saved, but there was an issue. Please update your profile in the portal.');
          setAuthLoading(false);
          router.push('/portal');
        });
    } else {
      // Already authenticated (returning user) — redirect
      router.push('/portal');
    }
  }, [isAuthenticated, router, storeUser]);

  const resetSignup = () => {
    setSignupStep(1);
    setSignupError('');
    setSignupData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', role: '' });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) return;
    setSignInError('');
    setAuthLoading(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      router.push('/portal');
    } catch {
      setSignInError('Invalid email or password. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGuestBooking = () => {
    router.push('/booking');
  };

  const handleSignupNext = async () => {
    if (authLoading) return;
    setSignupError('');
    if (signupStep === 1) {
      if (!signupData.firstName.trim() || !signupData.lastName.trim()) {
        setSignupError('Please enter your full name.'); return;
      }
      if (!signupData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupData.email)) {
        setSignupError('Please enter a valid email address.'); return;
      }
      if (signupData.password.length < 8) {
        setSignupError('Password must be at least 8 characters.'); return;
      }
      if (signupData.password !== signupData.confirmPassword) {
        setSignupError('Passwords do not match.'); return;
      }
      setSignupStep(2);
    } else if (signupStep === 2) {
      if (!signupData.role) {
        setSignupError('Please select your role.'); return;
      }
      setAuthLoading(true);
      try {
        // Store profile data for the useEffect to pick up after auth completes
        pendingProfile.current = {
          firstName: signupData.firstName.trim(),
          lastName: signupData.lastName.trim(),
          email: signupData.email.trim(),
          role: signupData.role,
        };
        await signIn("password", {
          email: signupData.email.trim(),
          password: signupData.password,
          name: `${signupData.firstName.trim()} ${signupData.lastName.trim()}`,
          flow: "signUp",
        });
        // Auth state change will trigger the useEffect above to call storeUser
      } catch {
        pendingProfile.current = null;
        setSignupError('Account creation failed. This email may already be registered.');
        setAuthLoading(false);
      }
    }
  };

  const renderAuthView = () => {
    if (view === 'signup') {
      return (
        <div className={styles.authContainer} style={{ animation: 'fadeIn 0.4s ease forwards', width: '100%', maxWidth: '500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
            <button onClick={() => { if (signupStep > 1) { setSignupStep(signupStep - 1); setSignupError(''); } else { resetSignup(); setView('signin'); } }} className="circle-arrow-btn" style={{ marginRight: '24px', transform: 'rotate(180deg)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
            <h2 className={styles.heroTitle} style={{ fontSize: '2.8rem', marginBottom: 0 }}>
              {signupStep === 3 ? <>YOU&apos;RE<br /><span>ALL SET</span></> : <>CREATE<br /><span>ACCOUNT</span></>}
            </h2>
          </div>

          {signupStep === 1 && (
            <div className={styles.formContainer}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>First Name</label>
                  <input type="text" className={styles.loginInput} placeholder="First name" value={signupData.firstName} onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })} />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Last Name</label>
                  <input type="text" className={styles.loginInput} placeholder="Last name" value={signupData.lastName} onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })} />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Email Address</label>
                <input type="email" className={styles.loginInput} placeholder="Enter your email" value={signupData.email} onChange={(e) => setSignupData({ ...signupData, email: e.target.value })} />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Password</label>
                <input type="password" className={styles.loginInput} placeholder="Min 8 characters" value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Confirm Password</label>
                <input type="password" className={styles.loginInput} placeholder="Re-enter your password" value={signupData.confirmPassword} onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })} />
              </div>
              {signupError && <div className={styles.authError}>{signupError}</div>}
              <button className="geometric-btn" style={{ width: '100%' }} onClick={handleSignupNext}>Continue</button>
            </div>
          )}

          {signupStep === 2 && (
            <div className={styles.formContainer}>
              <p style={{ color: '#666', marginBottom: '28px', lineHeight: 1.6 }}>What best describes your role? This helps us personalize your experience.</p>
              <div className={styles.roleGrid} role="radiogroup" aria-label="Select your role">
                {ROLE_OPTIONS.map(r => (
                  <div
                    key={r.value}
                    role="radio"
                    aria-checked={signupData.role === r.value}
                    tabIndex={0}
                    className={`${styles.roleCard} ${signupData.role === r.value ? styles.roleCardSelected : ''}`}
                    onClick={() => setSignupData({ ...signupData, role: r.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSignupData({ ...signupData, role: r.value }); } }}
                  >
                    <div className={styles.roleCardTitle}>{r.label}</div>
                    <div className={styles.roleCardDesc}>{r.desc}</div>
                    {signupData.role === r.value && (
                      <div className={styles.roleCheck}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {signupError && <div className={styles.authError}>{signupError}</div>}
              <button className="geometric-btn" style={{ width: '100%', marginTop: '8px' }} onClick={handleSignupNext}>Create My Account</button>
            </div>
          )}

          {signupStep === 3 && (
            <div className={styles.formContainer} style={{ textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(230, 57, 70, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--isa-red)" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <p style={{ color: '#666', marginBottom: '32px', lineHeight: 1.6, fontSize: '1.1rem' }}>
                Welcome to ISA Travel, <strong>{signupData.firstName}</strong>. Your portal is ready — you can now book flights, manage travelers, and coordinate your team&apos;s travel.
              </p>
              <button className="geometric-btn" style={{ width: '100%', marginBottom: '16px' }} onClick={() => router.push('/portal')}>
                Enter My Portal
              </button>
              <button className="geometric-btn geometric-btn-secondary" style={{ width: '100%' }} onClick={() => router.push('/booking')}>
                Start Booking Now
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={styles.authContainer} style={{ animation: 'fadeIn 0.4s ease forwards', width: '100%', maxWidth: '500px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
          <button onClick={() => setView('initial')} className="circle-arrow-btn" style={{ marginRight: '24px', transform: 'rotate(180deg)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
          <h2 className={styles.heroTitle} style={{ fontSize: '3rem', marginBottom: 0 }}>
            PORTAL<br /><span>ACCESS</span>
          </h2>
        </div>

        <form onSubmit={handleSignIn} className={styles.formContainer}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Email Address</label>
            <input type="email" className={styles.loginInput} placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Password</label>
            <input type="password" className={styles.loginInput} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {signInError && <div className={styles.authError}>{signInError}</div>}
          <button type="submit" className="geometric-btn" style={{ width: '100%', marginBottom: '24px' }} disabled={authLoading}>
            {authLoading ? 'Signing in...' : 'Member Sign In'}
          </button>
        </form>

        <div className={styles.divider}><span style={{ background: 'white' }}>OR</span></div>

        <button onClick={handleGuestBooking} className="geometric-btn geometric-btn-secondary" style={{ width: '100%', marginBottom: '24px' }}>
          Continue as Guest
        </button>

        <div className={styles.createAccountLink}>
          Don&apos;t have an account?{' '}
          <button onClick={() => { setView('signup'); setSignupStep(1); setSignupError(''); }} className={styles.createAccountBtn}>
            Create Account
          </button>
        </div>
      </div>
    );
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
          ) : renderAuthView()}
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
