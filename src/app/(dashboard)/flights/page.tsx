'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, Search, Loader2, X, ArrowRight } from 'lucide-react';
import { searchAirports, getAirportInfo, getAirlineLogo, getAirlineInfo, formatPrice, type AirportInfo } from '@/lib/airlines';
import styles from './Flights.module.css';

// ── Types ────────────────────────────────────────────────────────────────────

interface Segment { carrier: string; carrierName: string; flightNumber: string; from: string; to: string; departTime: string; arriveTime: string; cabin: string; }
interface Leg { segments: Segment[]; departAirport: string; arriveAirport: string; departTime: string; arriveTime: string; duration: string; stops: number; carrier: string; carrierName: string; }
interface Flight { id: string; reviewKey: string; outbound: Leg; inbound?: Leg; price: number; currency: string; carrier: string; carrierName: string; carrierLogo: string; }

// ── Parser ───────────────────────────────────────────────────────────────────

function parseFlights(data: Record<string, unknown>): Flight[] {
    const flights: Flight[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseArr = data.response as any[];
    if (!Array.isArray(responseArr) || !responseArr[0]) return flights;
    if (responseArr[0].status?.type === 'ERROR') return flights;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itins = responseArr[0].sliceItinerary as any[];
    if (!Array.isArray(itins)) return flights;

    for (let i = 0; i < itins.length; i++) {
        const itin = itins[i];
        const reviewKey = (itin.reviewKey as string) || '';
        const pi = itin.pricingInfo || {};
        const price = parseFloat(String(pi.totalPrice ?? '0'));
        const currency = (pi.currencyCode as string) || 'CAD';
        const vc = (pi.metaData?.validatingCarrier as string) || '';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const odis = itin.originDestinationInfo as any[];
        const legs: Leg[] = [];

        if (Array.isArray(odis)) {
            for (const odi of odis) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const segs = (odi.flightSegmentInfo as any[]) || [];
                const parsed: Segment[] = [];
                for (const s of segs) {
                    const dep = s.departure || {}, arr = s.arrival || {}, mc = s.marketingCarrier || {};
                    const ddt = (s.departureDateTime as string) || '', adt = (s.arrivalDateTime as string) || '';
                    parsed.push({ carrier: mc.code || '', carrierName: mc.name || '', flightNumber: String(s.flightNumber ?? ''), from: dep.airportCode || '', to: arr.airportCode || '', departTime: ddt.split('T')[1]?.slice(0, 5) || '', arriveTime: adt.split('T')[1]?.slice(0, 5) || '', cabin: s.cabin?.cabinName || 'Economy' });
                }
                if (!parsed.length) continue;
                const f = parsed[0], l = parsed[parsed.length - 1];
                const bd = parseInt(String(odi.boundDuration ?? '0'));
                legs.push({ segments: parsed, departAirport: f.from, arriveAirport: l.to, departTime: f.departTime, arriveTime: l.arriveTime, duration: bd > 0 ? `${Math.floor(bd / 60)}h ${bd % 60}m` : `${parsed.length} seg`, stops: Math.max(0, parsed.length - 1), carrier: f.carrier, carrierName: f.carrierName });
            }
        }
        if (!legs.length) continue;
        const mc = vc || legs[0].carrier;
        const info = getAirlineInfo(mc);
        flights.push({ id: `f-${i}`, reviewKey, outbound: legs[0], inbound: legs[1], price, currency, carrier: mc, carrierName: info.name, carrierLogo: getAirlineLogo(mc, 30) });
    }
    return flights.sort((a, b) => a.price - b.price);
}

function formatStops(s: number) { return s === 0 ? 'Nonstop' : `${s} stop${s > 1 ? 's' : ''}`; }

// ── Sub-components ───────────────────────────────────────────────────────────

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = [{k:'S'},{k:'M'},{k:'T'},{k:'W'},{k:'T'},{k:'F'},{k:'S'}];

