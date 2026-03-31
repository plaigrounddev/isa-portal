'use client';
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Plane, Building, Users, FileText, LogOut, User } from 'lucide-react';
import styles from './Shell.module.css';

export function Shell({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <div className={styles.shell}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarTop}>
                    <div className={styles.logo} onClick={() => router.push('/')}>ISA<span>.</span>TRAVEL</div>
                    <nav className={styles.nav}>
                        <NavItem href="/dashboard" icon={<Home size={20} />} label="Overview" pathname={pathname} />
                        <NavItem href="/flights" icon={<Plane size={20} />} label="Flights" pathname={pathname} />
                        <NavItem href="/stays" icon={<Building size={20} />} label="Hotels" pathname={pathname} />
                        <NavItem href="/portal" icon={<Users size={20} />} label="Travelers" pathname={pathname} />
                        <NavItem href="/portal" icon={<FileText size={20} />} label="Invoices" pathname={pathname} />
                    </nav>
                </div>
                <div className={styles.sidebarBottom}>
                    <div className={styles.userCard}>
                        <div className={styles.avatar}><User size={16} /></div>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>John Smith</span>
                            <span className={styles.userRole}>Member</span>
                        </div>
                    </div>
                    <button className={styles.signOutBtn} onClick={() => router.push('/')}><LogOut size={18} /> Sign Out</button>
                </div>
            </aside>
            <main className={styles.main}>{children}</main>
        </div>
    );
}

function NavItem({ href, icon, label, pathname }: { href: string; icon: React.ReactNode; label: string; pathname: string | null }) {
    const router = useRouter();
    const active = pathname?.startsWith(href) ?? false;
    return (
        <button className={`${styles.navItem} ${active ? styles.active : ''}`} onClick={() => router.push(href)}>
            {icon}<span>{label}</span>
        </button>
    );
}
