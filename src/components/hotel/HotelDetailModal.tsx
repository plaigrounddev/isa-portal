'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, Star, MapPin, Coffee, ShieldCheck, Wifi, Car, Loader2, ChevronLeft, ChevronRight, Users, Bed, Info } from 'lucide-react';
import styles from './HotelDetailModal.module.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HotelData = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReviewData = Record<string, any>;

interface RoomRate {
    offerId: string;
    rateId: string;
    roomName: string;
    maxOccupancy: number;
    boardType: string;
    boardName: string;
    price: number;
    currency: string;
    refundable: boolean;
    cancelDeadline: string;
    remarks: string;
}

interface SavedTraveler {
    id: string; firstName: string; lastName: string; email: string; phone: string;
}

interface Props {
    hotelId: string;
    hotelName: string;
    hotelImage: string;
    hotelStars: number;
    hotelAddress: string;
    checkin: string;
    checkout: string;
    rates: RoomRate[];
    onClose: () => void;
    onSelectRate?: (rate: RoomRate) => void;
    enableCheckout?: boolean;
    onBookingComplete?: (bookingData: { hotelName: string; checkin: string; checkout: string; price: number; currency: string; roomName: string }) => void;
}

export function HotelDetailModal({ hotelId, hotelName, hotelImage, hotelStars, hotelAddress, checkin, checkout, rates, onClose, onSelectRate, enableCheckout = false, onBookingComplete }: Props) {
    const [activeTab, setActiveTab] = useState<'rooms' | 'photos' | 'amenities' | 'reviews'>('rooms');

    // Checkout state
    const [selectedRate, setSelectedRate] = useState<RoomRate | null>(null);
    const [checkoutStep, setCheckoutStep] = useState<'select' | 'guest' | 'processing' | 'success' | 'error'>('select');
    const [guestFirstName, setGuestFirstName] = useState('');
    const [guestLastName, setGuestLastName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [savedTravelers, setSavedTravelers] = useState<SavedTraveler[]>([]);
    const [bookingError, setBookingError] = useState('');
    const [bookingId, setBookingId] = useState('');

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const raw = localStorage.getItem('isa_travelers');
            if (raw) setSavedTravelers(JSON.parse(raw));
        } catch { /* */ }
    }, []);
    const [hotelDetail, setHotelDetail] = useState<HotelData | null>(null);
    const [reviews, setReviews] = useState<ReviewData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [photoIndex, setPhotoIndex] = useState(0);

    const fetchDetail = useCallback(async () => {
        setIsLoading(true);
        try {
            const [detailRes, reviewsRes] = await Promise.all([
                fetch(`/api/hotels/detail?hotelId=${encodeURIComponent(hotelId)}`),
                fetch(`/api/hotels/reviews?hotelId=${encodeURIComponent(hotelId)}&limit=10`),
            ]);

            if (detailRes.ok) {
                const d = await detailRes.json();
                setHotelDetail(d.data ?? d);
            }
            if (reviewsRes.ok) {
                const r = await reviewsRes.json();
                setReviews(r.data ?? []);
            }
        } catch { /* silent */ }
        setIsLoading(false);
    }, [hotelId]);

    useEffect(() => { fetchDetail(); }, [fetchDetail]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleEsc);
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', handleEsc); document.body.style.overflow = ''; };
    }, [onClose]);

    const photos: { url: string; caption: string }[] = hotelDetail?.hotelImages?.map((img: HotelData) => ({
        url: img.urlHd || img.url || '',
        caption: img.caption || '',
    })).filter((p: { url: string }) => p.url) ?? [];

    if (hotelImage && photos.length === 0) photos.push({ url: hotelImage, caption: '' });

    const facilities: string[] = hotelDetail?.hotelFacilities ?? [];
    const description: string = hotelDetail?.hotelDescription ?? '';
    const rooms = hotelDetail?.rooms ?? [];

    const nights = (() => {
        if (!checkin || !checkout) return 1;
        const a = new Date(checkin), b = new Date(checkout);
        return Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
    })();

    const handleSelectRoom = (rate: RoomRate) => {
        if (enableCheckout) {
            setSelectedRate(rate);
            setCheckoutStep('guest');
        } else if (onSelectRate) {
            onSelectRate(rate);
        }
    };

    const handleConfirmBooking = async () => {
        if (!selectedRate || !guestFirstName.trim() || !guestLastName.trim() || !guestEmail.trim()) return;
        setCheckoutStep('processing');
        setBookingError('');

        try {
            const prebookRes = await fetch('/api/hotels/prebook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ offerId: selectedRate.offerId }),
            });
            const prebookData = await prebookRes.json();
            if (!prebookRes.ok) throw new Error(prebookData.error || 'Prebook failed');

            const prebookId = prebookData.data?.prebookId ?? prebookData.prebookId ?? '';
            if (!prebookId) throw new Error('Could not get prebook ID');

            const bookRes = await fetch('/api/hotels/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prebookId,
                    guestInfo: { firstName: guestFirstName.trim(), lastName: guestLastName.trim(), email: guestEmail.trim() },
                    payment: { method: 'ACC_CREDIT_CARD' },
                }),
            });
            const bookData = await bookRes.json();
            if (!bookRes.ok) throw new Error(bookData.error || 'Booking failed');

            setBookingId(bookData.data?.bookingId ?? '');
            setCheckoutStep('success');

            if (onBookingComplete) {
                onBookingComplete({
                    hotelName,
                    checkin, checkout,
                    price: selectedRate.price,
                    currency: selectedRate.currency,
                    roomName: selectedRate.roomName,
                });
            }
        } catch (err) {
            setBookingError(err instanceof Error ? err.message : 'Booking failed');
            setCheckoutStep('error');
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerImage} style={{ backgroundImage: photos[0] ? `url(${photos[0].url})` : undefined }}>
                        {!photos[0] && <MapPin size={48} style={{ opacity: 0.2 }} />}
                        <div className={styles.headerOverlay}>
                            <h2 className={styles.hotelName}>{hotelName}</h2>
                            <div className={styles.headerMeta}>
                                {hotelStars > 0 && <span className={styles.stars}><Star size={14} fill="currentColor" /> {hotelStars}</span>}
                                {hotelAddress && <span className={styles.address}><MapPin size={14} /> {hotelAddress}</span>}
                            </div>
                            {checkin && checkout && (
                                <div className={styles.dates}>{new Date(checkin + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(checkout + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {nights} night{nights !== 1 ? 's' : ''}</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    {(['rooms', 'photos', 'amenities', 'reviews'] as const).map(tab => (
                        <button key={tab} className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`} onClick={() => setActiveTab(tab)}>
                            {tab === 'rooms' && `Rooms${rates.length > 0 ? ` (${rates.length})` : ''}`}
                            {tab === 'photos' && `Photos${photos.length > 0 ? ` (${photos.length})` : ''}`}
                            {tab === 'amenities' && 'Amenities'}
                            {tab === 'reviews' && `Reviews${reviews.length > 0 ? ` (${reviews.length})` : ''}`}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {isLoading && activeTab !== 'rooms' && (
                        <div className={styles.loadingState}><Loader2 size={32} className={styles.spinner} /></div>
                    )}

                    {/* ROOMS TAB */}
                    {activeTab === 'rooms' && (
                        <div className={styles.roomsList}>
                            {rates.length === 0 ? (
                                <div className={styles.emptyState}><Bed size={32} /><p>No rooms available for these dates.</p></div>
                            ) : rates.map((rate, i) => (
                                <div key={`${rate.offerId}-${rate.rateId || i}`} className={styles.roomCard}>
                                    <div className={styles.roomInfo}>
                                        <h4 className={styles.roomName}>{rate.roomName}</h4>
                                        <div className={styles.roomMeta}>
                                            {rate.maxOccupancy > 0 && <span><Users size={13} /> Up to {rate.maxOccupancy}</span>}
                                            <span>{rate.boardName || rate.boardType || 'Room Only'}</span>
                                        </div>
                                        <div className={styles.roomTags}>
                                            {rate.boardType === 'BB' || rate.boardType === 'BI' ? <span className={styles.roomTag}><Coffee size={12} /> Breakfast</span> : null}
                                            {rate.refundable && <span className={styles.roomTagGreen}><ShieldCheck size={12} /> Free cancellation</span>}
                                        </div>
                                        {rate.remarks && <div className={styles.roomRemarks} dangerouslySetInnerHTML={{ __html: rate.remarks.substring(0, 200) }} />}
                                    </div>
                                    <div className={styles.roomPrice}>
                                        <span className={styles.priceValue}>${rate.price.toFixed(0)}</span>
                                        <span className={styles.priceLabel}>{nights > 1 ? `${nights} nights` : 'per night'}</span>
                                        <button className={styles.selectBtn} onClick={() => handleSelectRoom(rate)}>Select Room</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* PHOTOS TAB */}
                    {activeTab === 'photos' && !isLoading && (
                        photos.length === 0 ? (
                            <div className={styles.emptyState}><Info size={32} /><p>No photos available.</p></div>
                        ) : (
                            <div className={styles.gallery}>
                                <div className={styles.galleryMain}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={photos[photoIndex]?.url} alt={photos[photoIndex]?.caption || hotelName} className={styles.galleryImage} />
                                    {photos.length > 1 && (
                                        <>
                                            <button className={`${styles.galleryNav} ${styles.galleryPrev}`} onClick={() => setPhotoIndex((photoIndex - 1 + photos.length) % photos.length)}><ChevronLeft size={24} /></button>
                                            <button className={`${styles.galleryNav} ${styles.galleryNext}`} onClick={() => setPhotoIndex((photoIndex + 1) % photos.length)}><ChevronRight size={24} /></button>
                                        </>
                                    )}
                                    <span className={styles.galleryCounter}>{photoIndex + 1} / {photos.length}</span>
                                </div>
                                {photos.length > 1 && (
                                    <div className={styles.galleryThumbs}>
                                        {photos.slice(0, 12).map((p, i) => (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img key={i} src={p.url} alt="" className={`${styles.galleryThumb} ${i === photoIndex ? styles.galleryThumbActive : ''}`} onClick={() => setPhotoIndex(i)} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    )}

                    {/* AMENITIES TAB */}
                    {activeTab === 'amenities' && !isLoading && (
                        <div className={styles.amenitiesSection}>
                            {description && (
                                <div className={styles.descriptionBlock}>
                                    <h4>About This Hotel</h4>
                                    <div className={styles.descriptionText} dangerouslySetInnerHTML={{ __html: description }} />
                                </div>
                            )}
                            {facilities.length > 0 ? (
                                <div className={styles.facilitiesGrid}>
                                    {facilities.map((f, i) => (
                                        <span key={i} className={styles.facilityChip}>
                                            {f.toLowerCase().includes('wifi') || f.toLowerCase().includes('internet') ? <Wifi size={13} /> :
                                             f.toLowerCase().includes('parking') ? <Car size={13} /> :
                                             f.toLowerCase().includes('pet') ? <Info size={13} /> : null}
                                            {f}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyState}><Info size={32} /><p>No amenity details available.</p></div>
                            )}
                            {rooms.length > 0 && (
                                <div className={styles.roomTypesSection}>
                                    <h4>Room Types</h4>
                                    <div className={styles.roomTypesGrid}>
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {rooms.slice(0, 6).map((room: any, i: number) => (
                                            <div key={i} className={styles.roomTypeCard}>
                                                {room.photos?.[0]?.url && (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={room.photos[0].url} alt={room.roomName} className={styles.roomTypeImage} />
                                                )}
                                                <div className={styles.roomTypeInfo}>
                                                    <h5>{room.roomName}</h5>
                                                    {room.maxOccupancy > 0 && <span>Max {room.maxOccupancy} guests</span>}
                                                    {room.roomSizeSquare > 0 && <span>{room.roomSizeSquare} {room.roomSizeUnit || 'm²'}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* REVIEWS TAB */}
                    {activeTab === 'reviews' && !isLoading && (
                        reviews.length === 0 ? (
                            <div className={styles.emptyState}><Star size={32} /><p>No reviews yet.</p></div>
                        ) : (
                            <div className={styles.reviewsList}>
                                {reviews.map((r, i) => (
                                    <div key={i} className={styles.reviewCard}>
                                        <div className={styles.reviewHeader}>
                                            <div className={styles.reviewAvatar}>{(r.name?.[0] || '?').toUpperCase()}</div>
                                            <div>
                                                <div className={styles.reviewName}>{r.name || 'Guest'}</div>
                                                <div className={styles.reviewDate}>{r.date ? new Date(r.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}</div>
                                            </div>
                                            {r.averageScore > 0 && <span className={styles.reviewScore}>{r.averageScore}/10</span>}
                                        </div>
                                        {r.headline && <div className={styles.reviewHeadline}>{r.headline}</div>}
                                        {r.pros && <div className={styles.reviewPros}>+ {r.pros}</div>}
                                        {r.cons && <div className={styles.reviewCons}>− {r.cons}</div>}
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>

                {/* Checkout Overlay */}
                {enableCheckout && checkoutStep !== 'select' && (
                    <div className={styles.checkoutOverlay}>
                        {checkoutStep === 'guest' && selectedRate && (
                            <div className={styles.checkoutContent}>
                                <button className={styles.checkoutBack} onClick={() => setCheckoutStep('select')}>
                                    ← Back to rooms
                                </button>
                                <h3 className={styles.checkoutTitle}>Complete Your Booking</h3>
                                <div className={styles.checkoutSummary}>
                                    <div className={styles.checkoutHotel}>{hotelName}</div>
                                    <div className={styles.checkoutRoom}>{selectedRate.roomName} · {selectedRate.boardName}</div>
                                    <div className={styles.checkoutDates}>
                                        {new Date(checkin + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(checkout + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {nights} night{nights !== 1 ? 's' : ''}
                                    </div>
                                    <div className={styles.checkoutPrice}>${selectedRate.price.toFixed(2)} {selectedRate.currency}</div>
                                </div>

                                {savedTravelers.length > 0 && !guestFirstName && (
                                    <div className={styles.checkoutTravelers}>
                                        <label className={styles.checkoutLabel}>Select a Traveler</label>
                                        <div className={styles.checkoutTravelerChips}>
                                            {savedTravelers.map(t => (
                                                <button key={t.id} className={styles.checkoutTravelerChip} onClick={() => { setGuestFirstName(t.firstName); setGuestLastName(t.lastName); setGuestEmail(t.email); }}>
                                                    {t.firstName} {t.lastName}
                                                </button>
                                            ))}
                                        </div>
                                        <div className={styles.checkoutDivider}><span>or enter manually</span></div>
                                    </div>
                                )}

                                <div className={styles.checkoutForm}>
                                    <div className={styles.checkoutRow}>
                                        <div className={styles.checkoutField}>
                                            <label className={styles.checkoutLabel}>First Name</label>
                                            <input type="text" className={styles.checkoutInput} value={guestFirstName} onChange={(e) => setGuestFirstName(e.target.value)} placeholder="First name" />
                                        </div>
                                        <div className={styles.checkoutField}>
                                            <label className={styles.checkoutLabel}>Last Name</label>
                                            <input type="text" className={styles.checkoutInput} value={guestLastName} onChange={(e) => setGuestLastName(e.target.value)} placeholder="Last name" />
                                        </div>
                                    </div>
                                    <div className={styles.checkoutField}>
                                        <label className={styles.checkoutLabel}>Email</label>
                                        <input type="email" className={styles.checkoutInput} value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="email@example.com" />
                                    </div>
                                </div>

                                <button
                                    className={styles.confirmBtn}
                                    onClick={handleConfirmBooking}
                                    disabled={!guestFirstName.trim() || !guestLastName.trim() || !guestEmail.trim()}
                                    style={{ opacity: (guestFirstName.trim() && guestLastName.trim() && guestEmail.trim()) ? 1 : 0.5 }}
                                >
                                    Confirm Booking · ${selectedRate.price.toFixed(0)}
                                </button>
                            </div>
                        )}

                        {checkoutStep === 'processing' && (
                            <div className={styles.checkoutCenter}>
                                <Loader2 size={40} className={styles.spinner} />
                                <h3>Confirming your reservation...</h3>
                                <p>Please wait while we secure your room.</p>
                            </div>
                        )}

                        {checkoutStep === 'success' && (
                            <div className={styles.checkoutCenter}>
                                <div className={styles.successIcon}>
                                    <ShieldCheck size={32} />
                                </div>
                                <h3>Booking Confirmed!</h3>
                                <p>{hotelName} — {selectedRate?.roomName}</p>
                                {bookingId && <p className={styles.bookingRef}>Ref: {bookingId}</p>}
                                <button className={styles.confirmBtn} onClick={onClose} style={{ marginTop: '20px' }}>Done</button>
                            </div>
                        )}

                        {checkoutStep === 'error' && (
                            <div className={styles.checkoutCenter}>
                                <div className={styles.errorIcon}><X size={32} /></div>
                                <h3>Booking Failed</h3>
                                <p>{bookingError || 'Something went wrong. Please try again.'}</p>
                                <button className={styles.confirmBtn} onClick={() => setCheckoutStep('guest')} style={{ marginTop: '20px' }}>Try Again</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
