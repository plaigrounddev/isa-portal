'use client';
import React from 'react';
import Link from 'next/link';
import { Plane, Building, PhoneCall, ArrowRight, Hotel, Car } from 'lucide-react';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
    return (
        <div className={styles.page}>
            <div className={styles.content}>
                <div className={styles.hero}>
                    <h2 className={styles.greeting}>Good morning, John.</h2>
                    <p className={styles.sub}>Where are we heading next?</p>
                    <div className={styles.actions}>
                        <Link href="/flights" className={styles.actionCard} style={{ animationDelay: '0.1s' }}>
                            <Plane size={24} /><span>Book Flight</span>
                        </Link>
                        <Link href="/stays" className={styles.actionCard} style={{ animationDelay: '0.2s' }}>
                            <Building size={24} /><span>Find Hotel</span>
                        </Link>
                        <Link href="/booking" className={styles.actionCard} style={{ animationDelay: '0.3s' }}>
                            <PhoneCall size={24} /><span>Agent Assisted</span>
                        </Link>
                    </div>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeader}><h3>Active Itineraries</h3></div>
                    <div className={styles.itinList}>
                        <div className={styles.itinItem}>
                            <div className={styles.itinIcon}><Plane size={20} /></div>
                            <div className={styles.itinDetails}>
                                <div className={styles.itinTitle}>International Pathways Tournament</div>
                                <div className={styles.itinMeta}>Frankfurt, Germany • June 12 – 18, 2026</div>
                            </div>
                            <span className={styles.badge} data-variant="success">Confirmed</span>
                            <Link href="/flights" className={styles.itinArrow}><ArrowRight size={16} /></Link>
                        </div>
                        <div className={styles.itinItem}>
                            <div className={styles.itinIcon}><Hotel size={20} /></div>
                            <div className={styles.itinDetails}>
                                <div className={styles.itinTitle}>European Youth Showcase</div>
                                <div className={styles.itinMeta}>Barcelona, Spain • July 8 – 14, 2026</div>
                            </div>
                            <span className={styles.badge} data-variant="warning">Pending</span>
                            <Link href="/stays" className={styles.itinArrow}><ArrowRight size={16} /></Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
