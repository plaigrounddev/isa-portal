'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Star, Coffee, ShieldCheck, Users, Loader2, Bed, MapPin, Calendar, Moon } from 'lucide-react';
import styles from './HotelDetail.module.css';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function HotelDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [hotel, setHotel] = useState<any>(null);
    const [search, setSearch] = useState<any>(null);
    const [prebookLoading, setPrebookLoading] = useState<string | null>(null);

    useEffect(() => {
        const h = sessionStorage.getItem('hotel_detail');
        const s = sessionStorage.getItem('hotel_search');
        if (h) setHotel(JSON.parse(h));
        if (s) setSearch(JSON.parse(s));
    }, [params]);

    if (!hotel) return (
        <div className={styles.page}><div className={styles.loading}><Loader2 size={28} className={styles.spin} /><p>Loading hotel details...</p></div></div>
    );

    const m = hotel._meta || hotel.hotelMeta || {};
    const name = m.name || hotel.hotelId;
    const photo = m.main_photo || '';
    const stars = m.rating || 0;
    const address = m.address || '';
    const roomTypes = hotel.roomTypes || [];
    const nights = search?.nights || 1;

    const handleBook = async (rt: any) => {
        if (!rt.offerId) return;
        setPrebookLoading(rt.roomTypeId);
        try {
            const res = await fetch('/api/hotels/prebook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ offerId: rt.offerId }) });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Prebook failed');
            sessionStorage.setItem('hotel_prebook', JSON.stringify({ ...json, hotelName: name, hotelPhoto: photo, hotelAddress: address, roomName: rt.rates?.[0]?.name || rt.name || 'Room', offerId: rt.offerId, searchMeta: search }));
            router.push('/stays/checkout');
        } catch (e: any) { alert(e.message || 'Could not prebook.'); }
        finally { setPrebookLoading(null); }
    };

    const valid = roomTypes.filter((rt: any) => rt.rates?.some((r: any) => r.rateId && r.name) || rt.offerRetailRate);

    return (
        <div className={styles.page}>
            <div className={styles.content}>
                <button className={styles.backBtn} onClick={() => router.back()}><ArrowLeft size={18} /><span>Back to results</span></button>

                <div className={styles.hero}>
                    {photo ? <div className={styles.heroPhoto} style={{ backgroundImage: `url(${photo})` }} /> : <div className={styles.heroPhotoNone}><Bed size={32} /></div>}
                    <div className={styles.heroInfo}>
                        <div className={styles.heroTop}>
                            <div>
                                <h1 className={styles.hotelName}>{name}</h1>
                                {address && <p className={styles.hotelAddr}><MapPin size={14} />{address}</p>}
                            </div>
                            {stars > 0 && <div className={styles.starBadge}><Star size={14} /><span>{stars}</span></div>}
                        </div>
                        {search && (
                            <div className={styles.stayCard}>
                                <div className={styles.stayItem}><Calendar size={15} /><div><span className={styles.stayLabel}>Check-in</span><strong>{search.checkin}</strong></div></div>
                                <div className={styles.stayDiv} />
                                <div className={styles.stayItem}><Calendar size={15} /><div><span className={styles.stayLabel}>Check-out</span><strong>{search.checkout}</strong></div></div>
                                <div className={styles.stayDiv} />
                                <div className={styles.stayItem}><Moon size={15} /><div><span className={styles.stayLabel}>Duration</span><strong>{nights} night{nights !== 1 ? 's' : ''}</strong></div></div>
                                <div className={styles.stayDiv} />
                                <div className={styles.stayItem}><Users size={15} /><div><span className={styles.stayLabel}>Guests</span><strong>{search.guests?.adults || 2} adult{(search.guests?.adults || 2) !== 1 ? 's' : ''}</strong></div></div>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.roomsSection}>
                    <h2 className={styles.sectionTitle}>Available Rooms <span className={styles.sectionCount}>{valid.length} options</span></h2>
                    <div className={styles.roomList}>
                        {valid.map((rt: any) => {
                            const rate = rt.rates?.find((r: any) => r.rateId && r.name) || rt.rates?.[0];
                            const rn = rate?.name || rt.name || 'Room';
                            const board = rate?.boardName || '';
                            const refundable = rate?.cancellationPolicies?.refundableTag === 'RFN';
                            const maxOcc = rate?.maxOccupancy;
                            const offer = rt.offerRetailRate;
                            let total: number | null = null, cur = 'USD';
                            if (offer) { total = typeof offer === 'object' && !Array.isArray(offer) ? offer.amount : Array.isArray(offer) ? offer[0]?.amount : null; cur = typeof offer === 'object' && !Array.isArray(offer) ? offer.currency || 'USD' : 'USD'; }
                            const pn = total !== null ? total / nights : null;
                            const hasBkf = rate?.boardType === 'BB' || rate?.boardType === 'BI' || board?.toLowerCase().includes('breakfast');

                            return (
                                <div key={rt.roomTypeId} className={styles.roomCard}>
                                    <div className={styles.roomInfo}>
                                        <h3 className={styles.roomName}>{rn}</h3>
                                        <div className={styles.roomMeta}>
                                            {board && <span className={`${styles.metaTag} ${hasBkf ? styles.metaHighlight : ''}`}><Coffee size={13} /> {board}</span>}
                                            {maxOcc && <span className={styles.metaTag}><Users size={13} /> Sleeps {maxOcc}</span>}
                                            <span className={styles.metaTag}><Bed size={13} /> 1 King or 2 Twin</span>
                                        </div>
                                        <div className={styles.roomBadges}>
                                            {refundable ? <span className={styles.badgeGreen}><ShieldCheck size={12} /> Free cancellation</span> : <span className={styles.badgeYellow}>Non-refundable</span>}
                                        </div>
                                    </div>
                                    <div className={styles.roomActions}>
                                        {pn !== null && <div className={styles.roomPrice}><span className={styles.priceAmt}>${Math.round(pn)}</span><span className={styles.pricePer}>/ night</span></div>}
                                        {total !== null && <span className={styles.totalLabel}>${Math.round(total)} for {nights} night{nights !== 1 ? 's' : ''}</span>}
                                        <button className={styles.selectBtn} onClick={() => handleBook(rt)} disabled={prebookLoading === rt.roomTypeId || !rt.offerId}>
                                            {prebookLoading === rt.roomTypeId ? <><Loader2 size={16} className={styles.spin} /> Checking...</> : 'Select & Book'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
