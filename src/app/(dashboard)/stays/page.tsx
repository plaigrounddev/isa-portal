'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search, Loader2, Star, Coffee, ShieldCheck, X } from 'lucide-react';
import { formatPrice } from '@/lib/airlines';
import styles from './Stays.module.css';

/* eslint-disable @typescript-eslint/no-explicit-any */

const POPULAR = [
    { city: 'New York', country: 'United States', code: 'US', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80', avg: 320 },
    { city: 'Paris', country: 'France', code: 'FR', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80', avg: 280 },
    { city: 'Tokyo', country: 'Japan', code: 'JP', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80', avg: 195 },
    { city: 'London', country: 'United Kingdom', code: 'GB', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80', avg: 310 },
    { city: 'Dubai', country: 'UAE', code: 'AE', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80', avg: 250 },
    { city: 'Barcelona', country: 'Spain', code: 'ES', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80', avg: 175 },
];
const QUICK = [{ l: 'Miami', c: 'US' }, { l: 'Los Angeles', c: 'US' }, { l: 'Rome', c: 'IT' }, { l: 'Amsterdam', c: 'NL' }, { l: 'Singapore', c: 'SG' }, { l: 'Cancún', c: 'MX' }];

function calcNights(a: string, b: string) { return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 864e5)); }

export default function StaysPage() {
    const router = useRouter();
    const [dest, setDest] = useState('');
    const [country, setCountry] = useState('US');
    const [checkin, setCheckin] = useState('');
    const [checkout, setCheckout] = useState('');
    const [adults, setAdults] = useState(2);
    const [rooms, setRooms] = useState(1);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);
    const [searchCity, setSearchCity] = useState('');

    const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();

    const doSearch = useCallback(async (city: string, cc: string, ci?: string, co?: string) => {
        const c = ci || checkin || (() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split('T')[0]; })();
        const o = co || checkout || (() => { const d = new Date(c); d.setDate(d.getDate() + 3); return d.toISOString().split('T')[0]; })();
        if (!checkin) setCheckin(c);
        if (!checkout) setCheckout(o);
        setLoading(true); setError(''); setResults([]); setSearched(true); setSearchCity(city);
        try {
            const res = await fetch('/api/hotels/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cityName: city, countryCode: cc, checkin: c, checkout: o, adults, rooms }) });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Search failed');
            const meta: Record<string, any> = {};
            for (const h of (json.hotels || [])) meta[h.id] = h;
            setResults((json.data || []).map((h: any) => ({ ...h, _meta: meta[h.hotelId] || {} })));
        } catch (e: any) { setError(e.message || 'Search failed'); }
        finally { setLoading(false); }
    }, [checkin, checkout, adults, rooms]);

    const handleViewRooms = (hotel: any) => {
        sessionStorage.setItem('hotel_detail', JSON.stringify(hotel));
        sessionStorage.setItem('hotel_search', JSON.stringify({ checkin, checkout, nights: checkin && checkout ? calcNights(checkin, checkout) : 2, guests: { adults }, destination: searchCity || dest }));
        router.push(`/stays/${hotel.hotelId}`);
    };

    const getInfo = (h: any) => {
        const m = h._meta || {};
        const rts = h.roomTypes || [];
        let cheapest = Infinity, cur = 'USD', hasBkf = false, hasRef = false;
        for (const rt of rts) {
            const o = rt.offerRetailRate;
            if (o?.amount < cheapest) { cheapest = o.amount; cur = o.currency || 'USD'; }
            if (rt.rates?.some((r: any) => r.boardType === 'BB' || r.boardType === 'BI')) hasBkf = true;
            if (rt.rates?.some((r: any) => r.cancellationPolicies?.refundableTag === 'RFN')) hasRef = true;
        }
        const n = checkin && checkout ? calcNights(checkin, checkout) : 1;
        return { name: m.name || h.hotelId, photo: m.main_photo || '', stars: m.rating || 0, address: m.address || '', total: cheapest === Infinity ? null : cheapest, perNight: cheapest !== Infinity ? cheapest / n : null, currency: cur, rooms: rts.length, hasBkf, hasRef, nights: n };
    };

    return (
        <div className={styles.page}>
            <div className={styles.content}>
                <div className={styles.pageHeader}><h1 className={styles.pageTitle}>Find a Stay</h1><p className={styles.pageSub}>Search hotels worldwide with real-time pricing.</p></div>

                <div className={`${styles.searchCard} ${loading ? styles.fadeOut : ''}`}>
                    <div className={styles.searchGrid}>
                        <div><label className={styles.label}>Destination</label><div className={styles.inputWrap}><MapPin size={16} className={styles.inputIcon} /><input type="text" className={styles.input} placeholder="City or hotel name" value={dest} onChange={e => setDest(e.target.value)} /></div></div>
                        <div><label className={styles.label}>Check-in</label><input type="date" className={styles.dateInput} value={checkin} min={today} onChange={e => setCheckin(e.target.value)} /></div>
                        <div><label className={styles.label}>Check-out</label><input type="date" className={styles.dateInput} value={checkout} min={checkin || today} onChange={e => setCheckout(e.target.value)} /></div>
                        <div><label className={styles.label}>Guests & Rooms</label><div className={styles.guestRow}><span>{adults} adult{adults !== 1 ? 's' : ''}, {rooms} room{rooms !== 1 ? 's' : ''}</span></div></div>
                    </div>
                    <button className={styles.searchBtn} onClick={() => doSearch(dest, country)} disabled={!dest || loading}>{loading ? <Loader2 size={18} className={styles.spin} /> : <Search size={18} />}<span>{loading ? 'Searching...' : 'Search Hotels'}</span></button>
                </div>

                {error && <div className={styles.errorBanner}><X size={16} /><span>{error}</span></div>}

                {loading && <div className={styles.skelGrid}>{[1,2,3,4,5,6].map(i => <div key={i} className={styles.skel}><div className={styles.skelImg} /><div className={styles.skelBody}><div className={styles.skelLine} style={{ width: '70%' }} /><div className={styles.skelLine} style={{ width: '50%' }} /><div className={styles.skelLine} style={{ width: '30%' }} /></div></div>)}</div>}

                {searched && !loading && !results.length && !error && <div className={styles.empty}><Search size={40} strokeWidth={1.2} /><h3>No hotels found</h3><p>Try a different destination or dates.</p></div>}

                {!loading && results.length > 0 && (
                    <div>
                        <div className={styles.resultsHeader}><h3>{results.length} hotel{results.length !== 1 ? 's' : ''} found</h3><span className={styles.resultsSub}>in {searchCity || dest}</span></div>
                        <div className={styles.hotelGrid}>
                            {results.map((h: any) => { const info = getInfo(h); return (
                                <div key={h.hotelId} className={styles.hotelCard} onClick={() => handleViewRooms(h)}>
                                    {info.photo ? <div className={styles.hotelPhoto} style={{ backgroundImage: `url(${info.photo})` }} /> : <div className={styles.hotelPhotoNone}><MapPin size={24} /></div>}
                                    <div className={styles.hotelBody}>
                                        <div className={styles.hotelTop}><h4 className={styles.hotelName}>{info.name}</h4>{info.stars > 0 && <div className={styles.starBadge}><Star size={13} /><span>{info.stars}</span></div>}</div>
                                        {info.address && <p className={styles.hotelAddr}>{info.address}</p>}
                                        <div className={styles.tags}>{info.hasBkf && <span className={styles.tag}><Coffee size={12} /> Breakfast</span>}{info.hasRef && <span className={styles.tag}><ShieldCheck size={12} /> Free cancellation</span>}</div>
                                        <div className={styles.hotelBottom}>
                                            {info.perNight !== null ? <><div className={styles.priceBlock}><span className={styles.price}>${Math.round(info.perNight)}</span><span className={styles.perNight}>/ night</span></div><span className={styles.totalLabel}>${Math.round(info.total!)} for {info.nights} night{info.nights !== 1 ? 's' : ''}</span></> : <span className={styles.noPrice}>Price unavailable</span>}
                                        </div>
                                    </div>
                                </div>
                            ); })}
                        </div>
                    </div>
                )}

                {!searched && !loading && (
                    <div className={loading ? styles.fadeOut : ''}>
                        <div><h3 className={styles.sectionTitle}>Quick Search</h3><div className={styles.chips}>{QUICK.map(c => <button key={c.l} className={styles.chip} onClick={() => { setDest(c.l); setCountry(c.c); doSearch(c.l, c.c); }}><MapPin size={14} />{c.l}</button>)}</div></div>
                        <div><h3 className={styles.sectionTitle}>Popular Destinations</h3><div className={styles.destGrid}>{POPULAR.map(d => <div key={d.city} className={styles.destCard} onClick={() => { setDest(d.city); setCountry(d.code); doSearch(d.city, d.code); }}><div className={styles.destPhoto} style={{ backgroundImage: `url(${d.image})` }} /><div className={styles.destOverlay}><h4>{d.city}</h4><span>{d.country}</span></div><div className={styles.destPrice}>from ${d.avg}/night</div></div>)}</div></div>
                        <div className={styles.trustBar}><div className={styles.trustItem}><ShieldCheck size={18} /><span>Free cancellation on most rooms</span></div><div className={styles.trustItem}><Coffee size={18} /><span>Breakfast details shown upfront</span></div><div className={styles.trustItem}><Star size={18} /><span>Verified guest ratings</span></div></div>
                    </div>
                )}
            </div>
        </div>
    );
}
