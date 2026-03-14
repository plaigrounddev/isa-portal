'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    LayoutGrid,
    Plane,
    Users,
    FileText,
    LogOut,
    Search,
    ArrowRight,
    PhoneCall,
    Mail,
    Phone,
    X,
    Send,
    UserPlus,
    Hotel,
    Car
} from 'lucide-react';
import styles from './portal.module.css';

export default function Portal() {
    const router = useRouter();
    const [isContactOpen, setIsContactOpen] = useState(false);

    const [activeTab, setActiveTab] = useState('overview');

    const handleSignOut = () => {
        router.push('/');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <>
                        <div className={styles.welcomeSection}>
                            <h1 className={styles.pageTitle}>Dashboard</h1>
                            <p className={styles.pageSubtitle}>Welcome back, John. You have 2 upcoming travel events.</p>
                        </div>

                        {/* Quick Actions */}
                        <div className={`${styles.card} ${styles.cardFull}`} style={{ padding: 0, background: 'transparent', border: 'none', boxShadow: 'none' }}>
                            <div className={styles.quickActionsRow}>
                                <div className={styles.quickActionCard} onClick={() => router.push('/booking')}>
                                    <Plane size={22} strokeWidth={1.5} />
                                    <span>Book Trip</span>
                                </div>
                                <div className={styles.quickActionCard} onClick={() => setIsContactOpen(true)}>
                                    <PhoneCall size={22} strokeWidth={1.5} />
                                    <span>Contact Agent</span>
                                </div>
                            </div>
                        </div>

                        {/* Itineraries */}
                        <div className={`${styles.card} ${styles.cardFull}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>Upcoming Itineraries</h2>
                                <a href="#" className={styles.viewAllLink} onClick={(e) => { e.preventDefault(); setActiveTab('itineraries'); }}>View All</a>
                            </div>
                            <div className={styles.itineraryList}>
                                <div className={styles.itineraryCard}>
                                    <div className={styles.eventDetails}>
                                        <div className={styles.eventTitle}>International Pathways Tournament</div>
                                        <div className={styles.eventLoc}>Frankfurt, Germany • June 12 – 18, 2026</div>
                                    </div>
                                    <div className={styles.serviceStatusRow}>
                                        <span className={`${styles.statusPill} ${styles.statusSuccess}`}>
                                            <Plane size={14} /> Booked
                                        </span>
                                        <span className={`${styles.statusPill} ${styles.statusPending}`}>
                                            <Hotel size={14} /> Pending
                                        </span>
                                        <span className={`${styles.statusPill} ${styles.statusSuccess}`}>
                                            <Car size={14} /> Booked
                                        </span>
                                    </div>
                                    <button className="circle-arrow-btn" style={{ width: '44px', height: '44px', flexShrink: 0 }}>
                                        <ArrowRight size={18} strokeWidth={2} />
                                    </button>
                                </div>
                                <div className={styles.itineraryCard}>
                                    <div className={styles.eventDetails}>
                                        <div className={styles.eventTitle}>European Youth Showcase</div>
                                        <div className={styles.eventLoc}>Barcelona, Spain • July 8 – 14, 2026</div>
                                    </div>
                                    <div className={styles.serviceStatusRow}>
                                        <span className={`${styles.statusPill} ${styles.statusPending}`}>
                                            <Plane size={14} /> Pending
                                        </span>
                                        <span className={`${styles.statusPill} ${styles.statusPending}`}>
                                            <Hotel size={14} /> Pending
                                        </span>
                                    </div>
                                    <button className="circle-arrow-btn" style={{ width: '44px', height: '44px', flexShrink: 0 }}>
                                        <ArrowRight size={18} strokeWidth={2} />
                                    </button>
                                </div>
                            </div>
                        </div>



                        {/* Traveler Profiles */}
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Traveler Profiles</h2>
                            <div className={styles.travelerList}>
                                <div className={styles.travelerRow}>
                                    <div className={styles.travelerAvatar}>JS</div>
                                    <div className={styles.travelerInfo}>
                                        <div className={styles.travelerName}>John Smith</div>
                                        <div className={styles.travelerRole}>Athlete</div>
                                    </div>
                                </div>
                                <div className={styles.travelerRow}>
                                    <div className={styles.travelerAvatar} style={{ background: 'rgba(52, 152, 219, 0.1)', color: '#3498db' }}>MS</div>
                                    <div className={styles.travelerInfo}>
                                        <div className={styles.travelerName}>Maria Smith</div>
                                        <div className={styles.travelerRole}>Parent</div>
                                    </div>
                                </div>
                                <button className={styles.addTravelerBtn} onClick={() => setActiveTab('travelers')}><UserPlus size={18} /> Manage Travelers</button>
                            </div>
                        </div>
                    </>
                );
            case 'itineraries':
                return (
                    <div className={styles.tabContentBlock}>
                        <div className={styles.welcomeSection}>
                            <h1 className={styles.pageTitle}>Itineraries</h1>
                            <p className={styles.pageSubtitle}>Review and manage your active and past trips.</p>
                        </div>
                        <div className={`${styles.card} ${styles.cardFull}`} style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center', color: '#888' }}>
                                <Plane size={48} strokeWidth={1} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                                <h3 style={{ fontSize: '1.25rem', color: 'var(--isa-black)', marginBottom: '8px' }}>Your trips are currently syncing</h3>
                                <p>Check back shortly for your detailed itinerary view.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'travelers':
                return (
                    <div className={styles.tabContentBlock}>
                        <div className={styles.welcomeSection}>
                            <h1 className={styles.pageTitle}>Travelers</h1>
                            <p className={styles.pageSubtitle}>Manage profiles, preferences, and details for linked travelers.</p>
                        </div>
                        <div className={`${styles.card} ${styles.cardFull}`} style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center', color: '#888' }}>
                                <Users size={48} strokeWidth={1} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                                <h3 style={{ fontSize: '1.25rem', color: 'var(--isa-black)', marginBottom: '8px' }}>Traveler Management</h3>
                                <p>This section is under active construction.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'invoices':
                return (
                    <div className={styles.tabContentBlock}>
                        <div className={styles.welcomeSection}>
                            <h1 className={styles.pageTitle}>Invoices</h1>
                            <p className={styles.pageSubtitle}>View past transactions, download receipts, and manage billing securely.</p>
                        </div>
                        <div className={`${styles.card} ${styles.cardFull}`} style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center', color: '#888' }}>
                                <FileText size={48} strokeWidth={1} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                                <h3 style={{ fontSize: '1.25rem', color: 'var(--isa-black)', marginBottom: '8px' }}>No Pending Invoices</h3>
                                <p>Your historical billing details will appear here.</p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <main className={styles.portalLayout}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarTop}>
                    <div className={styles.logo} onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
                        ISA<span>.</span>TRAVEL
                    </div>
                    <nav className={styles.nav}>
                        <button type="button" onClick={() => setActiveTab('overview')} className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`}><LayoutGrid size={20} strokeWidth={1.5} /> Overview</button>
                        <button type="button" onClick={() => setActiveTab('itineraries')} className={`${styles.navItem} ${activeTab === 'itineraries' ? styles.active : ''}`}><Plane size={20} strokeWidth={1.5} /> Itineraries</button>
                        <button type="button" onClick={() => setActiveTab('travelers')} className={`${styles.navItem} ${activeTab === 'travelers' ? styles.active : ''}`}><Users size={20} strokeWidth={1.5} /> Travelers</button>
                        <button type="button" onClick={() => setActiveTab('invoices')} className={`${styles.navItem} ${activeTab === 'invoices' ? styles.active : ''}`}><FileText size={20} strokeWidth={1.5} /> Invoices</button>
                    </nav>
                </div>

                <div className={styles.sidebarBottom}>
                    <div className={styles.userCard}>
                        <div className={styles.avatar}>JS</div>
                        <div className={styles.userInfo}>
                            <div className={styles.userName}>John Smith</div>
                            <div className={styles.userRole}>Member</div>
                        </div>
                    </div>
                    <button onClick={handleSignOut} className={styles.signOutBtn}>
                        <LogOut size={18} strokeWidth={1.5} /> Sign Out
                    </button>
                </div>
            </aside>

            <div className={styles.mainContent}>
                <header className={styles.topbar}>
                    <div className={styles.searchContainer}>
                        <div className={styles.searchIcon}><Search size={20} strokeWidth={1.5} /></div>
                        <input type="text" className={styles.searchInput} placeholder="Search itineraries, travelers..." />
                    </div>
                    <button className={styles.bookBtn}>
                        Book New Trip <ArrowRight size={18} strokeWidth={2} />
                    </button>
                </header>

                <div className={styles.dashboardGrid}>
                    {renderContent()}
                </div>
            </div>

            {isContactOpen && (
                <div className={styles.contactOverlay}>
                    <button className={styles.closeOverlayBtn} onClick={() => setIsContactOpen(false)}>
                        <X size={24} />
                    </button>

                    <div className={styles.contactLeft}>
                        <h2 className={styles.contactTitle}>Get in Touch</h2>
                        <p className={styles.contactSubtitle}>Our dedicated support team is here to help you with your travel arrangements 24/7.</p>

                        <div className={styles.contactMethodRow}>
                            <div className={styles.contactMethodIcon}>
                                <Phone size={24} />
                            </div>
                            <div className={styles.contactMethodInfo}>
                                <div className={styles.contactMethodLabel}>Global Support Phone</div>
                                <div className={styles.contactMethodValue}>+1 (800) 555-0199</div>
                            </div>
                        </div>

                        <div className={styles.contactMethodRow}>
                            <div className={styles.contactMethodIcon}>
                                <Phone size={24} />
                            </div>
                            <div className={styles.contactMethodInfo}>
                                <div className={styles.contactMethodLabel}>VIP Support Line</div>
                                <div className={styles.contactMethodValue}>+1 (800) 555-0299</div>
                            </div>
                        </div>

                        <div className={styles.contactMethodRow}>
                            <div className={styles.contactMethodIcon}>
                                <Mail size={24} />
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
                                    Hello John, I'm your AI travel assistant. How can I help you today?
                                </div>
                                <div className={`${styles.chatMessage} ${styles.chatMessageUser}`}>
                                    Hi, I need to check the status of my itinerary for Frankfurt.
                                </div>
                                <div className={`${styles.chatMessage} ${styles.chatMessageBot}`}>
                                    Your flights to Frankfurt are confirmed. The hotel booking is currently pending. Should I expedite the hotel confirmation for you or look for alternatives?
                                </div>
                            </div>
                            <div className={styles.chatInputArea}>
                                <input type="text" className={styles.chatInput} placeholder="Type your message..." />
                                <button className={styles.sendBtn}>
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
