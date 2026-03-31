'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, Compass, User, Hotel, Loader2, ArrowLeft } from 'lucide-react';
import { searchAirports, getAirportInfo, getAirlineLogo, getAirlineInfo, formatPrice, type AirportInfo } from '@/lib/airlines';
import styles from './booking.module.css';

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
}

interface TravelerInfo {
    firstName: string;
    lastName: string;
    gender: 'M' | 'F' | '';
    dobMonth: string;
    dobDay: string;
    dobYear: string;
    email: string;
    phone: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE PARSERS
// ═══════════════════════════════════════════════════════════════════════════════

function parseFareNexusResponse(data: Record<string, unknown>): ParsedFlight[] {
    const flights: ParsedFlight[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseArr = data.response as any[];

    if (Array.isArray(responseArr) && responseArr.length > 0) {
        const status = responseArr[0]?.status as Record<string, unknown> | undefined;
        if (status && status.type === 'ERROR') return flights;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const itineraries = responseArr[0]?.sliceItinerary as any[];
        if (Array.isArray(itineraries)) {
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
    }

    return flights;
}

function parseLiteApiResponse(data: Record<string, unknown>): ParsedHotel[] {
    const hotels: ParsedHotel[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawHotels: any[] =
        (data.data as unknown[]) ??
        ((data.data as Record<string, unknown>)?.hotels as unknown[]) ??
        [];

    if (!Array.isArray(rawHotels)) return hotels;

    for (const h of rawHotels) {
        if (!h) continue;
        const rates = h.rates ?? h.offers ?? [];
        if (!Array.isArray(rates) || rates.length === 0) continue;

        const rate = rates[0];
        const offerId = rate.offerId ?? rate.offer_id ?? rate.id ?? '';
        if (!offerId) continue;

        const retailRate = rate.retailRate ?? rate.rate ?? {};
        const totalArr = retailRate.total ?? [];
        const priceObj = Array.isArray(totalArr) ? totalArr[0] : totalArr;
        let price = parseFloat(priceObj?.amount ?? rate.price ?? rate.totalPrice ?? '0');
        if (isNaN(price)) price = 0;
        const currency = priceObj?.currency ?? rate.currency ?? 'USD';

        const addr = h.address ?? {};
        const addressStr = typeof addr === 'string' ? addr : [addr.line1, addr.cityName].filter(Boolean).join(', ');

        hotels.push({
            hotelId: h.hotelId ?? h.id ?? '',
            name: h.name ?? 'Hotel',
            stars: h.starRating ?? h.stars ?? 0,
            address: addressStr,
            image: h.main_photo ?? h.mainPhoto ?? h.image ?? h.thumbnail ?? '',
            offerId,
            roomName: rate.name ?? rate.roomName ?? 'Standard Room',
            price,
            currency,
            boardType: rate.boardType ?? rate.board_type ?? 'RO',
        });
    }

    return hotels;
}

function extractTime(dateTimeStr: string): string {
    if (!dateTimeStr) return '';
    if (dateTimeStr.includes('T')) {
        const parts = dateTimeStr.split('T');
        return parts[1]?.substring(0, 5) ?? '';
    }
    if (dateTimeStr.includes(':') && dateTimeStr.length <= 5) return dateTimeStr;
    return dateTimeStr;
}

function extractDate(dateTimeStr: string): string {
    if (!dateTimeStr) return '';
    if (dateTimeStr.includes('T')) return dateTimeStr.split('T')[0];
    if (dateTimeStr.match(/^\d{4}-\d{2}-\d{2}/)) return dateTimeStr.substring(0, 10);
    return dateTimeStr;
}

function calculateDuration(segments: ParsedSegment[]): string {
    if (segments.length === 0) return '';
    return `${segments.length} seg${segments.length > 1 ? 's' : ''}`;
}

function formatDuration(dur: string | number): string {
    if (typeof dur === 'number') {
        const h = Math.floor(dur / 60);
        const m = dur % 60;
        return `${h}h ${m}m`;
    }
    return String(dur);
}

function formatStops(stops: number): string {
    if (stops === 0) return 'Nonstop';
    return `${stops} stop${stops > 1 ? 's' : ''}`;
}

function formatBoardType(bt: string): string {
    const map: Record<string, string> = {
        'RO': 'Room Only', 'BB': 'Breakfast Included', 'HB': 'Half Board',
        'FB': 'Full Board', 'AI': 'All Inclusive',
    };
    return map[bt?.toUpperCase()] ?? bt ?? 'Room Only';
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED CONSTANTS & SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_HEADERS = [
    { key: 'sun', label: 'S' }, { key: 'mon', label: 'M' }, { key: 'tue', label: 'T' },
    { key: 'wed', label: 'W' }, { key: 'thu', label: 'T' }, { key: 'fri', label: 'F' },
    { key: 'sat', label: 'S' }
];

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: MONTH_NAMES[i],
}));
const dayOptions = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const yearOptions = Array.from({ length: 100 }, (_, i) => ({ value: String(2026 - i), label: String(2026 - i) }));

const CLASS_OPTIONS = [
    { value: 'ECO', label: 'Economy' },
    { value: 'PEY', label: 'Premium Economy' },
    { value: 'BUS', label: 'Business' },
    { value: 'FIR', label: 'First' },
];

const ArrowIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
        <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
);

const CheckIcon = ({ color = "var(--isa-red)" }: { color?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="square">
        <path d="M20 6L9 17l-5-5" />
    </svg>
);

const CustomSelect = ({ value, onChange, options, placeholder }: { value: string; onChange: (val: string) => void; options: { value: string; label: string }[]; placeholder: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className={styles.customSelectWrapper}>
            {isOpen && <div className={styles.selectOverlay} onClick={() => setIsOpen(false)} />}
            <div className={styles.customSelectValue} onClick={() => setIsOpen(!isOpen)}>
                {value ? options.find(o => o.value === value)?.label : <span className={styles.placeholder}>{placeholder}</span>}
                <div className={styles.dropdownIcon} style={{ transform: isOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </div>
            </div>
            {isOpen && (
                <div className={styles.customSelectList}>
                    {options.map(opt => (
                        <div key={opt.value} className={`${styles.customSelectOption} ${value === opt.value ? styles.selected : ''}`} onClick={() => { onChange(opt.value); setIsOpen(false); }}>
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

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

    const setToday = (e: React.MouseEvent) => {
        e.stopPropagation();
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (minDate && todayStr < minDate) return;
        onChange(todayStr);
        setIsOpen(false);
    };
    const clearDate = (e: React.MouseEvent) => { e.stopPropagation(); onChange(''); setIsOpen(false); };

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

    const isDateDisabled = (year: number, month: number, day: number) => {
        if (!minDate) return false;
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` < minDate;
    };

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`empty-${i}`} className={styles.calendarDayEmpty} />);
    for (let i = 1; i <= daysInMonth; i++) {
        const currentDateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const isSelected = value === currentDateStr;
        const disabled = isDateDisabled(viewDate.getFullYear(), viewDate.getMonth(), i);
        days.push(
            <div key={i} className={`${styles.calendarDay} ${isSelected ? styles.calendarDaySelected : ''} ${disabled ? styles.calendarDayDisabled : ''}`}
                onClick={(e) => { e.stopPropagation(); if (!disabled) { onChange(currentDateStr); setIsOpen(false); } }}>
                {i}
            </div>
        );
    }

    const formatDisplay = (val: string) => { if (!val) return ""; const [y, m, d] = val.split('-'); return `${m}/${d}/${y}`; };

    return (
        <div className={styles.customSelectWrapper}>
            {isOpen && <div className={styles.selectOverlay} onClick={() => setIsOpen(false)} />}
            <div className={styles.customSelectValue} onClick={handleOpen}>
                {value ? formatDisplay(value) : <span className={styles.placeholder}>{placeholder}</span>}
                <div className={styles.dropdownIcon} style={{ opacity: 0.5 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                </div>
            </div>
            {isOpen && (
                <div className={styles.calendarPopover}>
                    <div className={styles.calendarHeader}>
                        <div className={styles.calendarTitle}>{MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()} <span style={{ fontSize: '0.7em', marginLeft: '4px' }}>▼</span></div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className={styles.calendarNavBtn} onClick={prevMonth} style={{ opacity: canGoPrev ? 1 : 0.3, pointerEvents: canGoPrev ? 'auto' : 'none' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
                            </button>
                            <button className={styles.calendarNavBtn} onClick={nextMonth}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>
                            </button>
                        </div>
                    </div>
                    <div className={styles.calendarGrid}>
                        {DAY_HEADERS.map(d => (<div key={d.key} className={styles.calendarDayName}>{d.label}</div>))}
                        {days}
                    </div>
                    <div className={styles.calendarFooter}>
                        <button className={styles.calendarFooterBtn} onClick={clearDate}>Clear</button>
                        <button className={styles.calendarFooterBtn} onClick={setToday}>Today</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const AirportSearchInput = ({ value, onChange, placeholder }: { value: string; onChange: (code: string, label: string) => void; placeholder: string }) => {
    const [query, setQuery] = useState('');
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
        setQuery(val);
        setDisplayValue(val);
        if (val.length >= 2) {
            setResults(searchAirports(val, 8));
            setIsOpen(true);
        } else {
            setResults([]);
            setIsOpen(false);
        }
    };

    const handleSelect = (airport: AirportInfo) => {
        onChange(airport.code, `${airport.city} (${airport.code})`);
        setDisplayValue(`${airport.city} (${airport.code})`);
        setQuery('');
        setResults([]);
        setIsOpen(false);
    };

    return (
        <div className={styles.airportInputWrapper} ref={wrapperRef}>
            <div className={styles.airportInputIcon}>
                <Plane size={18} strokeWidth={1.5} />
            </div>
            <input
                type="text"
                className={styles.airportInput}
                placeholder={placeholder}
                value={displayValue}
                onChange={(e) => handleInput(e.target.value)}
                onFocus={() => { if (results.length > 0) setIsOpen(true); }}
            />
            {isOpen && results.length > 0 && (
                <div className={styles.airportDropdown}>
                    {results.map(a => (
                        <div key={a.code} className={styles.airportOption} onClick={() => handleSelect(a)}>
                            <span className={styles.airportCode}>{a.code}</span>
                            <span className={styles.airportName}>{a.city} — {a.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN BOOKING COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function Booking() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [bookingMode, setBookingMode] = useState<'' | 'self' | 'agent'>('');

    // ── Self-service state ─────────────────────────────────────────────────
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [departDate, setDepartDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [tripType, setTripType] = useState<'RT' | 'OW'>('RT');
    const [travelClass, setTravelClass] = useState('ECO');
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);

    const [flightResults, setFlightResults] = useState<ParsedFlight[]>([]);
    const [selectedFlight, setSelectedFlight] = useState<ParsedFlight | null>(null);
    const [isSearchingFlights, setIsSearchingFlights] = useState(false);
    const [flightError, setFlightError] = useState('');
    const [hasSearchedFlights, setHasSearchedFlights] = useState(false);

    const [wantsHotel, setWantsHotel] = useState<boolean | null>(null);
    const [hotelCity, setHotelCity] = useState('');
    const [hotelCountry, setHotelCountry] = useState('US');
    const [hotelResults, setHotelResults] = useState<ParsedHotel[]>([]);
    const [selectedHotel, setSelectedHotel] = useState<ParsedHotel | null>(null);
    const [isSearchingHotels, setIsSearchingHotels] = useState(false);
    const [hotelError, setHotelError] = useState('');
    const [hasSearchedHotels, setHasSearchedHotels] = useState(false);

    const [travelers, setTravelers] = useState<TravelerInfo[]>([]);
    const [isBooking, setIsBooking] = useState(false);
    const [bookingError, setBookingError] = useState('');

    // ── Agent-assisted state ───────────────────────────────────────────────
    const [agentForm, setAgentForm] = useState({
        name: '', email: '', phone: '', startDate: '', endDate: '', agentNotes: ''
    });

    const todayStr = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    const isValidEmail = useCallback((email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), []);
    const isValidPhone = useCallback((phone: string) => /^\+?[0-9\s\-()]{7,20}$/.test(phone), []);

    const formatPhoneNumber = useCallback((value: string, previousValue: string) => {
        if (!value) return value;
        if (previousValue && value.length < previousValue.length) return value;
        const cleaned = value.replace(/[^\d+]/g, '');
        const num = cleaned.startsWith('+') ? '+' + cleaned.replace(/\+/g, '') : cleaned;
        if (num.startsWith('+1')) {
            const digits = num.replace(/\D/g, '').substring(1);
            const match = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
            if (match) return `+1${match[1] ? ` (${match[1]}` : ''}${match[2] ? `) ${match[2]}` : ''}${match[3] ? `-${match[3]}` : ''}`;
        } else if (!num.startsWith('+') && num.length > 0) {
            const match = num.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
            if (match) { let f = ''; if (match[1]) f += `(${match[1]}`; if (match[2]) f += `) ${match[2]}`; if (match[3]) f += `-${match[3]}`; return f; }
        } else if (num.startsWith('+')) {
            const digits = num.substring(1);
            const match = digits.match(/^(\d{1,3})(\d{0,4})(\d{0,4})(\d{0,4})$/);
            if (match) return `+${match[1]}${match[2] ? ` ${match[2]}` : ''}${match[3] ? ` ${match[3]}` : ''}${match[4] ? ` ${match[4]}` : ''}`;
        }
        return num;
    }, []);

    // Clear return date if departure moves past it
    useEffect(() => {
        if (departDate && returnDate && returnDate < departDate) {
            setReturnDate('');
        }
    }, [departDate, returnDate]);

    // Clear return date when switching to one-way
    useEffect(() => {
        if (tripType === 'OW') setReturnDate('');
    }, [tripType]);

    // Clear agent return date if departure moves past it
    useEffect(() => {
        if (agentForm.startDate && agentForm.endDate && agentForm.endDate < agentForm.startDate) {
            setAgentForm(prev => ({ ...prev, endDate: '' }));
        }
    }, [agentForm.startDate, agentForm.endDate]);

    // Initialize traveler array when moving to details step
    useEffect(() => {
        if (bookingMode === 'self' && step === 3 && travelers.length === 0) {
            const totalPax = adults + children;
            setTravelers(Array.from({ length: totalPax }, () => ({
                firstName: '', lastName: '', gender: '' as const, dobMonth: '', dobDay: '', dobYear: '', email: '', phone: ''
            })));
        }
    }, [step, bookingMode, adults, children, travelers.length]);

    // Auto-fill hotel city from destination
    useEffect(() => {
        if (destination && !hotelCity) {
            const info = getAirportInfo(destination);
            setHotelCity(info.city);
            setHotelCountry(info.country || 'US');
        }
    }, [destination, hotelCity]);

    // ── API Calls ──────────────────────────────────────────────────────────

    const searchFlights = async () => {
        setIsSearchingFlights(true);
        setFlightError('');
        setFlightResults([]);
        setSelectedFlight(null);
        setHasSearchedFlights(true);

        try {
            const passengers: { type: 'ADT' | 'CNN' | 'INF'; quantity: number }[] = [{ type: 'ADT', quantity: adults }];
            if (children > 0) passengers.push({ type: 'CNN', quantity: children });

            const res = await fetch('/api/farenexus/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    origin, destination, departureDate: departDate,
                    returnDate: tripType === 'RT' ? returnDate : undefined,
                    passengers, tripType, travelClass: travelClass, pos: 'CA',
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Search failed');
            const parsed = parseFareNexusResponse(data);
            setFlightResults(parsed);
            if (parsed.length === 0) setFlightError('No flights found for this route. Try different dates or airports.');
        } catch (err) {
            setFlightError(err instanceof Error ? err.message : 'Flight search failed. Please try again.');
        } finally {
            setIsSearchingFlights(false);
        }
    };

    const searchHotels = async () => {
        setIsSearchingHotels(true);
        setHotelError('');
        setHotelResults([]);
        setSelectedHotel(null);
        setHasSearchedHotels(true);

        try {
            const checkin = departDate;
            const checkout = returnDate || (() => {
                const d = new Date(departDate);
                d.setDate(d.getDate() + 1);
                return d.toISOString().split('T')[0];
            })();

            const res = await fetch('/api/hotels/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cityName: hotelCity, countryCode: hotelCountry,
                    checkin, checkout, adults, rooms: 1, currency: 'USD',
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Hotel search failed');
            const parsed = parseLiteApiResponse(data);
            setHotelResults(parsed);
            if (parsed.length === 0) setHotelError('No hotels found. Try a different city or dates.');
        } catch (err) {
            setHotelError(err instanceof Error ? err.message : 'Hotel search failed. Please try again.');
        } finally {
            setIsSearchingHotels(false);
        }
    };

    const confirmBooking = async () => {
        setIsBooking(true);
        setBookingError('');

        try {
            if (!selectedFlight) throw new Error('No flight selected');
            const mainTraveler = travelers[0];
            if (!mainTraveler?.firstName || !mainTraveler?.lastName) throw new Error('Traveler details incomplete');

            // Step 1: Review flight → get bookKey
            const reviewRes = await fetch('/api/farenexus/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewKey: selectedFlight.reviewKey }),
            });
            const reviewData = await reviewRes.json();
            if (!reviewRes.ok) throw new Error(reviewData.error || 'Flight review failed');

            const bookKey = reviewData.bookKey ?? reviewData.book_key ?? reviewData.data?.bookKey ?? '';
            if (!bookKey) throw new Error('Could not retrieve booking key from review');

            // Step 2: Book flight
            const bookRes = await fetch('/api/farenexus/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookKey,
                    passengers: travelers.map(t => ({
                        firstName: t.firstName, lastName: t.lastName,
                        gender: t.gender || 'M',
                        dateOfBirth: `${t.dobYear}-${t.dobMonth}-${String(t.dobDay).padStart(2, '0')}`,
                        email: t.email, phone: t.phone,
                    })),
                }),
            });
            const bookData = await bookRes.json();
            if (!bookRes.ok) throw new Error(bookData.error || 'Flight booking failed');

            // Step 3: Book hotel (if selected)
            if (selectedHotel) {
                const prebookRes = await fetch('/api/hotels/prebook', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ offerId: selectedHotel.offerId }),
                });
                const prebookData = await prebookRes.json();
                if (prebookRes.ok) {
                    const prebookId = prebookData.data?.prebookId ?? prebookData.prebookId ?? '';
                    if (prebookId) {
                        await fetch('/api/hotels/book', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                prebookId,
                                guestInfo: { firstName: mainTraveler.firstName, lastName: mainTraveler.lastName, email: mainTraveler.email },
                                payment: { method: 'ACC_CREDIT_CARD' },
                            }),
                        });
                    }
                }
            }

            setStep(5);
        } catch (err) {
            setBookingError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
        } finally {
            setIsBooking(false);
        }
    };

    const updateTraveler = (index: number, field: keyof TravelerInfo, value: string) => {
        setTravelers(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const SELF_TOTAL = 5;
    const AGENT_TOTAL = 4;

    const MAX_PASSENGERS = 9;
    const canSearchFlights = origin && destination && origin !== destination && departDate && (tripType === 'OW' || returnDate);
    const isTravelerValid = (t: TravelerInfo) => t.firstName && t.lastName && t.gender && t.dobMonth && t.dobDay && t.dobYear && isValidEmail(t.email) && isValidPhone(t.phone);
    const allTravelersValid = travelers.length > 0 && travelers.every(isTravelerValid);

    // ── Render ─────────────────────────────────────────────────────────────

    const renderStep = () => {
        // ==================== STEP 0: BOOKING MODE ====================
        if (step === 0) {
            return (
                <div className={styles.stepContainer}>
                    <h2 className={styles.question}>How would you like to book?</h2>
                    <p className={styles.questionSub} style={{ marginTop: '-24px' }}>Choose the experience that works best for you.</p>
                    <div className={styles.modeGrid}>
                        <div className={`${styles.modeCard} ${bookingMode === 'self' ? styles.modeCardSelected : ''}`} onClick={() => setBookingMode('self')}>
                            <div className={styles.modeIcon}><Compass size={32} strokeWidth={1.5} /></div>
                            <div className={styles.modeTitle}>Self-Service</div>
                            <div className={styles.modeDesc}>Search and book your own flights and hotels in real-time.</div>
                            {bookingMode === 'self' && <div className={styles.modeCheck}><CheckIcon color="white" /></div>}
                        </div>
                        <div className={`${styles.modeCard} ${bookingMode === 'agent' ? styles.modeCardSelected : ''}`} onClick={() => setBookingMode('agent')}>
                            <div className={styles.modeIcon}><User size={32} strokeWidth={1.5} /></div>
                            <div className={styles.modeTitle}>Agent-Assisted</div>
                            <div className={styles.modeDesc}>Let our travel agent handle everything for you.</div>
                            {bookingMode === 'agent' && <div className={styles.modeCheck}><CheckIcon color="white" /></div>}
                        </div>
                    </div>
                    <div className={styles.actions}>
                        <button className="geometric-btn" onClick={() => setStep(1)} disabled={!bookingMode}
                            style={{ width: '100%', opacity: bookingMode ? 1 : 0.5, pointerEvents: bookingMode ? 'auto' : 'none' }}>
                            Continue
                        </button>
                    </div>
                </div>
            );
        }

        // ==================== AGENT-ASSISTED FLOW ====================
        if (bookingMode === 'agent') {
            switch (step) {
                case 1:
                    return (
                        <div className={styles.stepContainer}>
                            <div className={styles.stepLabel}>STEP 01/{String(AGENT_TOTAL).padStart(2, '0')}</div>
                            <h2 className={styles.question}>What is your full legal name?</h2>
                            <input type="text" className={styles.inputField} placeholder="First and Last Name" value={agentForm.name} onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })} autoFocus />
                            <div className={styles.actions}>
                                <button className={styles.backBtn} onClick={() => setStep(0)}><ArrowLeft size={18} /> Back</button>
                                <button className="circle-arrow-btn" onClick={() => setStep(2)} disabled={!agentForm.name} style={{ opacity: agentForm.name ? 1 : 0.5, pointerEvents: agentForm.name ? 'auto' : 'none' }}><ArrowIcon /></button>
                            </div>
                        </div>
                    );
                case 2:
                    return (
                        <div className={styles.stepContainer}>
                            <div className={styles.stepLabel}>STEP 02/{String(AGENT_TOTAL).padStart(2, '0')}</div>
                            <h2 className={styles.question}>How can we reach you?</h2>
                            <input type="email" className={styles.inputField} placeholder="Email Address" value={agentForm.email} onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })} autoFocus />
                            <input type="tel" className={styles.inputField} placeholder="+1 (234) 567-8900" value={agentForm.phone} onChange={(e) => setAgentForm({ ...agentForm, phone: formatPhoneNumber(e.target.value, agentForm.phone) })} />
                            <div className={styles.actions}>
                                <button className={styles.backBtn} onClick={() => setStep(1)}><ArrowLeft size={18} /> Back</button>
                                <button className="circle-arrow-btn" onClick={() => setStep(3)} disabled={!isValidEmail(agentForm.email) || !agentForm.phone} style={{ opacity: (isValidEmail(agentForm.email) && agentForm.phone) ? 1 : 0.5, pointerEvents: (isValidEmail(agentForm.email) && agentForm.phone) ? 'auto' : 'none' }}><ArrowIcon /></button>
                            </div>
                        </div>
                    );
                case 3:
                    return (
                        <div className={styles.stepContainer}>
                            <div className={styles.stepLabel}>STEP 03/{String(AGENT_TOTAL).padStart(2, '0')}</div>
                            <h2 className={styles.question}>Travel dates & notes</h2>
                            <p className={styles.questionSub}>Approximate dates are fine — your agent will confirm.</p>
                            <div className={styles.dateRow}>
                                <div style={{ width: '100%' }}><label className={styles.dateLabel}>Departure Date</label><CustomDatePicker value={agentForm.startDate} onChange={(val) => setAgentForm({ ...agentForm, startDate: val })} placeholder="mm/dd/yyyy" minDate={todayStr} /></div>
                                <div style={{ width: '100%' }}><label className={styles.dateLabel}>Return Date</label><CustomDatePicker value={agentForm.endDate} onChange={(val) => setAgentForm({ ...agentForm, endDate: val })} placeholder="mm/dd/yyyy" minDate={agentForm.startDate} /></div>
                            </div>
                            <textarea className={styles.textArea} placeholder="Tell your agent what you need: number of travelers, flight preferences, hotel requirements, special requests..." value={agentForm.agentNotes} onChange={(e) => setAgentForm({ ...agentForm, agentNotes: e.target.value })} rows={5} />
                            <div className={styles.actions}>
                                <button className={styles.backBtn} onClick={() => setStep(2)}><ArrowLeft size={18} /> Back</button>
                                <button className="circle-arrow-btn" onClick={() => setStep(4)}><ArrowIcon /></button>
                            </div>
                        </div>
                    );
                case 4:
                    return (
                        <div className={`${styles.stepContainer} ${styles.successScreen}`}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(230, 57, 70, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckIcon /></div>
                            </div>
                            <h2 className={styles.question} style={{ marginBottom: '16px' }}>Request Received.</h2>
                            <p className={styles.optionDesc} style={{ fontSize: '1.1rem', marginBottom: '40px' }}>
                                Thank you, {agentForm.name}. A dedicated CTMS travel agent will contact you within 1 hour to coordinate your full itinerary.
                            </p>
                            <button className="geometric-btn" onClick={() => router.push('/')} style={{ width: '100%' }}>Return to Home</button>
                        </div>
                    );
            }
            return null;
        }

        // ==================== SELF-SERVICE FLOW ====================
        switch (step) {
            // ── Step 1: Flight Search & Results ───────────────────────────
            case 1:
                return (
                    <div className={styles.stepContainer} style={{ maxWidth: '900px' }}>
                        <div className={styles.stepLabel}>STEP 01/{String(SELF_TOTAL).padStart(2, '0')}</div>
                        <h2 className={styles.question}>Search Flights</h2>
                        <p className={styles.questionSub}>Find the best available flights for your trip.</p>

                        {/* Trip Type Toggle */}
                        <div className={styles.tripTypeRow}>
                            <button className={`${styles.tripTypeBtn} ${tripType === 'RT' ? styles.tripTypeBtnActive : ''}`} onClick={() => setTripType('RT')}>Round Trip</button>
                            <button className={`${styles.tripTypeBtn} ${tripType === 'OW' ? styles.tripTypeBtnActive : ''}`} onClick={() => setTripType('OW')}>One Way</button>
                        </div>

                        {/* Airport Inputs */}
                        <div className={styles.searchFormGrid}>
                            <div>
                                <label className={styles.dateLabel}>From</label>
                                <AirportSearchInput value={origin} onChange={(code) => setOrigin(code)} placeholder="City or airport code" />
                            </div>
                            <div>
                                <label className={styles.dateLabel}>To</label>
                                <AirportSearchInput value={destination} onChange={(code) => setDestination(code)} placeholder="City or airport code" />
                            </div>
                        </div>

                        {origin && destination && origin === destination && (
                            <div className={styles.searchError} style={{ marginTop: '-8px' }}>Origin and destination cannot be the same airport.</div>
                        )}

                        {/* Dates */}
                        <div className={styles.searchFormGrid}>
                            <div>
                                <label className={styles.dateLabel}>Departure</label>
                                <CustomDatePicker value={departDate} onChange={setDepartDate} placeholder="mm/dd/yyyy" minDate={todayStr} />
                            </div>
                            {tripType === 'RT' && (
                                <div>
                                    <label className={styles.dateLabel}>Return</label>
                                    <CustomDatePicker value={returnDate} onChange={setReturnDate} placeholder="mm/dd/yyyy" minDate={departDate} />
                                </div>
                            )}
                        </div>

                        {/* Class & Passengers */}
                        <div className={styles.searchFormGrid}>
                            <div>
                                <label className={styles.dateLabel}>Cabin Class</label>
                                <CustomSelect value={travelClass} onChange={setTravelClass} options={CLASS_OPTIONS} placeholder="Select class" />
                            </div>
                            <div>
                                <label className={styles.dateLabel}>Travelers</label>
                                <div className={styles.paxRow}>
                                    <div className={styles.paxControl}>
                                        <span className={styles.paxLabel}>Adults</span>
                                        <div className={styles.paxBtns}>
                                            <button className={styles.paxBtn} onClick={() => setAdults(Math.max(1, adults - 1))}>-</button>
                                            <span className={styles.paxCount}>{adults}</span>
                                            <button className={styles.paxBtn} onClick={() => setAdults(Math.min(MAX_PASSENGERS - children, adults + 1))} disabled={adults + children >= MAX_PASSENGERS}>+</button>
                                        </div>
                                    </div>
                                    <div className={styles.paxControl}>
                                        <span className={styles.paxLabel}>Children</span>
                                        <div className={styles.paxBtns}>
                                            <button className={styles.paxBtn} onClick={() => setChildren(Math.max(0, children - 1))}>-</button>
                                            <span className={styles.paxCount}>{children}</span>
                                            <button className={styles.paxBtn} onClick={() => setChildren(Math.min(MAX_PASSENGERS - adults, children + 1))} disabled={adults + children >= MAX_PASSENGERS}>+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search Button */}
                        <button className="geometric-btn" onClick={searchFlights} disabled={!canSearchFlights || isSearchingFlights}
                            style={{ width: '100%', marginBottom: '32px', opacity: canSearchFlights && !isSearchingFlights ? 1 : 0.5, pointerEvents: canSearchFlights && !isSearchingFlights ? 'auto' : 'none' }}>
                            {isSearchingFlights ? <><Loader2 size={20} className={styles.spinner} /> Searching Flights...</> : 'Search Flights'}
                        </button>

                        {/* Error */}
                        {flightError && <div className={styles.searchError}>{flightError}</div>}

                        {/* Loading */}
                        {isSearchingFlights && (
                            <div className={styles.loadingContainer}>
                                <Loader2 size={40} className={styles.spinner} />
                                <p className={styles.loadingText}>Searching across airlines...</p>
                            </div>
                        )}

                        {/* Results */}
                        {!isSearchingFlights && hasSearchedFlights && flightResults.length > 0 && (
                            <div className={styles.resultsSection}>
                                <div className={styles.resultsHeader}>
                                    <h3 className={styles.resultsTitle}>{flightResults.length} flight{flightResults.length !== 1 ? 's' : ''} found</h3>
                                </div>
                                <div className={styles.resultsList}>
                                    {flightResults.map(flight => (
                                        <div key={flight.id} className={`${styles.flightCard} ${selectedFlight?.id === flight.id ? styles.flightCardSelected : ''}`} onClick={() => setSelectedFlight(flight)}>
                                            <div className={styles.flightAirline}>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={flight.carrierLogo} alt={flight.carrierName} width={30} height={30} className={styles.airlineLogo} />
                                                <span className={styles.airlineName}>{flight.carrierName}</span>
                                            </div>
                                            <div className={styles.flightLegs}>
                                                <div className={styles.flightLeg}>
                                                    <div className={styles.flightTime}>
                                                        <span className={styles.flightTimeValue}>{flight.outbound.departTime || '--:--'}</span>
                                                        <span className={styles.flightAirportCode}>{flight.outbound.departAirport}</span>
                                                    </div>
                                                    <div className={styles.flightRoute}>
                                                        <span className={styles.flightDuration}>{formatDuration(flight.outbound.duration)}</span>
                                                        <div className={styles.flightLine}><div className={styles.flightDot} /><div className={styles.flightDash} /><div className={styles.flightDot} /></div>
                                                        <span className={styles.flightStops}>{formatStops(flight.outbound.stops)}</span>
                                                    </div>
                                                    <div className={styles.flightTime}>
                                                        <span className={styles.flightTimeValue}>{flight.outbound.arriveTime || '--:--'}</span>
                                                        <span className={styles.flightAirportCode}>{flight.outbound.arriveAirport}</span>
                                                    </div>
                                                </div>
                                                {flight.inbound && (
                                                    <div className={styles.flightLeg}>
                                                        <div className={styles.flightTime}>
                                                            <span className={styles.flightTimeValue}>{flight.inbound.departTime || '--:--'}</span>
                                                            <span className={styles.flightAirportCode}>{flight.inbound.departAirport}</span>
                                                        </div>
                                                        <div className={styles.flightRoute}>
                                                            <span className={styles.flightDuration}>{formatDuration(flight.inbound.duration)}</span>
                                                            <div className={styles.flightLine}><div className={styles.flightDot} /><div className={styles.flightDash} /><div className={styles.flightDot} /></div>
                                                            <span className={styles.flightStops}>{formatStops(flight.inbound.stops)}</span>
                                                        </div>
                                                        <div className={styles.flightTime}>
                                                            <span className={styles.flightTimeValue}>{flight.inbound.arriveTime || '--:--'}</span>
                                                            <span className={styles.flightAirportCode}>{flight.inbound.arriveAirport}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.flightPrice}>
                                                <span className={styles.flightPriceValue}>{formatPrice(flight.price, flight.currency)}</span>
                                                <span className={styles.flightPriceLabel}>per person</span>
                                            </div>
                                            {selectedFlight?.id === flight.id && (
                                                <div className={styles.flightCheck}><CheckIcon color="white" /></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Continue */}
                        {selectedFlight && (
                            <div className={styles.actions} style={{ marginTop: '24px' }}>
                                <button className={styles.backBtn} onClick={() => setStep(0)}><ArrowLeft size={18} /> Back</button>
                                <button className="geometric-btn" onClick={() => setStep(2)} style={{ flex: 1 }}>
                                    Continue with {selectedFlight.carrierName}
                                </button>
                            </div>
                        )}
                        {!selectedFlight && hasSearchedFlights && !isSearchingFlights && (
                            <div className={styles.actions}>
                                <button className={styles.backBtn} onClick={() => setStep(0)}><ArrowLeft size={18} /> Back</button>
                            </div>
                        )}
                        {!hasSearchedFlights && (
                            <div className={styles.actions}>
                                <button className={styles.backBtn} onClick={() => setStep(0)}><ArrowLeft size={18} /> Back</button>
                            </div>
                        )}
                    </div>
                );

            // ── Step 2: Hotel Search & Results ────────────────────────────
            case 2:
                return (
                    <div className={styles.stepContainer} style={{ maxWidth: '900px' }}>
                        <div className={styles.stepLabel}>STEP 02/{String(SELF_TOTAL).padStart(2, '0')}</div>
                        <h2 className={styles.question}>Need a Hotel?</h2>

                        {wantsHotel === null && (
                            <>
                                <p className={styles.questionSub}>Would you like us to find hotel accommodations?</p>
                                <div className={styles.modeGrid}>
                                    <div className={styles.modeCard} onClick={() => { setWantsHotel(true); searchHotels(); }}>
                                        <div className={styles.modeIcon}><Hotel size={32} strokeWidth={1.5} /></div>
                                        <div className={styles.modeTitle}>Yes, Find Hotels</div>
                                        <div className={styles.modeDesc}>Search for hotels near {hotelCity || 'your destination'}.</div>
                                    </div>
                                    <div className={styles.modeCard} onClick={() => { setWantsHotel(false); setStep(3); }}>
                                        <div className={styles.modeIcon}><Plane size={32} strokeWidth={1.5} /></div>
                                        <div className={styles.modeTitle}>No, Flights Only</div>
                                        <div className={styles.modeDesc}>Skip hotels and proceed to traveler details.</div>
                                    </div>
                                </div>
                                <div className={styles.actions}>
                                    <button className={styles.backBtn} onClick={() => setStep(1)}><ArrowLeft size={18} /> Back</button>
                                </div>
                            </>
                        )}

                        {wantsHotel === true && (
                            <>
                                {/* Hotel search form for refinement */}
                                <div className={styles.searchFormGrid} style={{ marginBottom: '16px' }}>
                                    <div>
                                        <label className={styles.dateLabel}>City</label>
                                        <input type="text" className={styles.inputField} value={hotelCity} onChange={(e) => setHotelCity(e.target.value)} placeholder="City name" style={{ marginBottom: 0 }} />
                                    </div>
                                    <div>
                                        <label className={styles.dateLabel}>Country Code</label>
                                        <input type="text" className={styles.inputField} value={hotelCountry} onChange={(e) => setHotelCountry(e.target.value)} placeholder="US" maxLength={2} style={{ marginBottom: 0 }} />
                                    </div>
                                </div>

                                {!isSearchingHotels && !hasSearchedHotels && (
                                    <button className="geometric-btn" onClick={searchHotels} style={{ width: '100%', marginBottom: '24px' }}>
                                        Search Hotels
                                    </button>
                                )}

                                {hotelError && <div className={styles.searchError}>{hotelError}</div>}

                                {isSearchingHotels && (
                                    <div className={styles.loadingContainer}>
                                        <Loader2 size={40} className={styles.spinner} />
                                        <p className={styles.loadingText}>Searching hotels in {hotelCity}...</p>
                                    </div>
                                )}

                                {!isSearchingHotels && hasSearchedHotels && hotelResults.length > 0 && (
                                    <div className={styles.resultsSection}>
                                        <div className={styles.resultsHeader}>
                                            <h3 className={styles.resultsTitle}>{hotelResults.length} hotel{hotelResults.length !== 1 ? 's' : ''} found</h3>
                                        </div>
                                        <div className={styles.hotelGrid}>
                                            {hotelResults.map(hotel => (
                                                <div key={hotel.offerId} className={`${styles.hotelCard} ${selectedHotel?.offerId === hotel.offerId ? styles.hotelCardSelected : ''}`} onClick={() => setSelectedHotel(hotel)}>
                                                    {hotel.image && (
                                                        <div className={styles.hotelImageWrapper}>
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={hotel.image} alt={hotel.name} className={styles.hotelImage} />
                                                        </div>
                                                    )}
                                                    <div className={styles.hotelInfo}>
                                                        <div className={styles.hotelStars}>{'★'.repeat(hotel.stars)}{'☆'.repeat(Math.max(0, 5 - hotel.stars))}</div>
                                                        <div className={styles.hotelName}>{hotel.name}</div>
                                                        {hotel.address && <div className={styles.hotelAddress}>{hotel.address}</div>}
                                                        <div className={styles.hotelRoom}>{hotel.roomName}</div>
                                                        <div className={styles.hotelBoard}>{formatBoardType(hotel.boardType)}</div>
                                                        <div className={styles.hotelPriceRow}>
                                                            <span className={styles.hotelPrice}>{formatPrice(hotel.price, hotel.currency)}</span>
                                                            <span className={styles.hotelPriceLabel}>total stay</span>
                                                        </div>
                                                    </div>
                                                    {selectedHotel?.offerId === hotel.offerId && (
                                                        <div className={styles.hotelCheck}><CheckIcon color="white" /></div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className={styles.actions} style={{ marginTop: '24px' }}>
                                    <button className={styles.backBtn} onClick={() => { setWantsHotel(null); setHasSearchedHotels(false); }}><ArrowLeft size={18} /> Back</button>
                                    {(selectedHotel || (hasSearchedHotels && !isSearchingHotels)) && (
                                        <button className="geometric-btn" onClick={() => setStep(3)} style={{ flex: 1 }}>
                                            {selectedHotel ? `Continue with ${selectedHotel.name.substring(0, 30)}` : 'Skip Hotels'}
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                );

            // ── Step 3: Traveler Details ──────────────────────────────────
            case 3:
                return (
                    <div className={styles.stepContainer} style={{ maxWidth: '900px' }}>
                        <div className={styles.stepLabel}>STEP 03/{String(SELF_TOTAL).padStart(2, '0')}</div>
                        <h2 className={styles.question}>Traveler Details</h2>
                        <p className={styles.questionSub}>Enter details for {travelers.length} traveler{travelers.length !== 1 ? 's' : ''} as shown on government ID.</p>

                        {travelers.map((t, i) => (
                            <div key={i} className={styles.travelerBlock}>
                                {travelers.length > 1 && <div className={styles.travelerLabel}>Traveler {i + 1} {i < adults ? '(Adult)' : '(Child)'}</div>}
                                <div className={styles.searchFormGrid}>
                                    <div><label className={styles.dateLabel}>First Name</label><input type="text" className={styles.inputField} placeholder="First name" value={t.firstName} onChange={(e) => updateTraveler(i, 'firstName', e.target.value)} style={{ marginBottom: 0 }} /></div>
                                    <div><label className={styles.dateLabel}>Last Name</label><input type="text" className={styles.inputField} placeholder="Last name" value={t.lastName} onChange={(e) => updateTraveler(i, 'lastName', e.target.value)} style={{ marginBottom: 0 }} /></div>
                                </div>
                                <div className={styles.searchFormGrid}>
                                    <div>
                                        <label className={styles.dateLabel}>Gender</label>
                                        <div className={styles.genderRow}>
                                            <button className={`${styles.genderBtn} ${t.gender === 'M' ? styles.genderBtnActive : ''}`} onClick={() => updateTraveler(i, 'gender', 'M')}>Male</button>
                                            <button className={`${styles.genderBtn} ${t.gender === 'F' ? styles.genderBtnActive : ''}`} onClick={() => updateTraveler(i, 'gender', 'F')}>Female</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={styles.dateLabel}>Date of Birth</label>
                                        <div className={styles.dobRow}>
                                            <CustomSelect value={t.dobMonth} onChange={(v) => updateTraveler(i, 'dobMonth', v)} options={monthOptions} placeholder="Month" />
                                            <CustomSelect value={t.dobDay} onChange={(v) => updateTraveler(i, 'dobDay', v)} options={dayOptions} placeholder="Day" />
                                            <CustomSelect value={t.dobYear} onChange={(v) => updateTraveler(i, 'dobYear', v)} options={yearOptions} placeholder="Year" />
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.searchFormGrid}>
                                    <div><label className={styles.dateLabel}>Email</label><input type="email" className={styles.inputField} placeholder="email@example.com" value={t.email} onChange={(e) => updateTraveler(i, 'email', e.target.value)} style={{ marginBottom: 0 }} /></div>
                                    <div><label className={styles.dateLabel}>Phone</label><input type="tel" className={styles.inputField} placeholder="+1 (234) 567-8900" value={t.phone} onChange={(e) => updateTraveler(i, 'phone', formatPhoneNumber(e.target.value, t.phone))} style={{ marginBottom: 0 }} /></div>
                                </div>
                            </div>
                        ))}

                        <div className={styles.actions} style={{ marginTop: '32px' }}>
                            <button className={styles.backBtn} onClick={() => setStep(2)}><ArrowLeft size={18} /> Back</button>
                            <button className="geometric-btn" onClick={() => setStep(4)} disabled={!allTravelersValid}
                                style={{ flex: 1, opacity: allTravelersValid ? 1 : 0.5, pointerEvents: allTravelersValid ? 'auto' : 'none' }}>
                                Review Booking
                            </button>
                        </div>
                    </div>
                );

            // ── Step 4: Review & Confirm ──────────────────────────────────
            case 4:
                return (
                    <div className={styles.stepContainer} style={{ maxWidth: '900px' }}>
                        <div className={styles.stepLabel}>STEP 04/{String(SELF_TOTAL).padStart(2, '0')}</div>
                        <h2 className={styles.question}>Review Your Booking</h2>
                        <p className={styles.questionSub}>Confirm all details before we finalize your reservations.</p>

                        {/* Flight Summary */}
                        {selectedFlight && (
                            <div className={styles.reviewCard}>
                                <div className={styles.reviewCardHeader}>
                                    <Plane size={20} strokeWidth={1.5} />
                                    <span>Flight</span>
                                </div>
                                <div className={styles.reviewCardBody}>
                                    <div className={styles.reviewRow}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={selectedFlight.carrierLogo} alt="" width={24} height={24} style={{ borderRadius: '4px' }} />
                                        <span className={styles.reviewBold}>{selectedFlight.carrierName}</span>
                                    </div>
                                    <div className={styles.reviewRow}>
                                        <span>{selectedFlight.outbound.departAirport} → {selectedFlight.outbound.arriveAirport}</span>
                                        <span className={styles.reviewMuted}>{selectedFlight.outbound.departTime} – {selectedFlight.outbound.arriveTime}</span>
                                    </div>
                                    {selectedFlight.inbound && (
                                        <div className={styles.reviewRow}>
                                            <span>{selectedFlight.inbound.departAirport} → {selectedFlight.inbound.arriveAirport}</span>
                                            <span className={styles.reviewMuted}>{selectedFlight.inbound.departTime} – {selectedFlight.inbound.arriveTime}</span>
                                        </div>
                                    )}
                                    <div className={styles.reviewPriceRow}>
                                        <span>{formatPrice(selectedFlight.price, selectedFlight.currency)}</span>
                                        <span className={styles.reviewMuted}>per person × {adults + children} traveler{adults + children !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Hotel Summary */}
                        {selectedHotel && (
                            <div className={styles.reviewCard}>
                                <div className={styles.reviewCardHeader}>
                                    <Hotel size={20} strokeWidth={1.5} />
                                    <span>Hotel</span>
                                </div>
                                <div className={styles.reviewCardBody}>
                                    <div className={styles.reviewRow}>
                                        <span className={styles.reviewBold}>{selectedHotel.name}</span>
                                    </div>
                                    <div className={styles.reviewRow}>
                                        <span>{selectedHotel.roomName}</span>
                                        <span className={styles.reviewMuted}>{formatBoardType(selectedHotel.boardType)}</span>
                                    </div>
                                    <div className={styles.reviewPriceRow}>
                                        <span>{formatPrice(selectedHotel.price, selectedHotel.currency)}</span>
                                        <span className={styles.reviewMuted}>total stay</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Traveler Summary */}
                        <div className={styles.reviewCard}>
                            <div className={styles.reviewCardHeader}>
                                <User size={20} strokeWidth={1.5} />
                                <span>Travelers</span>
                            </div>
                            <div className={styles.reviewCardBody}>
                                {travelers.map((t, i) => (
                                    <div key={i} className={styles.reviewRow}>
                                        <span className={styles.reviewBold}>{t.firstName} {t.lastName}</span>
                                        <span className={styles.reviewMuted}>{t.email}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {bookingError && <div className={styles.searchError}>{bookingError}</div>}

                        <div className={styles.actions} style={{ marginTop: '32px' }}>
                            <button className={styles.backBtn} onClick={() => setStep(3)}><ArrowLeft size={18} /> Back</button>
                            <button className="geometric-btn" onClick={confirmBooking} disabled={isBooking}
                                style={{ flex: 1, opacity: isBooking ? 0.7 : 1 }}>
                                {isBooking ? <><Loader2 size={20} className={styles.spinner} /> Processing Booking...</> : 'Confirm Booking'}
                            </button>
                        </div>
                    </div>
                );

            // ── Step 5: Success ───────────────────────────────────────────
            case 5:
                return (
                    <div className={`${styles.stepContainer} ${styles.successScreen}`}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(230, 57, 70, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckIcon /></div>
                        </div>
                        <h2 className={styles.question} style={{ marginBottom: '16px' }}>Booking Confirmed!</h2>
                        <p className={styles.optionDesc} style={{ fontSize: '1.1rem', marginBottom: '16px' }}>
                            Your travel reservations have been submitted successfully.
                        </p>
                        {selectedFlight && (
                            <p className={styles.optionDesc} style={{ marginBottom: '8px' }}>
                                <strong>Flight:</strong> {selectedFlight.carrierName} — {selectedFlight.outbound.departAirport} → {selectedFlight.outbound.arriveAirport}
                            </p>
                        )}
                        {selectedHotel && (
                            <p className={styles.optionDesc} style={{ marginBottom: '24px' }}>
                                <strong>Hotel:</strong> {selectedHotel.name}
                            </p>
                        )}
                        <p className={styles.optionDesc} style={{ fontSize: '0.95rem', marginBottom: '40px', color: '#888' }}>
                            A confirmation email has been sent to {travelers[0]?.email}. Our CTMS agents are finalizing your itinerary.
                        </p>
                        <button className="geometric-btn" onClick={() => router.push('/portal')} style={{ width: '100%', marginBottom: '16px' }}>Go to Portal</button>
                        <button className="geometric-btn geometric-btn-secondary" onClick={() => router.push('/')} style={{ width: '100%' }}>Return to Home</button>
                    </div>
                );
        }
    };

    return (
        <main className={styles.bookingLayout}>
            <header className={styles.header}>
                <div onClick={() => router.push('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '1.2rem', color: 'var(--isa-black)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    RETURN
                </div>
            </header>
            <div className={styles.bookingContent}>
                {renderStep()}
            </div>
        </main>
    );
}
