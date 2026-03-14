'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, Compass, User } from 'lucide-react';
import styles from './booking.module.css';

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_HEADERS = [
    { key: 'sun', label: 'S' },
    { key: 'mon', label: 'M' },
    { key: 'tue', label: 'T' },
    { key: 'wed', label: 'W' },
    { key: 'thu', label: 'T' },
    { key: 'fri', label: 'F' },
    { key: 'sat', label: 'S' }
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

const monthOptions = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
];

const dayOptions = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const yearOptions = Array.from({ length: 100 }, (_, i) => ({ value: String(2026 - i), label: String(2026 - i) }));

const CustomSelect = ({ value, onChange, options, placeholder }: { value: string, onChange: (val: string) => void, options: { value: string, label: string }[], placeholder: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className={styles.customSelectWrapper}>
            {isOpen && <div className={styles.selectOverlay} onClick={() => setIsOpen(false)} />}
            <div className={styles.customSelectValue} onClick={() => setIsOpen(!isOpen)}>
                {value ? options.find(o => o.value === value)?.label : <span className={styles.placeholder}>{placeholder}</span>}
                <div className={styles.dropdownIcon} style={{ transform: isOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>
            {isOpen && (
                <div className={styles.customSelectList}>
                    {options.map(opt => (
                        <div
                            key={opt.value}
                            className={`${styles.customSelectOption} ${value === opt.value ? styles.selected : ''}`}
                            onClick={() => { onChange(opt.value); setIsOpen(false); }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CustomDatePicker = ({ value, onChange, placeholder, minDate }: { value: string, onChange: (val: string) => void, placeholder: string, minDate?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => {
        if (value) {
            const [y, m] = value.split('-');
            return new Date(parseInt(y), parseInt(m) - 1, 1);
        }
        return new Date();
    });

    const handleOpen = () => {
        if (!isOpen) {
            if (value) {
                const [y, m] = value.split('-');
                setViewDate(new Date(parseInt(y), parseInt(m) - 1, 1));
            } else {
                setViewDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
            }
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    const prevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const nextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const setToday = (e: React.MouseEvent) => {
        e.stopPropagation();
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        onChange(todayStr);
        setIsOpen(false);
    };

    const clearDate = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setIsOpen(false);
    };

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className={styles.calendarDayEmpty} />);
    }

    const isDateDisabled = (year: number, month: number, day: number) => {
        if (!minDate) return false;
        const currentStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return currentStr < minDate;
    };

    for (let i = 1; i <= daysInMonth; i++) {
        const currentDateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const isSelected = value === currentDateStr;
        const disabled = isDateDisabled(viewDate.getFullYear(), viewDate.getMonth(), i);

        days.push(
            <div
                key={i}
                className={`${styles.calendarDay} ${isSelected ? styles.calendarDaySelected : ''} ${disabled ? styles.calendarDayDisabled : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) {
                        onChange(currentDateStr);
                        setIsOpen(false);
                    }
                }}
            >
                {i}
            </div>
        );
    }



    const formatDisplay = (val: string) => {
        if (!val) return "";
        const [y, m, d] = val.split('-');
        return `${m}/${d}/${y}`; // mm/dd/yyyy formatting
    };

    return (
        <div className={styles.customSelectWrapper}>
            {isOpen && <div className={styles.selectOverlay} onClick={() => setIsOpen(false)} />}
            <div className={styles.customSelectValue} onClick={handleOpen}>
                {value ? formatDisplay(value) : <span className={styles.placeholder}>{placeholder}</span>}
                <div className={styles.dropdownIcon} style={{ opacity: 0.5 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                </div>
            </div>
            {isOpen && (
                <div className={styles.calendarPopover}>
                    <div className={styles.calendarHeader}>
                        <div className={styles.calendarTitle}>
                            {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()} <span style={{ fontSize: '0.7em', marginLeft: '4px' }}>▼</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className={styles.calendarNavBtn} onClick={prevMonth}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                            </button>
                            <button className={styles.calendarNavBtn} onClick={nextMonth}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                            </button>
                        </div>
                    </div>
                    <div className={styles.calendarGrid}>
                        {DAY_HEADERS.map(d => (
                            <div key={d.key} className={styles.calendarDayName}>{d.label}</div>
                        ))}
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

export default function Booking() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        bookingMode: '' as '' | 'self' | 'agent',
        name: '',
        dobMonth: '',
        dobDay: '',
        dobYear: '',
        email: '',
        confirmEmail: '',
        phone: '',
        confirmPhone: '',
        startDate: '',
        endDate: '',
        adults: 1,
        children: 0,
        needsFlight: false,
        needsCharter: false,
        needsHotel: false,
        needsCar: false,
        needsVIP: false,
        needsSecurity: false,
        needsExcursions: false,
        specialRequests: '',
        agentNotes: ''
    });

    const isValidEmail = useCallback((email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), []);
    const isValidPhone = useCallback((phone: string) => /^\+?[0-9\s\-\(\)]{7,20}$/.test(phone), []);

    const formatPhoneNumber = useCallback((value: string, previousValue: string) => {
        if (!value) return value;
        // If deleting, just allow the raw value so cursor doesn't jump annoyingly
        if (previousValue && value.length < previousValue.length) return value;

        const cleaned = value.replace(/[^\d+]/g, '');
        // Prevent multiple '+'
        const num = cleaned.startsWith('+') ? '+' + cleaned.replace(/\+/g, '') : cleaned;

        // USA formatting rule: Starts with +1 or is mostly 10 digits without +
        if (num.startsWith('+1')) {
            const digits = num.replace(/\D/g, '').substring(1);
            const match = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
            if (match) {
                return `+1${match[1] ? ` (${match[1]}` : ''}${match[2] ? `) ${match[2]}` : ''}${match[3] ? `-${match[3]}` : ''}`;
            }
        } else if (!num.startsWith('+') && num.length > 0) {
            const match = num.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
            if (match) {
                let formatted = '';
                if (match[1]) formatted += `(${match[1]}`;
                if (match[2]) formatted += `) ${match[2]}`;
                if (match[3]) formatted += `-${match[3]}`;
                return formatted;
            }
        } else if (num.startsWith('+')) {
            // Generic international formats
            const digits = num.substring(1);
            const match = digits.match(/^(\d{1,3})(\d{0,4})(\d{0,4})(\d{0,4})$/);
            if (match) {
                return `+${match[1]}${match[2] ? ` ${match[2]}` : ''}${match[3] ? ` ${match[3]}` : ''}${match[4] ? ` ${match[4]}` : ''}`;
            }
        }

        return num;
    }, []);

    const nextStep = () => setStep(s => s + 1);

    const toggleService = (service: string) => {
        setFormData(prev => ({ ...prev, [service]: !prev[service as keyof typeof prev] }));
    };

    const SELF_TOTAL = 9;
    const AGENT_TOTAL = 4;
    const totalSteps = formData.bookingMode === 'agent' ? AGENT_TOTAL : SELF_TOTAL;

    const SERVICES = [
        { key: 'needsFlight', icon: <Plane size={24} strokeWidth={1.5} />, title: 'Commercial Flights', desc: 'Scheduled airline bookings' },
        { key: 'needsCharter', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.7l-1 2.5c-.1.4.1.8.5.9l7.5 3L8 15.5l-3-1c-.4-.1-.8.1-1 .4l-1 1c-.3.3-.2.8.2 1l4.5 1.5 1.5 4.5c.2.4.7.5 1 .2l1-1c.3-.2.5-.6.4-1l-1-3 3.2-2.7 3 7.5c.1.4.5.6.9.5l2.5-1c.5-.2.8-.6.7-1.1z" /></svg>, title: 'Charter / Private', desc: 'Private aircraft arrangements' },
        { key: 'needsHotel', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 22v-6.57" /><path d="M12 11h.01" /><path d="M12 7h.01" /><path d="M14 15.43V22" /><path d="M15 16a5 5 0 0 0-6 0" /><path d="M16 11h.01" /><path d="M16 7h.01" /><path d="M8 11h.01" /><path d="M8 7h.01" /><rect x="4" y="2" width="16" height="20" rx="2" /></svg>, title: 'Hotel Accommodations', desc: 'Lodging & room blocks' },
        { key: 'needsCar', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>, title: 'Ground Transport', desc: 'Transfers, rentals & shuttles' },
        { key: 'needsVIP', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>, title: 'VIP Package', desc: 'Premium concierge service' },
        { key: 'needsSecurity', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>, title: 'Security Services', desc: 'Personal security detail' },
        { key: 'needsExcursions', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>, title: 'Excursions', desc: 'Tours & local experiences' }
    ];

    const renderStep = () => {
        // ==================== STEP 0: BOOKING MODE ====================
        if (step === 0) {
            return (
                <div className={styles.stepContainer}>
                    <h2 className={styles.question}>How would you like to book?</h2>
                    <p className={styles.questionSub} style={{ marginTop: '-24px' }}>Choose the experience that works best for you.</p>

                    <div className={styles.modeGrid}>
                        <div
                            className={`${styles.modeCard} ${formData.bookingMode === 'self' ? styles.modeCardSelected : ''}`}
                            onClick={() => setFormData({ ...formData, bookingMode: 'self' })}
                        >
                            <div className={styles.modeIcon}><Compass size={32} strokeWidth={1.5} /></div>
                            <div className={styles.modeTitle}>Self-Service</div>
                            <div className={styles.modeDesc}>Book your own flights, hotels, and transport step-by-step.</div>
                            {formData.bookingMode === 'self' && <div className={styles.modeCheck}><CheckIcon color="white" /></div>}
                        </div>
                        <div
                            className={`${styles.modeCard} ${formData.bookingMode === 'agent' ? styles.modeCardSelected : ''}`}
                            onClick={() => setFormData({ ...formData, bookingMode: 'agent' })}
                        >
                            <div className={styles.modeIcon}><User size={32} strokeWidth={1.5} /></div>
                            <div className={styles.modeTitle}>Agent-Assisted</div>
                            <div className={styles.modeDesc}>Let our travel agent handle everything for you.</div>
                            {formData.bookingMode === 'agent' && <div className={styles.modeCheck}><CheckIcon color="white" /></div>}
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button
                            className="geometric-btn"
                            onClick={nextStep}
                            disabled={!formData.bookingMode}
                            style={{
                                width: '100%',
                                opacity: formData.bookingMode ? 1 : 0.5,
                                pointerEvents: formData.bookingMode ? 'auto' : 'none'
                            }}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            );
        }

        // ==================== AGENT-ASSISTED FLOW ====================
        if (formData.bookingMode === 'agent') {
            switch (step) {
                case 1:
                    return (
                        <div className={styles.stepContainer}>
                            <div className={styles.stepLabel}>STEP 01/{String(AGENT_TOTAL).padStart(2, '0')}</div>
                            <h2 className={styles.question}>What is your full legal name?</h2>
                            <input type="text" className={styles.inputField} placeholder="First and Last Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} autoFocus />
                            <div className={styles.actions}>
                                <button className="circle-arrow-btn" onClick={nextStep} disabled={!formData.name} style={{ opacity: formData.name ? 1 : 0.5, pointerEvents: formData.name ? 'auto' : 'none' }}><ArrowIcon /></button>
                            </div>
                        </div>
                    );
                case 2:
                    return (
                        <div className={styles.stepContainer}>
                            <div className={styles.stepLabel}>STEP 02/{String(AGENT_TOTAL).padStart(2, '0')}</div>
                            <h2 className={styles.question}>How can we reach you?</h2>
                            <input type="email" className={styles.inputField} placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} autoFocus />
                            <input type="tel" className={styles.inputField} placeholder="+1 (234) 567-8900" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value, formData.phone) })} />
                            <div className={styles.actions}>
                                <button className="circle-arrow-btn" onClick={nextStep} disabled={!isValidEmail(formData.email) || !formData.phone} style={{ opacity: (isValidEmail(formData.email) && formData.phone) ? 1 : 0.5, pointerEvents: (isValidEmail(formData.email) && formData.phone) ? 'auto' : 'none' }}><ArrowIcon /></button>
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
                                <div style={{ width: '100%' }}>
                                    <label className={styles.dateLabel}>Departure Date</label>
                                    <CustomDatePicker value={formData.startDate} onChange={(val) => setFormData({ ...formData, startDate: val })} placeholder="mm/dd/yyyy" />
                                </div>
                                <div style={{ width: '100%' }}>
                                    <label className={styles.dateLabel}>Return Date</label>
                                    <CustomDatePicker value={formData.endDate} onChange={(val) => setFormData({ ...formData, endDate: val })} placeholder="mm/dd/yyyy" minDate={formData.startDate} />
                                </div>
                            </div>
                            <textarea className={styles.textArea} placeholder="Tell your agent what you need: number of travelers, flight preferences, hotel requirements, special requests..." value={formData.agentNotes} onChange={(e) => setFormData({ ...formData, agentNotes: e.target.value })} rows={5} />
                            <div className={styles.actions}>
                                <button className="circle-arrow-btn" onClick={nextStep}><ArrowIcon /></button>
                            </div>
                        </div>
                    );
                case 4:
                    return (
                        <div className={`${styles.stepContainer} ${styles.successScreen}`}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(230, 57, 70, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckIcon />
                                </div>
                            </div>
                            <h2 className={styles.question} style={{ marginBottom: '16px' }}>Request Received.</h2>
                            <p className={styles.optionDesc} style={{ fontSize: '1.1rem', marginBottom: '40px' }}>
                                Thank you, {formData.name}. A dedicated CTMS travel agent will contact you within 1 hour to coordinate your full itinerary.
                            </p>
                            <button className="geometric-btn" onClick={() => router.push('/')} style={{ width: '100%' }}>Return to Home</button>
                        </div>
                    );
            }
            return null;
        }

        // ==================== SELF-SERVICE FLOW ====================
        switch (step) {
            case 1:
                return (
                    <div className={styles.stepContainer}>
                        <div className={styles.stepLabel}>STEP 01/{String(SELF_TOTAL).padStart(2, '0')}</div>
                        <h2 className={styles.question}>What is your full legal name?</h2>
                        <input type="text" className={styles.inputField} placeholder="First and Last Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} autoFocus />
                        <div className={styles.actions}>
                            <button className="circle-arrow-btn" onClick={nextStep} disabled={!formData.name} style={{ opacity: formData.name ? 1 : 0.5, pointerEvents: formData.name ? 'auto' : 'none' }}><ArrowIcon /></button>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className={styles.stepContainer}>
                        <div className={styles.stepLabel}>STEP 02/{String(SELF_TOTAL).padStart(2, '0')}</div>
                        <h2 className={styles.question}>When is your date of birth?</h2>
                        <CustomSelect value={formData.dobMonth} onChange={(val) => setFormData({ ...formData, dobMonth: val })} options={monthOptions} placeholder="Select Month" />
                        <div className={styles.multiSelectRow}>
                            <CustomSelect value={formData.dobDay} onChange={(val) => setFormData({ ...formData, dobDay: val })} options={dayOptions} placeholder="Day" />
                            <CustomSelect value={formData.dobYear} onChange={(val) => setFormData({ ...formData, dobYear: val })} options={yearOptions} placeholder="Year" />
                        </div>
                        <div className={styles.actions}>
                            <button className="circle-arrow-btn" onClick={nextStep} disabled={!formData.dobMonth || !formData.dobDay || !formData.dobYear} style={{ opacity: (!formData.dobMonth || !formData.dobDay || !formData.dobYear) ? 0.5 : 1, pointerEvents: (!formData.dobMonth || !formData.dobDay || !formData.dobYear) ? 'none' : 'auto' }}><ArrowIcon /></button>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className={styles.stepContainer}>
                        <div className={styles.stepLabel}>STEP 03/{String(SELF_TOTAL).padStart(2, '0')}</div>
                        <h2 className={styles.question}>What is your email address?</h2>
                        <input type="email" className={styles.inputField} placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} autoFocus />
                        <input type="email" className={styles.inputField} placeholder="Confirm Email Address" value={formData.confirmEmail} onChange={(e) => setFormData({ ...formData, confirmEmail: e.target.value })} />
                        {formData.confirmEmail && formData.email !== formData.confirmEmail && (<div className={styles.errorText}>Emails do not match.</div>)}
                        <div className={styles.actions}>
                            <button className="circle-arrow-btn" onClick={nextStep} disabled={!isValidEmail(formData.email) || formData.email !== formData.confirmEmail} style={{ opacity: (!isValidEmail(formData.email) || formData.email !== formData.confirmEmail) ? 0.5 : 1, pointerEvents: (!isValidEmail(formData.email) || formData.email !== formData.confirmEmail) ? 'none' : 'auto' }}><ArrowIcon /></button>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className={styles.stepContainer}>
                        <div className={styles.stepLabel}>STEP 04/{String(SELF_TOTAL).padStart(2, '0')}</div>
                        <h2 className={styles.question}>What is your mobile number?</h2>
                        <p className={styles.questionSub}>Please include your country code (e.g., +1 for US/Canada).</p>
                        <input type="tel" className={styles.inputField} placeholder="+1 (234) 567-8900" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value, formData.phone) })} autoFocus />
                        <input type="tel" className={styles.inputField} placeholder="Confirm Mobile Number" value={formData.confirmPhone} onChange={(e) => setFormData({ ...formData, confirmPhone: formatPhoneNumber(e.target.value, formData.confirmPhone) })} />
                        {formData.phone && !isValidPhone(formData.phone) && (<div className={styles.errorText}>Please enter a valid global phone format.</div>)}
                        {formData.confirmPhone && formData.phone !== formData.confirmPhone && (<div className={styles.errorText}>Phone numbers do not match.</div>)}
                        <div className={styles.actions}>
                            <button className="circle-arrow-btn" onClick={nextStep} disabled={!isValidPhone(formData.phone) || formData.phone !== formData.confirmPhone} style={{ opacity: (!isValidPhone(formData.phone) || formData.phone !== formData.confirmPhone) ? 0.5 : 1, pointerEvents: (!isValidPhone(formData.phone) || formData.phone !== formData.confirmPhone) ? 'none' : 'auto' }}><ArrowIcon /></button>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className={styles.stepContainer}>
                        <div className={styles.stepLabel}>STEP 05/{String(SELF_TOTAL).padStart(2, '0')}</div>
                        <h2 className={styles.question}>When are you traveling?</h2>
                        <div className={styles.dateRow}>
                            <div style={{ width: '100%' }}>
                                <label className={styles.dateLabel}>Departure Date</label>
                                <CustomDatePicker value={formData.startDate} onChange={(val) => setFormData({ ...formData, startDate: val })} placeholder="mm/dd/yyyy" />
                            </div>
                            <div style={{ width: '100%' }}>
                                <label className={styles.dateLabel}>Return Date</label>
                                <CustomDatePicker value={formData.endDate} onChange={(val) => setFormData({ ...formData, endDate: val })} placeholder="mm/dd/yyyy" minDate={formData.startDate} />
                            </div>
                        </div>
                        {formData.startDate && (
                            <div className={styles.rateNotice}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                Book early to lock in negotiated group rates.
                            </div>
                        )}
                        <div className={styles.actions}>
                            <button className="circle-arrow-btn" onClick={nextStep} disabled={!formData.startDate || !formData.endDate} style={{ opacity: (!formData.startDate || !formData.endDate) ? 0.5 : 1, pointerEvents: (!formData.startDate || !formData.endDate) ? 'none' : 'auto' }}><ArrowIcon /></button>
                        </div>
                    </div>
                );

            case 6:
                return (
                    <div className={styles.stepContainer}>
                        <div className={styles.stepLabel}>STEP 06/{String(SELF_TOTAL).padStart(2, '0')}</div>
                        <h2 className={styles.question}>Who is traveling?</h2>
                        <div className={styles.toggleGrid} style={{ marginBottom: '40px' }}>
                            <div className={styles.counterRow}>
                                <div className={styles.counterLabel}>Adults (18+)</div>
                                <div className={styles.counterControl}>
                                    <button className={styles.counterBtn} onClick={() => setFormData({ ...formData, adults: Math.max(1, formData.adults - 1) })}>-</button>
                                    <div className={styles.counterValue}>{formData.adults}</div>
                                    <button className={styles.counterBtn} onClick={() => setFormData({ ...formData, adults: formData.adults + 1 })}>+</button>
                                </div>
                            </div>
                            <div className={styles.counterRow}>
                                <div className={styles.counterLabel}>Children (0-17)</div>
                                <div className={styles.counterControl}>
                                    <button className={styles.counterBtn} onClick={() => setFormData({ ...formData, children: Math.max(0, formData.children - 1) })}>-</button>
                                    <div className={styles.counterValue}>{formData.children}</div>
                                    <button className={styles.counterBtn} onClick={() => setFormData({ ...formData, children: formData.children + 1 })}>+</button>
                                </div>
                            </div>
                        </div>
                        <div className={styles.actions}>
                            <button className="circle-arrow-btn" onClick={nextStep}><ArrowIcon /></button>
                        </div>
                    </div>
                );

            case 7:
                return (
                    <div className={styles.stepContainer}>
                        <div className={styles.stepLabel}>STEP 07/{String(SELF_TOTAL).padStart(2, '0')}</div>
                        <h2 className={styles.question}>What travel services do you need?</h2>
                        <p className={styles.questionSub}>Select all that apply.</p>
                        <div className={styles.serviceGrid}>
                            {SERVICES.map(s => (
                                <div
                                    key={s.key}
                                    className={`${styles.serviceCard} ${formData[s.key as keyof typeof formData] ? styles.serviceCardSelected : ''}`}
                                    onClick={() => toggleService(s.key)}
                                >
                                    <div className={styles.serviceIcon}>{s.icon}</div>
                                    <div className={styles.serviceInfo}>
                                        <div className={styles.serviceTitle}>{s.title}</div>
                                        <div className={styles.serviceDesc}>{s.desc}</div>
                                    </div>
                                    {formData[s.key as keyof typeof formData] && (
                                        <div className={styles.serviceCheck}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className={styles.actions}>
                            <button className="circle-arrow-btn" onClick={nextStep}><ArrowIcon /></button>
                        </div>
                    </div>
                );

            case 8:
                return (
                    <div className={styles.stepContainer}>
                        <div className={styles.stepLabel}>STEP 08/{String(SELF_TOTAL).padStart(2, '0')}</div>
                        <h2 className={styles.question}>Any special requests?</h2>
                        <p className={styles.questionSub}>Optional — skip if none.</p>
                        <textarea
                            className={styles.textArea}
                            placeholder="Dietary requirements, mobility needs, room preferences, connecting flights, seating requests..."
                            value={formData.specialRequests}
                            onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                            rows={5}
                        />
                        <div className={styles.actions}>
                            <button className="geometric-btn" onClick={nextStep} style={{ width: '100%' }}>Submit Travel Profile</button>
                        </div>
                    </div>
                );

            case 9:
                return (
                    <div className={`${styles.stepContainer} ${styles.successScreen}`}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(230, 57, 70, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckIcon />
                            </div>
                        </div>
                        <h2 className={styles.question} style={{ marginBottom: '16px' }}>Ready for Operations.</h2>
                        <p className={styles.optionDesc} style={{ fontSize: '1.1rem', marginBottom: '40px' }}>
                            Thank you, {formData.name}. Our CTMS agents are processing your profile and will coordinate your itinerary shortly.
                        </p>
                        <button className="geometric-btn" onClick={() => router.push('/')} style={{ width: '100%' }}>Return to Home</button>
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
