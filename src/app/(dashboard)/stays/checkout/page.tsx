'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Check, Bed, Calendar, Moon, MapPin } from 'lucide-react';
import styles from './Checkout.module.css';

/* eslint-disable @typescript-eslint/no-explicit-any */

type Step = 'guest' | 'payment' | 'confirmation';

export default function CheckoutPage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [step, setStep] = useState<Step>('guest');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [bookLoading, setBookLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => { const s = sessionStorage.getItem('hotel_prebook'); if (s) setData(JSON.parse(s)); }, []);

    if (!data) return <div className={styles.page}><div className={styles.loading}><Loader2 size={28} className={styles.spin} /><p>Loading booking details...</p></div></div>;

    const hotelName = data.hotelName || 'Hotel';
    const hotelPhoto = data.hotelPhoto || '';
    const hotelAddress = data.hotelAddress || '';
    const roomName = data.roomName || 'Room';
    const prebookId = data.data?.prebookId || data.prebookId;
    const meta = data.searchMeta || {};
    const nights = meta.nights || 1;
    const price = data.data?.totalRate || data.data?.rate?.retailRate?.total?.[0]?.amount || null;
    const currency = data.data?.currency || 'USD';
    const perNight = price ? price / nights : null;

    const handleGuestNext = () => { if (!firstName || !lastName || !email) { setError('Please fill in all required fields.'); return; } setError(''); setStep('payment'); };

    const handleBook = async () => {
        setError(''); setBookLoading(true);
        try {
            const res = await fetch('/api/hotels/book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prebookId, guestInfo: { firstName, lastName, email }, payment: { method: 'ACC_CREDIT_CARD' } }) });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Booking failed');
            setResult(json); setStep('confirmation');
        } catch (e: any) { setError(e.message || 'Booking could not be completed.'); }
        finally { setBookLoading(false); }
    };

    return (
        <div className={styles.page}><div className={styles.content}>
            {step !== 'confirmation' && <button className={styles.backBtn} onClick={() => step === 'payment' ? setStep('guest') : router.back()}><ArrowLeft size={18} /><span>{step === 'payment' ? 'Back to guest details' : 'Back to hotel'}</span></button>}

            <div className={styles.progress}>
                <div className={`${styles.progressLine} ${['guest','payment','confirmation'].includes(step) ? styles.active : ''}`} />
                <div className={`${styles.progressLine} ${['payment','confirmation'].includes(step) ? styles.active : ''}`} />
                <div className={`${styles.progressLine} ${step === 'confirmation' ? styles.active : ''}`} />
            </div>

            <div className={styles.layout}>
                <div className={styles.mainCol}>
                    {step === 'guest' && (
                        <div className={styles.stepSection}>
                            <h2 className={styles.stepTitle}>Guest Information</h2>
                            <p className={styles.stepSub}>Enter the details for the primary guest.</p>
                            <div className={styles.formGrid}>
                                <div className={styles.inputGroup}><label>First Name *</label><input type="text" placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} className={styles.formInput} /></div>
                                <div className={styles.inputGroup}><label>Last Name *</label><input type="text" placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} className={styles.formInput} /></div>
                                <div className={styles.inputGroup}><label>Email Address *</label><input type="email" placeholder="john@example.com" value={email} onChange={e => setEmail(e.target.value)} className={styles.formInput} /></div>
                                <div className={styles.inputGroup}><label>Phone</label><input type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} className={styles.formInput} /></div>
                            </div>
                            {error && <p className={styles.errorText}>{error}</p>}
                            <div className={styles.stepActions}><button className={styles.primaryBtn} onClick={handleGuestNext}>Continue to Payment</button></div>
                        </div>
                    )}

                    {step === 'payment' && (
                        <div className={styles.stepSection}>
                            <h2 className={styles.stepTitle}>Review & Pay</h2>
                            <p className={styles.stepSub}>Confirm your details — sandbox mode, no real charge.</p>
                            <div className={styles.sandbox}><Check size={16} /><span>Sandbox — payment simulated</span></div>
                            <div className={styles.reviewBlock}>
                                <div className={styles.reviewRow}><span>Guest</span><strong>{firstName} {lastName}</strong></div>
                                <div className={styles.reviewRow}><span>Email</span><strong>{email}</strong></div>
                                {phone && <div className={styles.reviewRow}><span>Phone</span><strong>{phone}</strong></div>}
                                <div className={styles.reviewRow}><span>Hotel</span><strong>{hotelName}</strong></div>
                                <div className={styles.reviewRow}><span>Room</span><strong>{roomName}</strong></div>
                                {meta.checkin && <div className={styles.reviewRow}><span>Stay</span><strong>{meta.checkin} → {meta.checkout} ({nights}n)</strong></div>}
                            </div>
                            {error && <p className={styles.errorText}>{error}</p>}
                            <div className={styles.stepActions}>
                                <button className={styles.outlineBtn} onClick={() => setStep('guest')}>Previous</button>
                                <button className={styles.primaryBtn} onClick={handleBook} disabled={bookLoading}>{bookLoading ? <><Loader2 size={16} className={styles.spin} /> Booking...</> : 'Complete Booking'}</button>
                            </div>
                        </div>
                    )}

                    {step === 'confirmation' && (
                        <div className={styles.stepSection}>
                            <div className={styles.confirmHero}>
                                <div className={styles.successIcon}><Check size={32} /></div>
                                <h2 className={styles.confirmTitle}>Booking Confirmed</h2>
                                <p className={styles.confirmSub}>Your reservation at <strong>{hotelName}</strong> has been confirmed.{email && <> Confirmation sent to <strong>{email}</strong>.</>}</p>
                            </div>
                            {result && (
                                <div className={styles.reviewBlock}>
                                    {result.data?.bookingId && <div className={styles.reviewRow}><span>Booking ID</span><strong>{result.data.bookingId}</strong></div>}
                                    <div className={styles.reviewRow}><span>Hotel</span><strong>{hotelName}</strong></div>
                                    <div className={styles.reviewRow}><span>Room</span><strong>{roomName}</strong></div>
                                    <div className={styles.reviewRow}><span>Guest</span><strong>{firstName} {lastName}</strong></div>
                                    {meta.checkin && <div className={styles.reviewRow}><span>Dates</span><strong>{meta.checkin} → {meta.checkout}</strong></div>}
                                </div>
                            )}
                            <div className={styles.stepActions}><button className={styles.primaryBtn} onClick={() => router.push('/stays')}>Back to Hotels</button></div>
                        </div>
                    )}
                </div>

                {step !== 'confirmation' && (
                    <div className={styles.summaryCol}>
                        <div className={styles.summaryCard}>
                            {hotelPhoto && <div className={styles.summaryPhoto} style={{ backgroundImage: `url(${hotelPhoto})` }} />}
                            <div className={styles.summaryBody}>
                                <h4 className={styles.summaryHotel}>{hotelName}</h4>
                                {hotelAddress && <p className={styles.summaryAddr}><MapPin size={13} /> {hotelAddress}</p>}
                                <p className={styles.summaryRoom}><Bed size={13} /> {roomName}</p>
                                {meta.checkin && <div className={styles.summaryDates}><div className={styles.summaryDateRow}><Calendar size={13} /><span>{meta.checkin} → {meta.checkout}</span></div><div className={styles.summaryDateRow}><Moon size={13} /><span>{nights} night{nights !== 1 ? 's' : ''}</span></div></div>}
                                {price && <div className={styles.summaryPrice}><div className={styles.summaryPriceRow}><span>{perNight ? `$${Math.round(perNight)} × ${nights} night${nights > 1 ? 's' : ''}` : 'Total'}</span><strong>${Number(price).toFixed(2)}</strong></div><div className={styles.summaryTotal}><span>Total</span><strong>{currency === 'USD' ? '$' : currency}{Number(price).toFixed(2)}</strong></div></div>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div></div>
    );
}
