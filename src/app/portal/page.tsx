'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
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
    Car,
    Loader2,
    MapPin,
    Star,
    Coffee,
    ShieldCheck,
} from 'lucide-react';
import { searchAirports, getAirportInfo, getAirlineLogo, getAirlineInfo, formatPrice, type AirportInfo } from '@/lib/airlines';
import { HotelDetailModal } from '@/components/hotel/HotelDetailModal';
import styles from './portal.module.css';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ParsedSegment {
    carrier: string;
    carrierName: string;
    flightNumber: string;
    from: string;
    to: string;
    departTime: string;
    arriveTime: string;
    departDate: string;
    arriveDate: string;
    cabin: string;
}

interface ParsedLeg {
    segments: ParsedSegment[];
    departAirport: string;
    arriveAirport: string;
    departTime: string;
    arriveTime: string;
    departDate: string;
    arriveDate: string;
    duration: string;
    stops: number;
    carrier: string;
    carrierName: string;
}

interface ParsedFlight {
    id: string;
    reviewKey: string;
    outbound: ParsedLeg;
    inbound?: ParsedLeg;
    price: number;
    currency: string;
    carrier: string;
    carrierName: string;
    carrierLogo: string;
}

interface ParsedHotel {
    hotelId: string;
    name: string;
    stars: number;
    address: string;
    image: string;
    offerId: string;
    roomName: string;
    price: number;
    currency: string;
    boardType: string;
    hasBreakfast: boolean;
    hasRefundable: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARSERS
// ═══════════════════════════════════════════════════════════════════════════════

function parseFareNexusResponse(data: Record<string, unknown>): ParsedFlight[] {
    const flights: ParsedFlight[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseArr = data.response as any[];
    if (!Array.isArray(responseArr) || responseArr.length === 0) {
        // Fallback to legacy format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const itineraries: any[] =
            (data.pricedItineraries as unknown[]) ??
            (data.data as { pricedItineraries?: unknown[] })?.pricedItineraries ??
            (data.results as unknown[]) ??
            (data.offers as unknown[]) ??
            [];
        return parseLegacyFlights(itineraries);
    }

    const status = responseArr[0]?.status as Record<string, unknown> | undefined;
    if (status && status.type === 'ERROR') return flights;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itineraries = responseArr[0]?.sliceItinerary as any[];
    if (!Array.isArray(itineraries)) return flights;

    for (let i = 0; i < itineraries.length; i++) {
        const itin = itineraries[i];
        const reviewKey = (itin.reviewKey as string) || '';

        const pricingInfo = itin.pricingInfo as Record<string, unknown> | undefined;
        const price = parseFloat(String(pricingInfo?.totalPrice ?? '0'));
        const currency = (pricingInfo?.currencyCode as string) || 'CAD';
        const pricingMeta = pricingInfo?.metaData as Record<string, unknown> | undefined;
        const validatingCarrier = (pricingMeta?.validatingCarrier as string) || '';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const originDestInfoArr = itin.originDestinationInfo as any[];
        const parsedLegs: ParsedLeg[] = [];

        if (Array.isArray(originDestInfoArr)) {
            for (const odi of originDestInfoArr) {
                const legSegments: ParsedSegment[] = [];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const flightSegs = odi.flightSegmentInfo as any[];

                if (Array.isArray(flightSegs)) {
                    for (const seg of flightSegs) {
                        const departure = seg.departure as Record<string, unknown> | undefined;
                        const arrival = seg.arrival as Record<string, unknown> | undefined;
                        const mc = seg.marketingCarrier as Record<string, unknown> | undefined;
                        const depDT = (seg.departureDateTime as string) || '';
                        const arrDT = (seg.arrivalDateTime as string) || '';

                        legSegments.push({
                            carrier: (mc?.code as string) || '',
                            carrierName: (mc?.name as string) || '',
                            flightNumber: String(seg.flightNumber ?? ''),
                            from: (departure?.airportCode as string) || '',
                            to: (arrival?.airportCode as string) || '',
                            departTime: depDT.split('T')[1]?.slice(0, 5) || '',
                            arriveTime: arrDT.split('T')[1]?.slice(0, 5) || '',
                            departDate: depDT.split('T')[0] || '',
                            arriveDate: arrDT.split('T')[0] || '',
                            cabin: ((seg.cabin as Record<string, unknown>)?.cabinName as string) || 'Economy',
                        });
                    }
                }

                if (legSegments.length === 0) continue;
                const first = legSegments[0];
                const last = legSegments[legSegments.length - 1];
                const boundDuration = parseInt(String(odi.boundDuration ?? '0'));

                parsedLegs.push({
                    segments: legSegments,
                    departAirport: first.from,
                    arriveAirport: last.to,
                    departTime: first.departTime,
                    arriveTime: last.arriveTime,
                    departDate: first.departDate,
                    arriveDate: last.arriveDate,
                    duration: boundDuration > 0 ? `${Math.floor(boundDuration / 60)}h ${boundDuration % 60}m` : `${legSegments.length} seg`,
                    stops: Math.max(0, legSegments.length - 1),
                    carrier: first.carrier,
                    carrierName: first.carrierName,
                });
            }
        }

        if (parsedLegs.length === 0) continue;
        const mainCarrier = validatingCarrier || parsedLegs[0].carrier;
        const mainInfo = getAirlineInfo(mainCarrier);

        flights.push({
            id: `flight-${i}`,
            reviewKey,
            outbound: parsedLegs[0],
            inbound: parsedLegs.length > 1 ? parsedLegs[1] : undefined,
            price,
            currency,
            carrier: mainCarrier,
            carrierName: mainInfo.name,
            carrierLogo: getAirlineLogo(mainCarrier, 30),
        });
    }

    return flights.sort((a, b) => a.price - b.price);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLegacyFlights(itineraries: any[]): ParsedFlight[] {
    const flights: ParsedFlight[] = [];
    if (!Array.isArray(itineraries)) return flights;

    for (let i = 0; i < itineraries.length; i++) {
        const itin = itineraries[i];
        if (!itin) continue;
        const reviewKey = itin.reviewKey ?? itin.review_key ?? '';
        if (!reviewKey) continue;

        const fare = itin.fare ?? itin.airItineraryPricingInfo ?? itin.pricing ?? {};
        const totalFare = fare.totalFare ?? fare.total ?? fare;
        let price = parseFloat(totalFare?.amount ?? totalFare?.totalPrice ?? totalFare?.price ?? itin.totalPrice ?? itin.price ?? '0');
        const currency = totalFare?.currency ?? totalFare?.currencyCode ?? itin.currency ?? 'CAD';
        if (isNaN(price)) price = 0;

        const rawLegs = itin.legs ?? itin.airItinerary?.originDestinationOptions ?? itin.itinerary?.legs ?? [];
        const parsedLegs: ParsedLeg[] = [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const rawLeg of (Array.isArray(rawLegs) ? rawLegs : []) as any[]) {
            const segments: ParsedSegment[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rawSegments = (rawLeg.segments ?? rawLeg.flightSegments ?? []) as any[];

            for (const seg of rawSegments) {
                const carrier = seg.airline ?? seg.marketingAirline?.code ?? seg.carrier ?? '';
                const info = getAirlineInfo(carrier);
                segments.push({
                    carrier, carrierName: info.name,
                    flightNumber: seg.flightNumber ?? '', from: seg.departureAirport?.locationCode ?? seg.departureAirport ?? '',
                    to: seg.arrivalAirport?.locationCode ?? seg.arrivalAirport ?? '',
                    departTime: extractTime(seg.departureDateTime ?? ''), arriveTime: extractTime(seg.arrivalDateTime ?? ''),
                    departDate: extractDate(seg.departureDateTime ?? ''), arriveDate: extractDate(seg.arrivalDateTime ?? ''),
                    cabin: seg.cabin ?? '',
                });
            }
            if (segments.length === 0) continue;
            const first = segments[0], last = segments[segments.length - 1];
            parsedLegs.push({
                segments, departAirport: first.from, arriveAirport: last.to,
                departTime: first.departTime, arriveTime: last.arriveTime,
                departDate: first.departDate, arriveDate: last.arriveDate,
                duration: rawLeg.duration ?? `${segments.length} seg`,
                stops: Math.max(0, segments.length - 1), carrier: first.carrier, carrierName: first.carrierName,
            });
        }
        if (parsedLegs.length === 0) continue;
        const mainCarrier = parsedLegs[0].carrier;
        const mainInfo = getAirlineInfo(mainCarrier);
        flights.push({
            id: `flight-${i}`, reviewKey, outbound: parsedLegs[0],
            inbound: parsedLegs.length > 1 ? parsedLegs[1] : undefined,
            price, currency, carrier: mainCarrier, carrierName: mainInfo.name,
            carrierLogo: getAirlineLogo(mainCarrier, 30),
        });
    }
    return flights;
}

function parseLiteApiResponse(data: Record<string, unknown>): ParsedHotel[] {
    const hotels: ParsedHotel[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawHotels: any[] = (data.data as unknown[]) ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hotelMeta: Record<string, any> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (Array.isArray((data as any).hotels)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const h of (data as any).hotels) {
            hotelMeta[h.id] = h;
        }
    }

    if (!Array.isArray(rawHotels)) return hotels;

    for (const h of rawHotels) {
        if (!h) continue;
        const meta = hotelMeta[h.hotelId] || {};
        const roomTypes = h.roomTypes ?? [];
        if (!Array.isArray(roomTypes) || roomTypes.length === 0) {
            const rates = h.rates ?? h.offers ?? [];
            if (!Array.isArray(rates) || rates.length === 0) continue;
            const rate = rates[0];
            const offerId = rate.offerId ?? rate.offer_id ?? rate.id ?? '';
            if (!offerId) continue;
            const retailRate = rate.retailRate ?? rate.rate ?? {};
            const totalArr = retailRate.total ?? [];
            const priceObj = Array.isArray(totalArr) ? totalArr[0] : totalArr;
            let price = parseFloat(priceObj?.amount ?? rate.price ?? '0');
            if (isNaN(price)) price = 0;
            const currency = priceObj?.currency ?? rate.currency ?? 'USD';
            const addr = h.address ?? {};
            const addressStr = typeof addr === 'string' ? addr : [addr.line1, addr.cityName].filter(Boolean).join(', ');
            hotels.push({
                hotelId: h.hotelId ?? '', name: h.name ?? meta.name ?? 'Hotel',
                stars: h.starRating ?? meta.rating ?? 0, address: addressStr,
                image: h.main_photo ?? meta.main_photo ?? '',
                offerId, roomName: rate.name ?? 'Standard Room',
                price, currency, boardType: rate.boardType ?? 'RO',
                hasBreakfast: rate.boardType === 'BB' || rate.boardType === 'BI',
                hasRefundable: rate.cancellationPolicies?.refundableTag === 'RFN',
            });
            continue;
        }

        let cheapestPrice = Infinity;
        let currency = 'USD';
        let hasBreakfast = false;
        let hasRefundable = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const rt of roomTypes as any[]) {
            const offer = rt.offerRetailRate;
            if (offer) {
                const amt = typeof offer === 'object' && !Array.isArray(offer)
                    ? offer.amount : Array.isArray(offer) ? offer[0]?.amount : null;
                if (amt && amt < cheapestPrice) {
                    cheapestPrice = amt;
                    currency = (typeof offer === 'object' && !Array.isArray(offer))
                        ? offer.currency || 'USD' : Array.isArray(offer) ? offer[0]?.currency || 'USD' : 'USD';
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (rt.rates?.some((r: any) => r.boardType === 'BB' || r.boardType === 'BI')) hasBreakfast = true;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (rt.rates?.some((r: any) => r.cancellationPolicies?.refundableTag === 'RFN')) hasRefundable = true;
        }

        hotels.push({
            hotelId: h.hotelId ?? '', name: meta.name ?? h.hotelId ?? 'Hotel',
            stars: meta.rating ?? meta.starRating ?? 0, address: meta.address ?? '',
            image: meta.main_photo ?? '',
            offerId: h.hotelId, roomName: `${roomTypes.length} room type${roomTypes.length !== 1 ? 's' : ''}`,
            price: cheapestPrice === Infinity ? 0 : cheapestPrice, currency,
            boardType: hasBreakfast ? 'BB' : 'RO', hasBreakfast, hasRefundable,
        });
    }

    return hotels;
}

function extractTime(dateTimeStr: string): string {
    if (!dateTimeStr) return '';
    if (dateTimeStr.includes('T')) return dateTimeStr.split('T')[1]?.substring(0, 5) ?? '';
    if (dateTimeStr.includes(':') && dateTimeStr.length <= 5) return dateTimeStr;
    return dateTimeStr;
}

function extractDate(dateTimeStr: string): string {
    if (!dateTimeStr) return '';
    if (dateTimeStr.includes('T')) return dateTimeStr.split('T')[0];
    if (dateTimeStr.match(/^\d{4}-\d{2}-\d{2}/)) return dateTimeStr.substring(0, 10);
    return dateTimeStr;
}

function formatStops(stops: number): string {
    if (stops === 0) return 'Nonstop';
    return `${stops} stop${stops > 1 ? 's' : ''}`;
}

function formatBoardType(bt: string): string {
    const map: Record<string, string> = { 'RO': 'Room Only', 'BB': 'Breakfast Included', 'HB': 'Half Board', 'FB': 'Full Board', 'AI': 'All Inclusive' };
    return map[bt?.toUpperCase()] ?? bt ?? 'Room Only';
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const POPULAR_DESTINATIONS = [
    { city: 'New York', country: 'US', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80', avgPrice: 320 },
    { city: 'Paris', country: 'FR', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80', avgPrice: 280 },
    { city: 'Tokyo', country: 'JP', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80', avgPrice: 195 },
    { city: 'London', country: 'GB', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80', avgPrice: 310 },
    { city: 'Dubai', country: 'AE', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80', avgPrice: 250 },
    { city: 'Barcelona', country: 'ES', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80', avgPrice: 175 },
];

const QUICK_CITIES = [
    { label: 'Miami', code: 'US' }, { label: 'Los Angeles', code: 'US' },
    { label: 'Rome', code: 'IT' }, { label: 'Amsterdam', code: 'NL' },
    { label: 'Singapore', code: 'SG' }, { label: 'Cancún', code: 'MX' },
];

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_HEADERS = [
    { key: 'sun', label: 'S' }, { key: 'mon', label: 'M' }, { key: 'tue', label: 'T' },
    { key: 'wed', label: 'W' }, { key: 'thu', label: 'T' }, { key: 'fri', label: 'F' },
    { key: 'sat', label: 'S' }
];

const CustomDatePicker = ({ value, onChange, placeholder, minDate }: { value: string; onChange: (val: string) => void; placeholder: string; minDate?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => {
        if (value) { const [y, m] = value.split('-'); return new Date(parseInt(y), parseInt(m) - 1, 1); }
        return new Date();
    });

    const handleOpen = () => {
        if (!isOpen) {
            if (value) { const [y, m] = value.split('-'); setViewDate(new Date(parseInt(y), parseInt(m) - 1, 1)); }
            else setViewDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
            setIsOpen(true);
        } else setIsOpen(false);
    };

    const canGoPrev = (() => {
        if (!minDate) return true;
        const [y, m] = minDate.split('-').map(Number);
        return viewDate.getFullYear() > y || (viewDate.getFullYear() === y && viewDate.getMonth() > m - 1);
    })();

    const prevMonth = (e: React.MouseEvent) => { e.stopPropagation(); if (canGoPrev) setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)); };
    const nextMonth = (e: React.MouseEvent) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)); };

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

    const isDateDisabled = (year: number, month: number, day: number) => {
        if (!minDate) return false;
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` < minDate;
    };

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`e-${i}`} className={styles.calDayEmpty} />);
    for (let i = 1; i <= daysInMonth; i++) {
        const currentDateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const isSelected = value === currentDateStr;
        const disabled = isDateDisabled(viewDate.getFullYear(), viewDate.getMonth(), i);
        days.push(
            <div key={i} className={`${styles.calDay} ${isSelected ? styles.calDaySelected : ''} ${disabled ? styles.calDayDisabled : ''}`}
                onClick={(e) => { e.stopPropagation(); if (!disabled) { onChange(currentDateStr); setIsOpen(false); } }}>
                {i}
            </div>
        );
    }

    const formatDisplay = (val: string) => { if (!val) return ""; const [y, m, d] = val.split('-'); return `${m}/${d}/${y}`; };

    return (
        <div className={styles.dpWrapper}>
            {isOpen && <div className={styles.dpOverlay} onClick={() => setIsOpen(false)} />}
            <div className={styles.dpTrigger} onClick={handleOpen}>
                {value ? formatDisplay(value) : <span className={styles.dpPlaceholder}>{placeholder}</span>}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            </div>
            {isOpen && (
                <div className={styles.calPopover}>
                    <div className={styles.calHeader}>
                        <div className={styles.calTitle}>{MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}</div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button className={styles.calNavBtn} onClick={prevMonth} style={{ opacity: canGoPrev ? 1 : 0.3 }}>‹</button>
                            <button className={styles.calNavBtn} onClick={nextMonth}>›</button>
                        </div>
                    </div>
                    <div className={styles.calGrid}>
                        {DAY_HEADERS.map(d => (<div key={d.key} className={styles.calDayName}>{d.label}</div>))}
                        {days}
                    </div>
                </div>
            )}
        </div>
    );
};

const AirportSearchInput = ({ value, onChange, placeholder }: { value: string; onChange: (code: string) => void; placeholder: string }) => {
    const [displayValue, setDisplayValue] = useState('');
    const [results, setResults] = useState<AirportInfo[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            const info = getAirportInfo(value);
            setDisplayValue(`${info.city} (${info.code})`);
        }
    }, [value]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleInput = (val: string) => {
        setDisplayValue(val);
        if (val.length >= 2) { setResults(searchAirports(val, 8)); setIsOpen(true); }
        else { setResults([]); setIsOpen(false); }
    };

    return (
        <div className={styles.airportWrapper} ref={wrapperRef}>
            <Plane size={16} strokeWidth={1.5} className={styles.airportIcon} />
            <input
                type="text" className={styles.airportInput} placeholder={placeholder}
                value={displayValue} onChange={(e) => handleInput(e.target.value)}
                onFocus={() => { if (results.length > 0) setIsOpen(true); }}
            />
            {isOpen && results.length > 0 && (
                <div className={styles.airportDropdown}>
                    {results.map(a => (
                        <div key={a.code} className={styles.airportOption} onClick={() => {
                            onChange(a.code); setDisplayValue(`${a.city} (${a.code})`); setResults([]); setIsOpen(false);
                        }}>
                            <span className={styles.airportCodeTag}>{a.code}</span>
                            <span>{a.city} — {a.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PORTAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface Traveler {
    id: string;
    firstName: string;
    lastName: string;
    role: 'athlete' | 'parent' | 'coach' | 'team-manager' | 'sibling' | 'other';
    dateOfBirth: string;
    gender: 'M' | 'F' | '';
    email: string;
    phone: string;
    nationality: string;
}

interface UserAccount {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isNew?: boolean;
}

const TRAVELER_ROLES = [
    { value: 'athlete', label: 'Athlete' },
    { value: 'parent', label: 'Parent / Guardian' },
    { value: 'coach', label: 'Coach' },
    { value: 'team-manager', label: 'Team Manager' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'other', label: 'Other' },
];

const ROLE_COLORS: Record<string, string> = {
    athlete: '#E63946', parent: '#3498db', coach: '#27ae60',
    'team-manager': '#8e44ad', sibling: '#f39c12', other: '#95a5a6',
};

function getInitials(first: string, last: string) {
    return `${(first || '?')[0]}${(last || '?')[0]}`.toUpperCase();
}

function getRoleLabel(role: string) {
    return TRAVELER_ROLES.find(r => r.value === role)?.label || role;
}

export default function Portal() {
    const router = useRouter();
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // User account
    const [user, setUser] = useState<UserAccount | null>(null);
    const [showWelcome, setShowWelcome] = useState(false);

    // Itineraries
    interface Itinerary {
        id: string;
        createdAt: string;
        status: string;
        travelers: string[];
        flight: { origin: string; destination: string; carrier: string; departDate: string; returnDate: string; price: number; currency: string } | null;
        hotel: { name: string; checkin: string; checkout: string; price: number; currency: string } | null;
    }
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);

    // Travelers
    const [travelers, setTravelers] = useState<Traveler[]>([]);
    const [isAddingTraveler, setIsAddingTraveler] = useState(false);
    const [editingTravelerId, setEditingTravelerId] = useState<string | null>(null);
    const [showMoreDetails, setShowMoreDetails] = useState(false);
    const [travelerForm, setTravelerForm] = useState<Omit<Traveler, 'id'>>({
        firstName: '', lastName: '', role: 'athlete' as const, dateOfBirth: '',
        gender: '', email: '', phone: '', nationality: '',
    });

    // Load user + travelers from localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const raw = localStorage.getItem('isa_user');
            if (raw) {
                const parsed = JSON.parse(raw) as UserAccount;
                setUser(parsed);
                if (parsed.isNew) {
                    setShowWelcome(true);
                    localStorage.setItem('isa_user', JSON.stringify({ ...parsed, isNew: false }));
                }
            }
            const rawT = localStorage.getItem('isa_travelers');
            if (rawT) setTravelers(JSON.parse(rawT));
            const rawI = localStorage.getItem('isa_itineraries');
            if (rawI) setItineraries(JSON.parse(rawI));
        } catch { /* ignore */ }
    }, []);

    const saveTravelers = (list: Traveler[]) => {
        setTravelers(list);
        if (typeof window !== 'undefined') localStorage.setItem('isa_travelers', JSON.stringify(list));
    };

    const handleAddTraveler = () => {
        if (!travelerForm.firstName.trim() || !travelerForm.lastName.trim()) return;
        const newTraveler: Traveler = { ...travelerForm, id: `t-${Date.now()}` } as Traveler;
        saveTravelers([...travelers, newTraveler]);
        resetTravelerForm();
    };

    const handleUpdateTraveler = () => {
        if (!editingTravelerId || !travelerForm.firstName.trim() || !travelerForm.lastName.trim()) return;
        saveTravelers(travelers.map(t => t.id === editingTravelerId ? { ...travelerForm, id: editingTravelerId } as Traveler : t));
        resetTravelerForm();
    };

    const handleDeleteTraveler = (id: string) => {
        saveTravelers(travelers.filter(t => t.id !== id));
    };

    const startEdit = (t: Traveler) => {
        setEditingTravelerId(t.id);
        setTravelerForm({
            firstName: t.firstName, lastName: t.lastName, role: t.role,
            dateOfBirth: t.dateOfBirth, gender: t.gender, email: t.email,
            phone: t.phone, nationality: t.nationality,
        });
        setShowMoreDetails(!!(t.dateOfBirth || t.gender || t.phone || t.nationality));
        setIsAddingTraveler(true);
    };

    const resetTravelerForm = () => {
        setIsAddingTraveler(false);
        setEditingTravelerId(null);
        setShowMoreDetails(false);
        setTravelerForm({ firstName: '', lastName: '', role: 'athlete' as const, dateOfBirth: '', gender: '', email: '', phone: '', nationality: '' });
    };

    // ── Flight search state ──────────────────────────────────────────────────
    const [flightOrigin, setFlightOrigin] = useState('');
    const [flightDest, setFlightDest] = useState('');
    const [flightDepart, setFlightDepart] = useState('');
    const [flightReturn, setFlightReturn] = useState('');
    const [flightTripType, setFlightTripType] = useState<'RT' | 'OW'>('RT');
    const [flightAdults, setFlightAdults] = useState(1);
    const [flightChildren, setFlightChildren] = useState(0);
    const [flightResults, setFlightResults] = useState<ParsedFlight[]>([]);
    const [isSearchingFlights, setIsSearchingFlights] = useState(false);
    const [flightError, setFlightError] = useState('');
    const [hasSearchedFlights, setHasSearchedFlights] = useState(false);
    const [selectedFlight, setSelectedFlight] = useState<ParsedFlight | null>(null);
    const [detailFlight, setDetailFlight] = useState<ParsedFlight | null>(null);
    const [isReviewing, setIsReviewing] = useState(false);
    const [filterStops, setFilterStops] = useState<'any' | 'nonstop' | 'one_stop'>('any');
    const [filterAirline, setFilterAirline] = useState('');

    // ── Hotel search state ───────────────────────────────────────────────────
    const [hotelCity, setHotelCity] = useState('');
    const [hotelCountry, setHotelCountry] = useState('US');
    const [hotelCheckin, setHotelCheckin] = useState('');
    const [hotelCheckout, setHotelCheckout] = useState('');
    const [hotelAdults, setHotelAdults] = useState(2);
    const [hotelRooms, setHotelRooms] = useState(1);
    const [hotelResults, setHotelResults] = useState<ParsedHotel[]>([]);
    const [isSearchingHotels, setIsSearchingHotels] = useState(false);
    const [hotelError, setHotelError] = useState('');
    const [hasSearchedHotels, setHasSearchedHotels] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [rawHotelData, setRawHotelData] = useState<any>(null);
    const [detailHotel, setDetailHotel] = useState<ParsedHotel | null>(null);

    const todayStr = (() => {
        const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    const [searchQuery, setSearchQuery] = useState('');

    const handleSignOut = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('isa_user');
            localStorage.removeItem('isa_travelers');
            localStorage.removeItem('isa_itineraries');
            try { sessionStorage.clear(); } catch { /* */ }
        }
        router.push('/');
    };

    // Clear return date when switching to one-way or when depart moves past it
    useEffect(() => { if (flightTripType === 'OW') setFlightReturn(''); }, [flightTripType]);
    useEffect(() => { if (flightDepart && flightReturn && flightReturn < flightDepart) setFlightReturn(''); }, [flightDepart, flightReturn]);
    useEffect(() => { if (hotelCheckin && hotelCheckout && hotelCheckout <= hotelCheckin) setHotelCheckout(''); }, [hotelCheckin, hotelCheckout]);

    const canSearchFlights = flightOrigin && flightDest && flightOrigin !== flightDest && flightDepart && (flightTripType === 'OW' || flightReturn);

    // ── API Calls ────────────────────────────────────────────────────────────

    const searchFlights = useCallback(async () => {
        setIsSearchingFlights(true);
        setFlightError('');
        setFlightResults([]);
        setSelectedFlight(null);
        setHasSearchedFlights(true);

        try {
            const passengers: { type: string; quantity: number }[] = [{ type: 'ADT', quantity: flightAdults }];
            if (flightChildren > 0) passengers.push({ type: 'CNN', quantity: flightChildren });

            const res = await fetch('/api/farenexus/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    origin: flightOrigin, destination: flightDest,
                    departureDate: flightDepart,
                    returnDate: flightTripType === 'RT' ? flightReturn : undefined,
                    passengers, tripType: flightTripType, travelClass: 'ECO',
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Search failed');
            const parsed = parseFareNexusResponse(data);
            setFlightResults(parsed);
            if (parsed.length === 0) setFlightError('No flights found. Try different dates or airports.');
        } catch (err) {
            setFlightError(err instanceof Error ? err.message : 'Flight search failed.');
        } finally {
            setIsSearchingFlights(false);
        }
    }, [flightOrigin, flightDest, flightDepart, flightReturn, flightTripType, flightAdults, flightChildren]);

    const searchHotels = useCallback(async (city?: string, country?: string) => {
        const searchCity = city || hotelCity;
        const searchCountry = country || hotelCountry;
        if (!searchCity) { setHotelError('Please enter a destination.'); return; }

        let checkin = hotelCheckin;
        let checkout = hotelCheckout;
        if (!checkin) {
            const d = new Date(); d.setDate(d.getDate() + 14);
            checkin = d.toISOString().split('T')[0];
            setHotelCheckin(checkin);
        }
        if (!checkout) {
            const d = new Date(checkin); d.setDate(d.getDate() + 3);
            checkout = d.toISOString().split('T')[0];
            setHotelCheckout(checkout);
        }

        setIsSearchingHotels(true);
        setHotelError('');
        setHotelResults([]);
        setHasSearchedHotels(true);

        try {
            const res = await fetch('/api/hotels/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cityName: searchCity, countryCode: searchCountry,
                    checkin, checkout, adults: hotelAdults, rooms: hotelRooms,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Hotel search failed');
            setRawHotelData(data);
            const parsed = parseLiteApiResponse(data);
            setHotelResults(parsed);
            if (parsed.length === 0) setHotelError('No hotels found. Try a different city or dates.');
        } catch (err) {
            setHotelError(err instanceof Error ? err.message : 'Hotel search failed.');
        } finally {
            setIsSearchingHotels(false);
        }
    }, [hotelCity, hotelCountry, hotelCheckin, hotelCheckout, hotelAdults]);

    // Filtered flights
    const filteredFlights = flightResults.filter(f => {
        if (filterStops === 'nonstop' && f.outbound.stops !== 0) return false;
        if (filterStops === 'one_stop' && f.outbound.stops > 1) return false;
        if (filterAirline && f.carrier !== filterAirline) return false;
        return true;
    });

    const uniqueAirlines = Array.from(new Map(flightResults.map(f => [f.carrier, f.carrierName])).entries());

    const handleBookFlight = async (flight?: ParsedFlight) => {
        const target = flight || selectedFlight;
        if (!target) return;
        setIsReviewing(true);
        try {
            const reviewRes = await fetch('/api/farenexus/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewKey: target.reviewKey }),
            });
            const reviewData = await reviewRes.json();
            if (!reviewRes.ok) throw new Error(reviewData.error || 'Review failed');
            const bookKey = reviewData.bookKey ?? reviewData.data?.bookKey ?? '';
            const params = new URLSearchParams({
                ...(bookKey ? { bookKey } : {}),
                price: target.price.toFixed(2),
                currency: target.currency,
                origin: target.outbound.departAirport,
                destination: target.outbound.arriveAirport,
            });
            router.push(`/booking?${params.toString()}`);
        } catch {
            try { sessionStorage.setItem('selected_flight', JSON.stringify(target)); } catch { /* */ }
            router.push('/booking');
        } finally {
            setIsReviewing(false);
        }
    };

    const calcNights = (checkin: string, checkout: string) => {
        const a = new Date(checkin), b = new Date(checkout);
        return Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractRoomRates = (hotelId: string): any[] => {
        if (!rawHotelData) return [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hotelData = (rawHotelData.data as any[])?.find((h: any) => h.hotelId === hotelId);
        if (!hotelData) return [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rates: any[] = [];
        const roomTypes = hotelData.roomTypes ?? [];
        for (const rt of roomTypes) {
            const offerId = rt.offerId ?? '';
            for (const rate of (rt.rates ?? [])) {
                const total = rate.retailRate?.total;
                const priceObj = Array.isArray(total) ? total[0] : total;
                const price = priceObj?.amount ?? 0;
                const currency = priceObj?.currency ?? 'USD';
                const cancelPolicies = rate.cancellationPolicies;
                rates.push({
                    offerId,
                    rateId: rate.rateId ?? '',
                    roomName: rate.name ?? rt.name ?? 'Standard Room',
                    maxOccupancy: rate.maxOccupancy ?? 0,
                    boardType: rate.boardType ?? 'RO',
                    boardName: rate.boardName ?? 'Room Only',
                    price,
                    currency,
                    refundable: cancelPolicies?.refundableTag === 'RFN',
                    cancelDeadline: cancelPolicies?.cancelPolicyInfos?.[0]?.cancelTime ?? '',
                    remarks: rate.remarks ?? '',
                });
            }
        }
        return rates;
    };

    const handleDestinationClick = (city: string, countryCode: string) => {
        setHotelCity(city);
        setHotelCountry(countryCode);
        searchHotels(city, countryCode);
    };

    // ── Render Content ───────────────────────────────────────────────────────

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <>
                        {showWelcome && user && (
                            <div className={styles.welcomeBanner}>
                                <div className={styles.welcomeBannerContent}>
                                    <h2 className={styles.welcomeBannerTitle}>Welcome to ISA Travel, {user.firstName}!</h2>
                                    <p className={styles.welcomeBannerText}>
                                        Your portal is set up and ready to go. Start by adding travelers to your profile, then book flights and hotels for upcoming events.
                                    </p>
                                    <div className={styles.welcomeBannerActions}>
                                        <button className="geometric-btn" style={{ padding: '14px 28px', fontSize: '0.9rem' }} onClick={() => { setActiveTab('travelers'); setIsAddingTraveler(true); }}>
                                            Add Your First Traveler
                                        </button>
                                        <button className="geometric-btn geometric-btn-secondary" style={{ padding: '14px 28px', fontSize: '0.9rem' }} onClick={() => setShowWelcome(false)}>
                                            Explore Portal
                                        </button>
                                    </div>
                                </div>
                                <button className={styles.welcomeBannerClose} onClick={() => setShowWelcome(false)}>
                                    <X size={18} />
                                </button>
                            </div>
                        )}

                        <div className={styles.welcomeSection}>
                            <h1 className={styles.pageTitle}>Dashboard</h1>
                            <p className={styles.pageSubtitle}>Welcome back, {user?.firstName || 'there'}. {itineraries.length > 0 ? `You have ${itineraries.length} booked trip${itineraries.length !== 1 ? 's' : ''} and ${travelers.length} traveler${travelers.length !== 1 ? 's' : ''}.` : travelers.length > 0 ? `You have ${travelers.length} traveler${travelers.length !== 1 ? 's' : ''} on your profile.` : 'Get started by adding travelers and booking your first trip.'}</p>
                        </div>

                        <div className={`${styles.card} ${styles.cardFull}`} style={{ padding: 0, background: 'transparent', border: 'none', boxShadow: 'none' }}>
                            <div className={styles.quickActionsRow}>
                                <div className={styles.quickActionCard} onClick={() => setActiveTab('flights')}>
                                    <Plane size={22} strokeWidth={1.5} />
                                    <span>Book Flight</span>
                                </div>
                                <div className={styles.quickActionCard} onClick={() => setActiveTab('hotels')}>
                                    <Hotel size={22} strokeWidth={1.5} />
                                    <span>Find Hotel</span>
                                </div>
                                <div className={styles.quickActionCard} onClick={() => router.push('/booking')}>
                                    <Car size={22} strokeWidth={1.5} />
                                    <span>Agent Assisted</span>
                                </div>
                                <div className={styles.quickActionCard} onClick={() => setIsContactOpen(true)}>
                                    <PhoneCall size={22} strokeWidth={1.5} />
                                    <span>Contact Agent</span>
                                </div>
                            </div>
                        </div>

                        <div className={`${styles.card} ${styles.cardFull}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>Itineraries</h2>
                                {itineraries.length > 0 && <a href="#" className={styles.viewAllLink} onClick={(e) => { e.preventDefault(); setActiveTab('itineraries'); }}>View All</a>}
                            </div>
                            {itineraries.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                                    <Plane size={40} strokeWidth={1} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                    <h3 style={{ fontSize: '1.1rem', color: 'var(--isa-black)', marginBottom: '8px', fontFamily: 'var(--font-sans)', textTransform: 'none', letterSpacing: 0 }}>No trips yet</h3>
                                    <p style={{ fontSize: '0.9rem', marginBottom: '24px', maxWidth: '360px', margin: '0 auto 24px', lineHeight: 1.5 }}>
                                        Book a flight or full trip to see your itineraries here.
                                    </p>
                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <button className="geometric-btn" style={{ padding: '14px 28px', fontSize: '0.85rem' }} onClick={() => setActiveTab('flights')}>Search Flights</button>
                                        <button className="geometric-btn geometric-btn-secondary" style={{ padding: '14px 28px', fontSize: '0.85rem' }} onClick={() => router.push('/booking')}>Full Booking</button>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.itineraryList}>
                                    {itineraries.slice(0, 3).map(itin => (
                                        <div key={itin.id} className={styles.itineraryCard}>
                                            <div className={styles.eventDetails}>
                                                <div className={styles.eventTitle}>
                                                    {itin.flight ? `${itin.flight.origin} → ${itin.flight.destination}` : 'Trip'}
                                                    {itin.hotel ? ` + ${itin.hotel.name.substring(0, 25)}` : ''}
                                                </div>
                                                <div className={styles.eventLoc}>
                                                    {itin.flight?.departDate ? new Date(itin.flight.departDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                                                    {itin.flight?.returnDate ? ` – ${new Date(itin.flight.returnDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                                                    {itin.travelers.length > 0 ? ` • ${itin.travelers.join(', ')}` : ''}
                                                </div>
                                            </div>
                                            <div className={styles.serviceStatusRow}>
                                                {itin.flight && <span className={`${styles.statusPill} ${styles.statusSuccess}`}><Plane size={14} /> Booked</span>}
                                                {itin.hotel && <span className={`${styles.statusPill} ${styles.statusSuccess}`}><Hotel size={14} /> Booked</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Traveler Profiles</h2>
                            <div className={styles.travelerList}>
                                {travelers.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#999' }}>
                                        <Users size={32} strokeWidth={1} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                                        <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>No travelers added yet.</p>
                                    </div>
                                ) : (
                                    travelers.slice(0, 3).map(t => (
                                        <div key={t.id} className={styles.travelerRow}>
                                            <div className={styles.travelerAvatar} style={{ background: `${ROLE_COLORS[t.role] || '#999'}15`, color: ROLE_COLORS[t.role] || '#999' }}>
                                                {getInitials(t.firstName, t.lastName)}
                                            </div>
                                            <div className={styles.travelerInfo}>
                                                <div className={styles.travelerName}>{t.firstName} {t.lastName}</div>
                                                <div className={styles.travelerRole}>{getRoleLabel(t.role)}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <button className={styles.addTravelerBtn} onClick={() => setActiveTab('travelers')}><UserPlus size={18} /> Manage Travelers</button>
                            </div>
                        </div>
                    </>
                );

            // ══════════════════════════════════════════════════════════════════
            // FLIGHTS TAB
            // ══════════════════════════════════════════════════════════════════
            case 'flights':
                return (
                    <div className={styles.tabContentBlock}>
                        <div className={styles.welcomeSection}>
                            <h1 className={styles.pageTitle}>Book a Flight</h1>
                            <p className={styles.pageSubtitle}>Search real-time availability across airlines worldwide.</p>
                        </div>

                        {/* Search Form */}
                        <div className={`${styles.card} ${styles.cardFull}`} style={{ overflow: 'visible' }}>
                            <div className={styles.ftTripToggle}>
                                <button className={`${styles.ftToggleBtn} ${flightTripType === 'RT' ? styles.ftToggleActive : ''}`} onClick={() => setFlightTripType('RT')}>Round Trip</button>
                                <button className={`${styles.ftToggleBtn} ${flightTripType === 'OW' ? styles.ftToggleActive : ''}`} onClick={() => setFlightTripType('OW')}>One Way</button>
                            </div>
                            <div className={styles.ftSearchGrid}>
                                <div><label className={styles.ftLabel}>From</label><AirportSearchInput value={flightOrigin} onChange={setFlightOrigin} placeholder="City or airport code" /></div>
                                <div><label className={styles.ftLabel}>To</label><AirportSearchInput value={flightDest} onChange={setFlightDest} placeholder="City or airport code" /></div>
                                <div><label className={styles.ftLabel}>Departure</label><CustomDatePicker value={flightDepart} onChange={setFlightDepart} placeholder="Select date" minDate={todayStr} /></div>
                                {flightTripType === 'RT' && (<div><label className={styles.ftLabel}>Return</label><CustomDatePicker value={flightReturn} onChange={setFlightReturn} placeholder="Select date" minDate={flightDepart || todayStr} /></div>)}
                            </div>
                            <div className={styles.ftPaxRow}>
                                <div className={styles.ftPaxControl}><span className={styles.ftPaxLabel}>Adults</span><div className={styles.ftPaxBtns}><button className={styles.ftPaxBtn} onClick={() => setFlightAdults(Math.max(1, flightAdults - 1))}>−</button><span className={styles.ftPaxCount}>{flightAdults}</span><button className={styles.ftPaxBtn} onClick={() => setFlightAdults(Math.min(9 - flightChildren, flightAdults + 1))}>+</button></div></div>
                                <div className={styles.ftPaxControl}><span className={styles.ftPaxLabel}>Children</span><div className={styles.ftPaxBtns}><button className={styles.ftPaxBtn} onClick={() => setFlightChildren(Math.max(0, flightChildren - 1))}>−</button><span className={styles.ftPaxCount}>{flightChildren}</span><button className={styles.ftPaxBtn} onClick={() => setFlightChildren(Math.min(9 - flightAdults, flightChildren + 1))}>+</button></div></div>
                                <button className={styles.ftSearchBtn} onClick={searchFlights} disabled={!canSearchFlights || isSearchingFlights}>
                                    {isSearchingFlights ? <Loader2 size={20} className={styles.spinner} /> : <Search size={20} />}
                                    <span>{isSearchingFlights ? 'Searching...' : 'Search Flights'}</span>
                                </button>
                            </div>
                            {flightOrigin && flightDest && flightOrigin === flightDest && (<div className={styles.ftError}>Origin and destination cannot be the same.</div>)}

                            {/* Filter bar — appears after search */}
                            {(hasSearchedFlights && flightResults.length > 0) && (
                                <div className={styles.ftFilterBar}>
                                    <span className={styles.ftFilterLabel}>Select departure from {flightOrigin}</span>
                                    <div className={styles.ftFilters}>
                                        <select className={styles.ftFilterSelect} value={filterStops} onChange={(e) => setFilterStops(e.target.value as 'any' | 'nonstop' | 'one_stop')}>
                                            <option value="any">Any stops</option>
                                            <option value="nonstop">Nonstop only</option>
                                            <option value="one_stop">1 stop or fewer</option>
                                        </select>
                                        <select className={styles.ftFilterSelect} value={filterAirline} onChange={(e) => setFilterAirline(e.target.value)}>
                                            <option value="">All airlines</option>
                                            {uniqueAirlines.map(([code, name]) => (<option key={code} value={code}>{name}</option>))}
                                        </select>
                                        {(filterStops !== 'any' || filterAirline) && (
                                            <button className={styles.ftFilterClear} onClick={() => { setFilterStops('any'); setFilterAirline(''); }}>Clear filters</button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Loading overlay */}
                        {isSearchingFlights && (
                            <div className={styles.ftLoadingOverlay}><div className={styles.ftLoadingModal}>
                                <Plane size={32} strokeWidth={1.5} />
                                <h3>{flightTripType === 'RT' ? 'Round Trip' : 'One Way'} — {flightOrigin} → {flightDest}</h3>
                                <p>Checking with airlines...</p>
                                <div className={styles.ftLoadingBar} />
                            </div></div>
                        )}

                        {/* Reviewing overlay */}
                        {isReviewing && (
                            <div className={styles.ftLoadingOverlay}><div className={styles.ftLoadingModal}>
                                <Loader2 size={32} className={styles.spinner} />
                                <h3>Confirming availability...</h3>
                                <p>Reviewing fare with airline</p>
                                <div className={styles.ftLoadingBar} />
                            </div></div>
                        )}

                        {flightError && <div className={`${styles.card} ${styles.cardFull}`}><div className={styles.ftError}>{flightError}</div></div>}

                        {/* Results */}
                        {!isSearchingFlights && hasSearchedFlights && flightResults.length > 0 && (
                            <div className={`${styles.card} ${styles.cardFull}`}>
                                <div className={styles.ftResultsHeader}>
                                    <h3>Available Flights</h3>
                                    <span className={styles.ftResultsSub}>{filteredFlights.length} of {flightResults.length} result{flightResults.length !== 1 ? 's' : ''}</span>
                                </div>

                                {filteredFlights.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
                                        <p>No flights match your filters. Try adjusting or clearing filters.</p>
                                    </div>
                                ) : (
                                    <div className={styles.ftResultsList}>
                                        {filteredFlights.map(flight => (
                                            <div key={flight.id} className={`${styles.ftCard} ${selectedFlight?.id === flight.id ? styles.ftCardSelected : ''}`} onClick={() => setDetailFlight(flight)}>
                                                <div className={styles.ftCardAirline}>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    {flight.carrierLogo && <img src={flight.carrierLogo} alt={flight.carrierName} width={28} height={28} className={styles.ftAirlineLogo} />}
                                                    <span className={styles.ftAirlineName}>{flight.carrierName}</span>
                                                </div>
                                                <div className={styles.ftCardLegs}>
                                                    <div className={styles.ftLeg}>
                                                        <div className={styles.ftTime}><span className={styles.ftTimeVal}>{flight.outbound.departTime || '--:--'}</span><span className={styles.ftAirport}>{flight.outbound.departAirport}</span></div>
                                                        <div className={styles.ftRoute}><span className={styles.ftDuration}>{flight.outbound.duration}</span><div className={styles.ftLine}><div className={styles.ftDot} /><div className={styles.ftDash} /><div className={styles.ftDot} /></div><span className={styles.ftStops}>{formatStops(flight.outbound.stops)}</span></div>
                                                        <div className={styles.ftTime}><span className={styles.ftTimeVal}>{flight.outbound.arriveTime || '--:--'}</span><span className={styles.ftAirport}>{flight.outbound.arriveAirport}</span></div>
                                                    </div>
                                                    {flight.inbound && (
                                                        <div className={styles.ftLeg} style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                                                            <div className={styles.ftTime}><span className={styles.ftTimeVal}>{flight.inbound.departTime || '--:--'}</span><span className={styles.ftAirport}>{flight.inbound.departAirport}</span></div>
                                                            <div className={styles.ftRoute}><span className={styles.ftDuration}>{flight.inbound.duration}</span><div className={styles.ftLine}><div className={styles.ftDot} /><div className={styles.ftDash} /><div className={styles.ftDot} /></div><span className={styles.ftStops}>{formatStops(flight.inbound.stops)}</span></div>
                                                            <div className={styles.ftTime}><span className={styles.ftTimeVal}>{flight.inbound.arriveTime || '--:--'}</span><span className={styles.ftAirport}>{flight.inbound.arriveAirport}</span></div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={styles.ftCardPrice}>
                                                    <span className={styles.ftPriceVal}>{formatPrice(flight.price, flight.currency)}</span>
                                                    <span className={styles.ftPricePer}>per person</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pre-search: Featured routes + chips */}
                        {!hasSearchedFlights && !isSearchingFlights && (
                            <div className={`${styles.card} ${styles.cardFull}`}>
                                <h3 className={styles.ftPreTitle}>Popular Routes</h3>
                                <div className={styles.ftChips}>
                                    <button className={styles.ftChip} onClick={() => { setFlightOrigin('YUL'); setFlightDest('YVR'); }}>YUL → YVR</button>
                                    <button className={styles.ftChip} onClick={() => { setFlightOrigin('YYZ'); setFlightDest('YVR'); }}>YYZ → YVR</button>
                                    <button className={styles.ftChip} onClick={() => { setFlightOrigin('JFK'); setFlightDest('LAX'); }}>JFK → LAX</button>
                                    <button className={styles.ftChip} onClick={() => { setFlightOrigin('ORD'); setFlightDest('MIA'); }}>ORD → MIA</button>
                                    <button className={styles.ftChip} onClick={() => { setFlightOrigin('LHR'); setFlightDest('CDG'); }}>LHR → CDG</button>
                                </div>
                            </div>
                        )}

                        {/* Flight Detail Modal */}
                        {detailFlight && (
                            <div className={styles.ftModalOverlay} onClick={() => setDetailFlight(null)}>
                                <div className={styles.ftModal} onClick={(e) => e.stopPropagation()}>
                                    <button className={styles.ftModalClose} onClick={() => setDetailFlight(null)}><X size={20} /></button>
                                    <div className={styles.ftModalHeader}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={detailFlight.carrierLogo} alt="" width={36} height={36} style={{ borderRadius: '8px' }} />
                                        <div>
                                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--isa-black)', fontFamily: 'var(--font-sans)', textTransform: 'none', letterSpacing: 0 }}>{detailFlight.carrierName}</h3>
                                            <span style={{ fontSize: '0.85rem', color: '#888' }}>{detailFlight.outbound.departAirport} → {detailFlight.outbound.arriveAirport}{detailFlight.inbound ? ` → ${detailFlight.inbound.arriveAirport}` : ''}</span>
                                        </div>
                                    </div>

                                    {[detailFlight.outbound, ...(detailFlight.inbound ? [detailFlight.inbound] : [])].map((leg, li) => (
                                        <div key={li} className={styles.ftModalLeg}>
                                            <div className={styles.ftModalLegTitle}>{li === 0 ? 'Outbound' : 'Return'} • {leg.duration} • {formatStops(leg.stops)}</div>
                                            {leg.segments.map((seg, si) => (
                                                <div key={si} className={styles.ftModalSeg}>
                                                    <div className={styles.ftModalSegTimes}>
                                                        <div><span className={styles.ftModalSegTime}>{seg.departTime}</span><span className={styles.ftModalSegCode}>{seg.from}</span></div>
                                                        <div className={styles.ftModalSegLine}><div className={styles.ftDot} /><div className={styles.ftDash} /><div className={styles.ftDot} /></div>
                                                        <div><span className={styles.ftModalSegTime}>{seg.arriveTime}</span><span className={styles.ftModalSegCode}>{seg.to}</span></div>
                                                    </div>
                                                    <div className={styles.ftModalSegMeta}>
                                                        <span>{seg.carrierName} {seg.flightNumber}</span>
                                                        <span>{seg.cabin}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}

                                    <div className={styles.ftModalFooter}>
                                        <div className={styles.ftModalPrice}>
                                            <span className={styles.ftPriceVal}>{formatPrice(detailFlight.price, detailFlight.currency)}</span>
                                            <span className={styles.ftPricePer}>per person</span>
                                        </div>
                                        <button className={styles.ftBookBtn} onClick={() => { setDetailFlight(null); setSelectedFlight(detailFlight); handleBookFlight(detailFlight); }}>
                                            Continue to Book <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            // ══════════════════════════════════════════════════════════════════
            // HOTELS TAB
            // ══════════════════════════════════════════════════════════════════
            case 'hotels':
                return (
                    <div className={styles.tabContentBlock}>
                        <div className={styles.welcomeSection}>
                            <h1 className={styles.pageTitle}>Find a Stay</h1>
                            <p className={styles.pageSubtitle}>Search hotels worldwide with real-time pricing and availability.</p>
                        </div>

                        <div className={`${styles.card} ${styles.cardFull}`} style={{ overflow: 'visible' }}>
                            <div className={styles.htSearchGrid}>
                                <div>
                                    <label className={styles.ftLabel}>Destination</label>
                                    <div className={styles.htInputWrapper}>
                                        <MapPin size={16} strokeWidth={1.5} className={styles.htInputIcon} />
                                        <input
                                            type="text" className={styles.htInput}
                                            placeholder="City or hotel name" value={hotelCity}
                                            onChange={(e) => setHotelCity(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={styles.ftLabel}>Check-in</label>
                                    <CustomDatePicker value={hotelCheckin} onChange={setHotelCheckin} placeholder="Select date" minDate={todayStr} />
                                </div>
                                <div>
                                    <label className={styles.ftLabel}>Check-out</label>
                                    <CustomDatePicker value={hotelCheckout} onChange={setHotelCheckout} placeholder="Select date" minDate={hotelCheckin || todayStr} />
                                </div>
                                <div>
                                    <label className={styles.ftLabel}>Guests & Rooms</label>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', height: '52px' }}>
                                        <div className={styles.ftPaxBtns}>
                                            <button className={styles.ftPaxBtn} onClick={() => setHotelAdults(Math.max(1, hotelAdults - 1))}>−</button>
                                            <span className={styles.ftPaxCount}>{hotelAdults}</span>
                                            <button className={styles.ftPaxBtn} onClick={() => setHotelAdults(Math.min(6, hotelAdults + 1))}>+</button>
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: '#888' }}>adults</span>
                                        <div className={styles.ftPaxBtns}>
                                            <button className={styles.ftPaxBtn} onClick={() => setHotelRooms(Math.max(1, hotelRooms - 1))}>−</button>
                                            <span className={styles.ftPaxCount}>{hotelRooms}</span>
                                            <button className={styles.ftPaxBtn} onClick={() => setHotelRooms(Math.min(4, hotelRooms + 1))}>+</button>
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: '#888' }}>room{hotelRooms !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                className={styles.ftSearchBtn}
                                onClick={() => searchHotels()}
                                disabled={!hotelCity || isSearchingHotels}
                                style={{ marginTop: '16px', width: '100%' }}
                            >
                                {isSearchingHotels ? <Loader2 size={20} className={styles.spinner} /> : <Search size={20} />}
                                <span>{isSearchingHotels ? 'Searching...' : 'Search Hotels'}</span>
                            </button>
                        </div>

                        {/* Error */}
                        {hotelError && <div className={`${styles.card} ${styles.cardFull}`}><div className={styles.ftError}>{hotelError}</div></div>}

                        {/* Loading skeleton */}
                        {isSearchingHotels && (
                            <div className={`${styles.card} ${styles.cardFull}`}>
                                <div className={styles.htSkeletonGrid}>
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className={styles.htSkeleton}>
                                            <div className={styles.htSkeletonImg} />
                                            <div className={styles.htSkeletonBody}>
                                                <div className={styles.htSkeletonLine} style={{ width: '70%' }} />
                                                <div className={styles.htSkeletonLine} style={{ width: '50%' }} />
                                                <div className={styles.htSkeletonLine} style={{ width: '30%' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty state */}
                        {hasSearchedHotels && !isSearchingHotels && hotelResults.length === 0 && !hotelError && (
                            <div className={`${styles.card} ${styles.cardFull}`} style={{ textAlign: 'center', padding: '64px 32px' }}>
                                <Search size={40} strokeWidth={1.2} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                <h3 style={{ fontSize: '1.25rem', color: 'var(--isa-black)', marginBottom: '8px' }}>No Hotels Found</h3>
                                <p style={{ color: '#888' }}>Try adjusting your destination or dates.</p>
                            </div>
                        )}

                        {/* Results */}
                        {!isSearchingHotels && hotelResults.length > 0 && (
                            <div className={`${styles.card} ${styles.cardFull}`}>
                                <div className={styles.ftResultsHeader}>
                                    <h3>{hotelResults.length} hotel{hotelResults.length !== 1 ? 's' : ''} found</h3>
                                    <span className={styles.ftResultsSub}>in {hotelCity}</span>
                                </div>
                                <div className={styles.htGrid}>
                                    {hotelResults.map(hotel => {
                                        const nights = (hotelCheckin && hotelCheckout) ? calcNights(hotelCheckin, hotelCheckout) : 1;
                                        const perNight = hotel.price > 0 ? Math.round(hotel.price / nights) : 0;
                                        return (
                                            <div key={hotel.hotelId} className={styles.htCard} onClick={() => setDetailHotel(hotel)}>
                                                {hotel.image ? (
                                                    <div className={styles.htCardImage} style={{ backgroundImage: `url(${hotel.image})` }} />
                                                ) : (
                                                    <div className={styles.htCardImagePlaceholder}><MapPin size={24} /></div>
                                                )}
                                                <div className={styles.htCardBody}>
                                                    <div className={styles.htCardTop}>
                                                        <h4 className={styles.htCardName}>{hotel.name}</h4>
                                                        {hotel.stars > 0 && (
                                                            <div className={styles.htStars}><Star size={13} fill="currentColor" /><span>{hotel.stars}</span></div>
                                                        )}
                                                    </div>
                                                    {hotel.address && <p className={styles.htCardAddr}>{hotel.address}</p>}
                                                    <div className={styles.htTags}>
                                                        {hotel.hasBreakfast && <span className={styles.htTag}><Coffee size={12} /> Breakfast</span>}
                                                        {hotel.hasRefundable && <span className={styles.htTag}><ShieldCheck size={12} /> Free cancellation</span>}
                                                    </div>
                                                    <div className={styles.htCardBottom}>
                                                        {hotel.price > 0 ? (
                                                            <>
                                                                <div className={styles.htPriceBlock}>
                                                                    <span className={styles.htPrice}>{formatPrice(perNight, hotel.currency)}</span>
                                                                    <span className={styles.htPricePer}>/ night</span>
                                                                </div>
                                                                <span className={styles.htTotalLabel}>{formatPrice(hotel.price, hotel.currency)} for {nights} night{nights !== 1 ? 's' : ''}</span>
                                                            </>
                                                        ) : (
                                                            <span className={styles.htNoPrice}>Price unavailable</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Pre-search content */}
                        {!hasSearchedHotels && !isSearchingHotels && (
                            <>
                                <div className={`${styles.card} ${styles.cardFull}`}>
                                    <h3 className={styles.ftPreTitle}>Quick Search</h3>
                                    <div className={styles.ftChips}>
                                        {QUICK_CITIES.map(c => (
                                            <button key={c.label} className={styles.ftChip} onClick={() => handleDestinationClick(c.label, c.code)}>
                                                <MapPin size={14} /> {c.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className={`${styles.card} ${styles.cardFull}`} style={{ padding: 0, background: 'transparent', border: 'none', boxShadow: 'none' }}>
                                    <h3 className={styles.ftPreTitle} style={{ marginBottom: '16px' }}>Popular Destinations</h3>
                                    <div className={styles.htDestGrid}>
                                        {POPULAR_DESTINATIONS.map(d => (
                                            <div key={d.city} className={styles.htDestCard} onClick={() => handleDestinationClick(d.city, d.country)}>
                                                <div className={styles.htDestPhoto} style={{ backgroundImage: `url(${d.image})` }} />
                                                <div className={styles.htDestOverlay}>
                                                    <h4>{d.city}</h4>
                                                    <span>from ${d.avgPrice}/night</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className={`${styles.card} ${styles.cardFull}`}>
                                    <div className={styles.htTrustBar}>
                                        <div className={styles.htTrustItem}><ShieldCheck size={18} /><span>Free cancellation on most rooms</span></div>
                                        <div className={styles.htTrustItem}><Coffee size={18} /><span>Breakfast details shown upfront</span></div>
                                        <div className={styles.htTrustItem}><Star size={18} /><span>Verified guest ratings</span></div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                );

            case 'itineraries':
                return (
                    <div className={styles.tabContentBlock}>
                        <div className={styles.welcomeSection}>
                            <h1 className={styles.pageTitle}>Itineraries</h1>
                            <p className={styles.pageSubtitle}>{itineraries.length > 0 ? `You have ${itineraries.length} booked trip${itineraries.length !== 1 ? 's' : ''}.` : 'Review and manage your active and past trips.'}</p>
                        </div>
                        {itineraries.length === 0 ? (
                            <div className={`${styles.card} ${styles.cardFull}`} style={{ minHeight: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ textAlign: 'center', color: '#888', maxWidth: '400px' }}>
                                    <Plane size={48} strokeWidth={1} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                    <h3 style={{ fontSize: '1.25rem', color: 'var(--isa-black)', marginBottom: '8px', fontFamily: 'var(--font-sans)', textTransform: 'none', letterSpacing: 0 }}>No Itineraries Yet</h3>
                                    <p style={{ lineHeight: 1.5, marginBottom: '24px' }}>Once you book a trip, your full itinerary — flights, hotels, and ground transport — will appear here.</p>
                                    <button className="geometric-btn" style={{ padding: '14px 28px', fontSize: '0.85rem' }} onClick={() => router.push('/booking')}>Book Your First Trip</button>
                                </div>
                            </div>
                        ) : (
                            <div className={`${styles.card} ${styles.cardFull}`}>
                                <div className={styles.itineraryList}>
                                    {itineraries.map(itin => (
                                        <div key={itin.id} className={styles.itineraryCard}>
                                            <div className={styles.eventDetails}>
                                                <div className={styles.eventTitle}>
                                                    {itin.flight ? `${itin.flight.origin} → ${itin.flight.destination}` : 'Trip'}
                                                    {itin.hotel ? ` + ${itin.hotel.name.substring(0, 30)}` : ''}
                                                </div>
                                                <div className={styles.eventLoc}>
                                                    {itin.flight?.departDate ? new Date(itin.flight.departDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                                                    {itin.flight?.returnDate ? ` – ${new Date(itin.flight.returnDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '4px' }}>
                                                    {itin.travelers.join(', ')}
                                                    {itin.flight ? ` • ${itin.flight.carrier}` : ''}
                                                </div>
                                            </div>
                                            <div className={styles.serviceStatusRow}>
                                                {itin.flight && (
                                                    <span className={`${styles.statusPill} ${styles.statusSuccess}`}>
                                                        <Plane size={14} /> Flight {itin.flight.price > 0 ? `${itin.flight.currency === 'CAD' ? 'C' : ''}$${itin.flight.price.toFixed(0)}` : 'Booked'}
                                                    </span>
                                                )}
                                                {itin.hotel && (
                                                    <span className={`${styles.statusPill} ${styles.statusSuccess}`}>
                                                        <Hotel size={14} /> Hotel {itin.hotel.price > 0 ? `$${itin.hotel.price.toFixed(0)}` : 'Booked'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'travelers':
                return (
                    <div className={styles.tabContentBlock}>
                        <div className={styles.welcomeSection}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                                <div>
                                    <h1 className={styles.pageTitle}>Travelers</h1>
                                    <p className={styles.pageSubtitle}>Manage profiles for athletes, parents, coaches, and team members.</p>
                                </div>
                                {!isAddingTraveler && (
                                    <button className={styles.addTravelerHeaderBtn} onClick={() => { resetTravelerForm(); setIsAddingTraveler(true); }}>
                                        <UserPlus size={18} /> Add Traveler
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Add/Edit Form */}
                        {isAddingTraveler && (
                            <div className={`${styles.card} ${styles.cardFull}`}>
                                <h3 className={styles.cardTitle}>{editingTravelerId ? 'Edit Traveler' : 'Add New Traveler'}</h3>

                                <div className={styles.tFormGrid}>
                                    <div className={styles.tFormGroup}>
                                        <label className={styles.tFormLabel}>First Name *</label>
                                        <input type="text" className={styles.tFormInput} placeholder="First name" value={travelerForm.firstName} onChange={(e) => setTravelerForm({ ...travelerForm, firstName: e.target.value })} />
                                    </div>
                                    <div className={styles.tFormGroup}>
                                        <label className={styles.tFormLabel}>Last Name *</label>
                                        <input type="text" className={styles.tFormInput} placeholder="Last name" value={travelerForm.lastName} onChange={(e) => setTravelerForm({ ...travelerForm, lastName: e.target.value })} />
                                    </div>
                                </div>

                                <div className={styles.tFormGrid}>
                                    <div className={styles.tFormGroup}>
                                        <label className={styles.tFormLabel}>Role *</label>
                                        <div className={styles.tRoleRow}>
                                            {TRAVELER_ROLES.map(r => (
                                                <button key={r.value} className={`${styles.tRoleChip} ${travelerForm.role === r.value ? styles.tRoleChipActive : ''}`} onClick={() => setTravelerForm({ ...travelerForm, role: r.value as Traveler['role'] })}>
                                                    {r.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={styles.tFormGroup}>
                                        <label className={styles.tFormLabel}>Email</label>
                                        <input type="email" className={styles.tFormInput} placeholder="email@example.com" value={travelerForm.email} onChange={(e) => setTravelerForm({ ...travelerForm, email: e.target.value })} />
                                    </div>
                                </div>

                                <button type="button" className={styles.tToggleDetails} onClick={() => setShowMoreDetails(!showMoreDetails)}>
                                    {showMoreDetails ? 'Hide' : 'Show'} Additional Details
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showMoreDetails ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9" /></svg>
                                </button>

                                {showMoreDetails && (
                                    <>
                                        <div className={styles.tFormGrid}>
                                            <div className={styles.tFormGroup}>
                                                <label className={styles.tFormLabel}>Date of Birth</label>
                                                <input type="date" className={styles.tFormInput} value={travelerForm.dateOfBirth} onChange={(e) => setTravelerForm({ ...travelerForm, dateOfBirth: e.target.value })} />
                                            </div>
                                            <div className={styles.tFormGroup}>
                                                <label className={styles.tFormLabel}>Gender</label>
                                                <div className={styles.tGenderRow}>
                                                    <button className={`${styles.tGenderBtn} ${travelerForm.gender === 'M' ? styles.tGenderBtnActive : ''}`} onClick={() => setTravelerForm({ ...travelerForm, gender: 'M' })}>Male</button>
                                                    <button className={`${styles.tGenderBtn} ${travelerForm.gender === 'F' ? styles.tGenderBtnActive : ''}`} onClick={() => setTravelerForm({ ...travelerForm, gender: 'F' })}>Female</button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.tFormGrid}>
                                            <div className={styles.tFormGroup}>
                                                <label className={styles.tFormLabel}>Phone</label>
                                                <input type="tel" className={styles.tFormInput} placeholder="+1 (234) 567-8900" value={travelerForm.phone} onChange={(e) => setTravelerForm({ ...travelerForm, phone: e.target.value })} />
                                            </div>
                                            <div className={styles.tFormGroup}>
                                                <label className={styles.tFormLabel}>Nationality</label>
                                                <input type="text" className={styles.tFormInput} placeholder="e.g. US, CA, GB" value={travelerForm.nationality} onChange={(e) => setTravelerForm({ ...travelerForm, nationality: e.target.value })} />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className={styles.tFormActions}>
                                    <button className={styles.tCancelBtn} onClick={resetTravelerForm}>Cancel</button>
                                    <button className="geometric-btn" style={{ padding: '14px 32px', fontSize: '0.9rem' }} onClick={editingTravelerId ? handleUpdateTraveler : handleAddTraveler} disabled={!travelerForm.firstName.trim() || !travelerForm.lastName.trim()}>
                                        {editingTravelerId ? 'Save Changes' : 'Add Traveler'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Traveler List */}
                        {travelers.length === 0 && !isAddingTraveler ? (
                            <div className={`${styles.card} ${styles.cardFull}`} style={{ textAlign: 'center', padding: '64px 32px' }}>
                                <Users size={48} strokeWidth={1} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                <h3 style={{ fontSize: '1.25rem', color: 'var(--isa-black)', marginBottom: '8px' }}>No Travelers Yet</h3>
                                <p style={{ color: '#888', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                                    Add athletes, parents, coaches, and team members to quickly include them in your bookings.
                                </p>
                                <button className="geometric-btn" style={{ padding: '16px 32px', fontSize: '0.9rem' }} onClick={() => { resetTravelerForm(); setIsAddingTraveler(true); }}>
                                    <UserPlus size={18} /> Add Your First Traveler
                                </button>
                            </div>
                        ) : travelers.length > 0 && (() => {
                            const q = searchQuery.toLowerCase().trim();
                            const filtered = q ? travelers.filter(t => `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) || getRoleLabel(t.role).toLowerCase().includes(q) || t.email.toLowerCase().includes(q)) : travelers;
                            return (
                            <div className={`${styles.card} ${styles.cardFull}`}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 className={styles.cardTitle} style={{ marginBottom: 0 }}>{q ? `${filtered.length} of ${travelers.length}` : travelers.length} Traveler{(q ? filtered.length : travelers.length) !== 1 ? 's' : ''}{q ? ` matching "${searchQuery}"` : ''}</h3>
                                </div>
                                {filtered.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                                        <Search size={32} strokeWidth={1} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                                        <p style={{ fontSize: '0.9rem' }}>No travelers match &ldquo;{searchQuery}&rdquo;</p>
                                    </div>
                                ) : (
                                <div className={styles.tList}>
                                    {filtered.map(t => (
                                        <div key={t.id} className={styles.tCard}>
                                            <div className={styles.tCardLeft}>
                                                <div className={styles.tCardAvatar} style={{ background: `${ROLE_COLORS[t.role] || '#999'}15`, color: ROLE_COLORS[t.role] || '#999' }}>
                                                    {getInitials(t.firstName, t.lastName)}
                                                </div>
                                                <div className={styles.tCardInfo}>
                                                    <div className={styles.tCardName}>{t.firstName} {t.lastName}</div>
                                                    <div className={styles.tCardMeta}>
                                                        <span className={styles.tCardRole} style={{ color: ROLE_COLORS[t.role] || '#999' }}>{getRoleLabel(t.role)}</span>
                                                        {t.email && <span className={styles.tCardEmail}>{t.email}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.tCardActions}>
                                                <button className={styles.tEditBtn} onClick={() => startEdit(t)}>Edit</button>
                                                <button className={styles.tDeleteBtn} onClick={() => handleDeleteTraveler(t.id)}>Remove</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                )}
                            </div>
                            );
                        })()}
                    </div>
                );
            case 'invoices':
                return (
                    <div className={styles.tabContentBlock}>
                        <div className={styles.welcomeSection}>
                            <h1 className={styles.pageTitle}>Invoices</h1>
                            <p className={styles.pageSubtitle}>View past transactions, download receipts, and manage billing securely.</p>
                        </div>
                        <div className={`${styles.card} ${styles.cardFull}`} style={{ minHeight: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center', color: '#888', maxWidth: '400px' }}>
                                <FileText size={48} strokeWidth={1} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                <h3 style={{ fontSize: '1.25rem', color: 'var(--isa-black)', marginBottom: '8px', fontFamily: 'var(--font-sans)', textTransform: 'none', letterSpacing: 0 }}>No Invoices Yet</h3>
                                <p style={{ lineHeight: 1.5 }}>Invoices and receipts will appear here automatically after you complete a booking.</p>
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
                    <div className={styles.logo} onClick={() => setActiveTab('overview')} style={{ cursor: 'pointer' }}>
                        ISA<span>.</span>TRAVEL
                    </div>
                    <nav className={styles.nav}>
                        <button type="button" onClick={() => setActiveTab('overview')} className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`}><LayoutGrid size={20} strokeWidth={1.5} /> Overview</button>
                        <button type="button" onClick={() => setActiveTab('flights')} className={`${styles.navItem} ${activeTab === 'flights' ? styles.active : ''}`}><Plane size={20} strokeWidth={1.5} /> Flights</button>
                        <button type="button" onClick={() => setActiveTab('hotels')} className={`${styles.navItem} ${activeTab === 'hotels' ? styles.active : ''}`}><Hotel size={20} strokeWidth={1.5} /> Hotels</button>
                        <button type="button" onClick={() => setActiveTab('itineraries')} className={`${styles.navItem} ${activeTab === 'itineraries' ? styles.active : ''}`}><ArrowRight size={20} strokeWidth={1.5} /> Itineraries</button>
                        <button type="button" onClick={() => setActiveTab('travelers')} className={`${styles.navItem} ${activeTab === 'travelers' ? styles.active : ''}`}><Users size={20} strokeWidth={1.5} /> Travelers</button>
                        <button type="button" onClick={() => setActiveTab('invoices')} className={`${styles.navItem} ${activeTab === 'invoices' ? styles.active : ''}`}><FileText size={20} strokeWidth={1.5} /> Invoices</button>
                    </nav>
                </div>

                <div className={styles.sidebarBottom}>
                    <div className={styles.userCard}>
                        <div className={styles.avatar}>{user ? getInitials(user.firstName, user.lastName) : 'JS'}</div>
                        <div className={styles.userInfo}>
                            <div className={styles.userName}>{user ? `${user.firstName} ${user.lastName}` : 'John Smith'}</div>
                            <div className={styles.userRole}>{user?.role ? getRoleLabel(user.role) : 'Member'}</div>
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
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search travelers..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (e.target.value.trim()) setActiveTab('travelers');
                            }}
                        />
                    </div>
                    <button className={styles.bookBtn} onClick={() => router.push('/booking')}>
                        Book New Trip <ArrowRight size={18} strokeWidth={2} />
                    </button>
                </header>

                <div className={styles.dashboardGrid}>
                    {renderContent()}
                </div>
            </div>

            {detailHotel && (
                <HotelDetailModal
                    hotelId={detailHotel.hotelId}
                    hotelName={detailHotel.name}
                    hotelImage={detailHotel.image}
                    hotelStars={detailHotel.stars}
                    hotelAddress={detailHotel.address}
                    checkin={hotelCheckin}
                    checkout={hotelCheckout}
                    rates={extractRoomRates(detailHotel.hotelId)}
                    onClose={() => setDetailHotel(null)}
                    enableCheckout={true}
                    onBookingComplete={(data) => {
                        try {
                            const existing = JSON.parse(localStorage.getItem('isa_itineraries') || '[]');
                            existing.unshift({
                                id: `itin-${Date.now()}`,
                                createdAt: new Date().toISOString(),
                                status: 'confirmed',
                                travelers: [],
                                flight: null,
                                hotel: { name: data.hotelName, checkin: data.checkin, checkout: data.checkout, price: data.price, currency: data.currency },
                            });
                            localStorage.setItem('isa_itineraries', JSON.stringify(existing));
                            setItineraries(existing);
                        } catch { /* */ }
                    }}
                />
            )}

            {isContactOpen && (
                <div className={styles.contactOverlay}>
                    <button className={styles.closeOverlayBtn} onClick={() => setIsContactOpen(false)}><X size={24} /></button>
                    <div className={styles.contactLeft}>
                        <h2 className={styles.contactTitle}>Get in Touch</h2>
                        <p className={styles.contactSubtitle}>Our dedicated support team is here to help you with your travel arrangements 24/7.</p>
                        <div className={styles.contactMethodRow}>
                            <div className={styles.contactMethodIcon}><Phone size={24} /></div>
                            <div className={styles.contactMethodInfo}>
                                <div className={styles.contactMethodLabel}>Global Support Phone</div>
                                <div className={styles.contactMethodValue}>+1 (800) 555-0199</div>
                            </div>
                        </div>
                        <div className={styles.contactMethodRow}>
                            <div className={styles.contactMethodIcon}><Phone size={24} /></div>
                            <div className={styles.contactMethodInfo}>
                                <div className={styles.contactMethodLabel}>VIP Support Line</div>
                                <div className={styles.contactMethodValue}>+1 (800) 555-0299</div>
                            </div>
                        </div>
                        <div className={styles.contactMethodRow}>
                            <div className={styles.contactMethodIcon}><Mail size={24} /></div>
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
                                <div className={`${styles.chatMessage} ${styles.chatMessageBot}`}>Hello{user ? ` ${user.firstName}` : ''}, I&apos;m your ISA travel assistant. How can I help you today?</div>
                            </div>
                            <div className={styles.chatInputArea}>
                                <input type="text" className={styles.chatInput} placeholder="Type your message..." />
                                <button className={styles.sendBtn}><Send size={20} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