function DatePicker({ value, onChange, placeholder, minDate }: { value: string; onChange: (v: string) => void; placeholder: string; minDate?: string }) {
    const [open, setOpen] = useState(false);
    const [vd, setVd] = useState(() => value ? new Date(parseInt(value.split('-')[0]), parseInt(value.split('-')[1]) - 1, 1) : new Date());

    const canPrev = !minDate || vd.getFullYear() > parseInt(minDate.split('-')[0]) || (vd.getFullYear() === parseInt(minDate.split('-')[0]) && vd.getMonth() > parseInt(minDate.split('-')[1]) - 1);
    const dim = new Date(vd.getFullYear(), vd.getMonth() + 1, 0).getDate();
    const fdow = new Date(vd.getFullYear(), vd.getMonth(), 1).getDay();

    const days = [];
    for (let i = 0; i < fdow; i++) days.push(<div key={`e${i}`} className={styles.calDayEmpty} />);
    for (let i = 1; i <= dim; i++) {
        const ds = `${vd.getFullYear()}-${String(vd.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dis = minDate ? ds < minDate : false;
        days.push(<div key={i} className={`${styles.calDay} ${value === ds ? styles.calDaySelected : ''} ${dis ? styles.calDayDisabled : ''}`} onClick={(e) => { e.stopPropagation(); if (!dis) { onChange(ds); setOpen(false); } }}>{i}</div>);
    }
    const fmt = (v: string) => { if (!v) return ''; const [y, m, d] = v.split('-'); return `${m}/${d}/${y}`; };

    return (
        <div className={styles.dpWrapper}>
            {open && <div className={styles.dpOverlay} onClick={() => setOpen(false)} />}
            <div className={styles.dpTrigger} onClick={() => { if (!open) { if (value) { const [y, m] = value.split('-'); setVd(new Date(parseInt(y), parseInt(m) - 1, 1)); } else setVd(new Date()); } setOpen(!open); }}>
                {value ? fmt(value) : <span className={styles.dpPlaceholder}>{placeholder}</span>}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.5 }}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            </div>
            {open && (
                <div className={styles.calPopover}>
                    <div className={styles.calHeader}><div className={styles.calTitle}>{MONTHS[vd.getMonth()]} {vd.getFullYear()}</div><div style={{ display: 'flex', gap: '4px' }}><button className={styles.calNavBtn} onClick={(e) => { e.stopPropagation(); if (canPrev) setVd(new Date(vd.getFullYear(), vd.getMonth() - 1, 1)); }} style={{ opacity: canPrev ? 1 : 0.3 }}>‹</button><button className={styles.calNavBtn} onClick={(e) => { e.stopPropagation(); setVd(new Date(vd.getFullYear(), vd.getMonth() + 1, 1)); }}>›</button></div></div>
                    <div className={styles.calGrid}>{DAYS.map((d, i) => <div key={i} className={styles.calDayName}>{d.k}</div>)}{days}</div>
                </div>
            )}
        </div>
    );
}

function AirportInput({ value, onChange, placeholder }: { value: string; onChange: (c: string) => void; placeholder: string }) {
    const [dv, setDv] = useState('');
    const [results, setResults] = useState<AirportInfo[]>([]);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => { if (value) { const i = getAirportInfo(value); setDv(`${i.city} (${i.code})`); } }, [value]);
    useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);

    return (
        <div className={styles.airportWrapper} ref={ref}>
            <Plane size={16} strokeWidth={1.5} className={styles.airportIcon} />
            <input type="text" className={styles.airportInput} placeholder={placeholder} value={dv} onChange={(e) => { setDv(e.target.value); if (e.target.value.length >= 2) { setResults(searchAirports(e.target.value, 8)); setOpen(true); } else { setResults([]); setOpen(false); } }} onFocus={() => { if (results.length) setOpen(true); }} />
            {open && results.length > 0 && (
                <div className={styles.airportDropdown}>{results.map(a => (
                    <div key={a.code} className={styles.airportOption} onClick={() => { onChange(a.code); setDv(`${a.city} (${a.code})`); setResults([]); setOpen(false); }}>
                        <span className={styles.airportCodeTag}>{a.code}</span><span>{a.city} — {a.name}</span>
                    </div>
                ))}</div>
            )}
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function FlightsPage() {
    const router = useRouter();
    const [origin, setOrigin] = useState('');
    const [dest, setDest] = useState('');
    const [depart, setDepart] = useState('');
    const [ret, setRet] = useState('');
    const [tripType, setTripType] = useState<'RT' | 'OW'>('RT');
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [results, setResults] = useState<Flight[]>([]);
    const [loading, setLoading] = useState(false);
    const [reviewing, setReviewing] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);
    const [detail, setDetail] = useState<Flight | null>(null);
    const [filterStops, setFilterStops] = useState<'any' | 'nonstop' | 'one_stop'>('any');
    const [filterAirline, setFilterAirline] = useState('');

    const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();

    useEffect(() => { if (tripType === 'OW') setRet(''); }, [tripType]);
    useEffect(() => { if (depart && ret && ret < depart) setRet(''); }, [depart, ret]);

    const canSearch = origin && dest && origin !== dest && depart && (tripType === 'OW' || ret);

    const filtered = results.filter(f => {
        if (filterStops === 'nonstop' && f.outbound.stops !== 0) return false;
        if (filterStops === 'one_stop' && f.outbound.stops > 1) return false;
        if (filterAirline && f.carrier !== filterAirline) return false;
        return true;
    });
    const airlines = Array.from(new Map(results.map(f => [f.carrier, f.carrierName])).entries());

    const handleSearch = useCallback(async () => {
        setLoading(true); setError(''); setResults([]); setSearched(true);
        try {
            const pax: { type: string; quantity: number }[] = [{ type: 'ADT', quantity: adults }];
            if (children > 0) pax.push({ type: 'CNN', quantity: children });
            const res = await fetch('/api/farenexus/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ origin, destination: dest, departureDate: depart, returnDate: tripType === 'RT' ? ret : undefined, passengers: pax, tripType, travelClass: 'ECO' }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Search failed');
            const parsed = parseFlights(data);
            setResults(parsed);
            if (!parsed.length) setError('No flights found. Try different dates or airports.');
            setFilterStops('any'); setFilterAirline('');
        } catch (e) { setError(e instanceof Error ? e.message : 'Flight search failed.'); }
        finally { setLoading(false); }
    }, [origin, dest, depart, ret, tripType, adults, children]);

    const handleBook = async (flight: Flight) => {
        setDetail(null); setReviewing(true); setError('');
        try {
            const rev = await fetch('/api/farenexus/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reviewKey: flight.reviewKey }) });
            const rd = await rev.json();
            if (!rev.ok) throw new Error(rd.error || 'Review failed');
            const bk = rd.bookKey || '';
            const p = new URLSearchParams({ bookKey: bk, price: flight.price.toFixed(2), currency: flight.currency, origin: flight.outbound.departAirport, destination: flight.outbound.arriveAirport });
            router.push(`/booking?${p.toString()}`);
        } catch { router.push('/booking'); }
        finally { setReviewing(false); }
    };

    return (
        <div className={styles.page}>
            <div className={styles.content}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>Book a Flight</h1>
                    <p className={styles.pageSub}>Search real-time availability across airlines worldwide.</p>
                </div>

                {/* Search */}
                <div className={`${styles.searchCard} ${loading ? styles.fadeOut : ''}`}>
                    <div className={styles.tripToggle}>
                        <button className={`${styles.toggleBtn} ${tripType === 'RT' ? styles.toggleActive : ''}`} onClick={() => setTripType('RT')}>Round Trip</button>
                        <button className={`${styles.toggleBtn} ${tripType === 'OW' ? styles.toggleActive : ''}`} onClick={() => setTripType('OW')}>One Way</button>
                    </div>
                    <div className={styles.searchGrid}>
                        <div><label className={styles.label}>From</label><AirportInput value={origin} onChange={setOrigin} placeholder="City or airport" /></div>
                        <div><label className={styles.label}>To</label><AirportInput value={dest} onChange={setDest} placeholder="City or airport" /></div>
                        <div><label className={styles.label}>Departure</label><DatePicker value={depart} onChange={setDepart} placeholder="Select date" minDate={today} /></div>
                        {tripType === 'RT' && <div><label className={styles.label}>Return</label><DatePicker value={ret} onChange={setRet} placeholder="Select date" minDate={depart || today} /></div>}
                    </div>
                    <div className={styles.paxRow}>
                        <div className={styles.paxControl}><span className={styles.paxLabel}>Adults</span><div className={styles.paxBtns}><button className={styles.paxBtn} onClick={() => setAdults(Math.max(1, adults - 1))}>−</button><span className={styles.paxCount}>{adults}</span><button className={styles.paxBtn} onClick={() => setAdults(Math.min(9 - children, adults + 1))}>+</button></div></div>
                        <div className={styles.paxControl}><span className={styles.paxLabel}>Children</span><div className={styles.paxBtns}><button className={styles.paxBtn} onClick={() => setChildren(Math.max(0, children - 1))}>−</button><span className={styles.paxCount}>{children}</span><button className={styles.paxBtn} onClick={() => setChildren(Math.min(9 - adults, children + 1))}>+</button></div></div>
                        <button className={styles.searchBtn} onClick={handleSearch} disabled={!canSearch || loading}>{loading ? <Loader2 size={20} className={styles.spin} /> : <Search size={20} />}<span>{loading ? 'Searching...' : 'Search Flights'}</span></button>
                    </div>
                    {origin && dest && origin === dest && <div className={styles.error}>Origin and destination cannot be the same.</div>}

                    {searched && results.length > 0 && (
                        <div className={styles.filterBar}>
                            <span className={styles.filterLabel}>Select departure from {origin}</span>
                            <div className={styles.filters}>
                                <select className={styles.filterSelect} value={filterStops} onChange={e => setFilterStops(e.target.value as 'any' | 'nonstop' | 'one_stop')}><option value="any">Any stops</option><option value="nonstop">Nonstop only</option><option value="one_stop">1 stop or fewer</option></select>
                                <select className={styles.filterSelect} value={filterAirline} onChange={e => setFilterAirline(e.target.value)}><option value="">All airlines</option>{airlines.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select>
                                {(filterStops !== 'any' || filterAirline) && <button className={styles.filterClear} onClick={() => { setFilterStops('any'); setFilterAirline(''); }}>Clear</button>}
                            </div>
                        </div>
                    )}
                </div>

                {loading && <div className={styles.loadingOverlay}><div className={styles.loadingModal}><Plane size={32} strokeWidth={1.5} /><h3>{tripType === 'RT' ? 'Round Trip' : 'One Way'} — {origin} → {dest}</h3><p>Checking with airlines...</p><div className={styles.loadingBar} /></div></div>}
                {reviewing && <div className={styles.loadingOverlay}><div className={styles.loadingModal}><Loader2 size={32} className={styles.spin} /><h3>Confirming availability...</h3><p>Reviewing fare with airline</p><div className={styles.loadingBar} /></div></div>}
                {error && <div className={styles.card}><div className={styles.error}>{error}</div></div>}

                {!loading && searched && results.length > 0 && (
                    <div className={styles.card}>
                        <div className={styles.resultsHeader}><h3>Available Flights</h3><span className={styles.resultsSub}>{filtered.length} of {results.length} result{results.length !== 1 ? 's' : ''}</span></div>
                        {filtered.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No flights match your filters.</div> : (
                            <div className={styles.resultsList}>
                                {filtered.map(f => (
                                    <div key={f.id} className={styles.flightCard} onClick={() => setDetail(f)}>
                                        <div className={styles.airline}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={f.carrierLogo} alt={f.carrierName} width={28} height={28} className={styles.airlineLogo} />
                                            <span className={styles.airlineName}>{f.carrierName}</span>
                                        </div>
                                        <div className={styles.legs}>
                                            <div className={styles.leg}>
                                                <div className={styles.time}><span className={styles.timeVal}>{f.outbound.departTime || '--:--'}</span><span className={styles.airport}>{f.outbound.departAirport}</span></div>
                                                <div className={styles.route}><span className={styles.duration}>{f.outbound.duration}</span><div className={styles.line}><div className={styles.dot} /><div className={styles.dash} /><div className={styles.dot} /></div><span className={styles.stops}>{formatStops(f.outbound.stops)}</span></div>
                                                <div className={styles.time}><span className={styles.timeVal}>{f.outbound.arriveTime || '--:--'}</span><span className={styles.airport}>{f.outbound.arriveAirport}</span></div>
                                            </div>
                                            {f.inbound && (
                                                <div className={styles.leg} style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                                                    <div className={styles.time}><span className={styles.timeVal}>{f.inbound.departTime || '--:--'}</span><span className={styles.airport}>{f.inbound.departAirport}</span></div>
                                                    <div className={styles.route}><span className={styles.duration}>{f.inbound.duration}</span><div className={styles.line}><div className={styles.dot} /><div className={styles.dash} /><div className={styles.dot} /></div><span className={styles.stops}>{formatStops(f.inbound.stops)}</span></div>
                                                    <div className={styles.time}><span className={styles.timeVal}>{f.inbound.arriveTime || '--:--'}</span><span className={styles.airport}>{f.inbound.arriveAirport}</span></div>
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.price}><span className={styles.priceVal}>{formatPrice(f.price, f.currency)}</span><span className={styles.pricePer}>per person</span></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {!searched && !loading && (
                    <div className={`${styles.card} ${loading ? styles.fadeOut : ''}`}><h3 className={styles.preTitle}>Popular Routes</h3>
                        <div className={styles.chips}>
                            <button className={styles.chip} onClick={() => { setOrigin('YUL'); setDest('YVR'); }}>YUL → YVR</button>
                            <button className={styles.chip} onClick={() => { setOrigin('YYZ'); setDest('YVR'); }}>YYZ → YVR</button>
                            <button className={styles.chip} onClick={() => { setOrigin('JFK'); setDest('LAX'); }}>JFK → LAX</button>
                            <button className={styles.chip} onClick={() => { setOrigin('ORD'); setDest('MIA'); }}>ORD → MIA</button>
                            <button className={styles.chip} onClick={() => { setOrigin('LHR'); setDest('CDG'); }}>LHR → CDG</button>
                        </div>
                    </div>
                )}

                {/* Detail Modal */}
                {detail && (
                    <div className={styles.modalOverlay} onClick={() => setDetail(null)}>
                        <div className={styles.modal} onClick={e => e.stopPropagation()}>
                            <button className={styles.modalClose} onClick={() => setDetail(null)}><X size={20} /></button>
                            <div className={styles.modalHeader}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={detail.carrierLogo} alt="" width={36} height={36} style={{ borderRadius: '8px' }} />
                                <div><h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--isa-black)', fontFamily: 'var(--font-sans)', textTransform: 'none', letterSpacing: 0 }}>{detail.carrierName}</h3><span style={{ fontSize: '0.85rem', color: '#888' }}>{detail.outbound.departAirport} → {detail.outbound.arriveAirport}{detail.inbound ? ` → ${detail.inbound.arriveAirport}` : ''}</span></div>
                            </div>
                            {[detail.outbound, ...(detail.inbound ? [detail.inbound] : [])].map((leg, li) => (
                                <div key={li} className={styles.modalLeg}>
                                    <div className={styles.modalLegTitle}>{li === 0 ? 'Outbound' : 'Return'} • {leg.duration} • {formatStops(leg.stops)}</div>
                                    {leg.segments.map((seg, si) => (
                                        <div key={si} className={styles.modalSeg}>
                                            <div className={styles.modalSegTimes}>
                                                <div><span className={styles.modalSegTime}>{seg.departTime}</span><span className={styles.modalSegCode}>{seg.from}</span></div>
                                                <div className={styles.modalSegLine}><div className={styles.dot} /><div className={styles.dash} /><div className={styles.dot} /></div>
                                                <div><span className={styles.modalSegTime}>{seg.arriveTime}</span><span className={styles.modalSegCode}>{seg.to}</span></div>
                                            </div>
                                            <div className={styles.modalSegMeta}><span>{seg.carrierName} {seg.flightNumber}</span><span>{seg.cabin}</span></div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                            <div className={styles.modalFooter}>
                                <div className={styles.modalPrice}><span className={styles.priceVal}>{formatPrice(detail.price, detail.currency)}</span><span className={styles.pricePer}>per person</span></div>
                                <button className={styles.bookBtn} onClick={() => handleBook(detail)}>Continue to Book <ArrowRight size={18} /></button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
