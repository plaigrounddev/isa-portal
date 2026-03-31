// ─── Sabre API TypeScript Definitions ───────────────────────────────────────
// Covers request/response shapes for all wrapped Sabre endpoints.

// ═══════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════

export interface SabreTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// AIR SHOPPING
// ═══════════════════════════════════════════════════════════════════════════

export interface FlightSearchParams {
  origin: string; // 3-letter IATA code
  destination: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string;
  passengerCount?: number;
  cabinClass?: "Y" | "S" | "C" | "J" | "F" | "P"; // Economy, PremEcon, Business, etc.
  directFlightsOnly?: boolean;
  maxResults?: number;
}

export interface FlightSegment {
  departureAirport: string;
  arrivalAirport: string;
  departureDateTime: string;
  arrivalDateTime: string;
  flightNumber: string;
  airlineCode: string;
  duration: string;
  stops: number;
  equipment?: string;
}

export interface FlightOffer {
  id: string;
  segments: FlightSegment[];
  totalPrice: {
    amount: number;
    currency: string;
  };
  fareType?: string;
  seatsRemaining?: number;
}

export interface FlightSearchResponse {
  offers: FlightOffer[];
  totalCount: number;
}

export interface CalendarSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  lengthOfStay?: number;
}

export interface CalendarFare {
  departureDate: string;
  returnDate?: string;
  lowestFare: {
    amount: number;
    currency: string;
  };
}

export interface CalendarSearchResponse {
  fares: CalendarFare[];
}

export interface RevalidateParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  flightNumber?: string;
  airlineCode?: string;
}

export interface RevalidateResponse {
  valid: boolean;
  price?: {
    amount: number;
    currency: string;
  };
  warnings?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOKING
// ═══════════════════════════════════════════════════════════════════════════

export interface PassengerInfo {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: "M" | "F";
  email?: string;
  phone?: string;
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
}

export interface CreateBookingParams {
  passengers: PassengerInfo[];
  flightSegments?: Array<{
    origin: string;
    destination: string;
    departureDateTime: string;
    flightNumber: string;
    airlineCode: string;
    bookingClass: string;
  }>;
  hotelSegments?: Array<{
    hotelCode: string;
    checkIn: string;
    checkOut: string;
    roomType: string;
    rateCode: string;
    guests: number;
  }>;
  carSegments?: Array<{
    pickUpLocation: string;
    returnLocation: string;
    pickUpDateTime: string;
    returnDateTime: string;
    vehicleType: string;
    vendorCode: string;
  }>;
  contactInfo: {
    email: string;
    phone: string;
  };
}

export interface BookingResponse {
  confirmationId: string;
  pnrLocator: string;
  status: string;
  itinerary: unknown;
  createdAt: string;
}

export interface GetBookingResponse {
  pnrLocator: string;
  status: string;
  passengers: PassengerInfo[];
  itinerary: unknown;
  ticketing?: unknown;
}

export interface CancelBookingResponse {
  status: string;
  message: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SEAT MAPS
// ═══════════════════════════════════════════════════════════════════════════

export interface SeatMapRequest {
  origin: string;
  destination: string;
  departureDate: string;
  flightNumber: string;
  airlineCode: string;
}

export interface Seat {
  seatNumber: string;
  available: boolean;
  chargeable: boolean;
  price?: {
    amount: number;
    currency: string;
  };
  characteristics?: string[]; // e.g. "Window", "Aisle", "ExtraLegroom"
}

export interface SeatRow {
  rowNumber: number;
  seats: Seat[];
}

export interface SeatMapResponse {
  cabin: string;
  rows: SeatRow[];
  aircraft: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ANCILLARIES
// ═══════════════════════════════════════════════════════════════════════════

export interface AncillaryItem {
  code: string;
  name: string;
  description: string;
  price: {
    amount: number;
    currency: string;
  };
  category: string; // e.g. "Baggage", "Meal", "WiFi"
}

export interface GetAncillariesResponse {
  ancillaries: AncillaryItem[];
}

export interface AncillaryModifyRequest {
  pnrLocator: string;
  ancillaries: Array<{
    code: string;
    segmentRef?: string;
    passengerRef?: string;
    quantity?: number;
  }>;
}

export interface AncillaryModifyResponse {
  status: string;
  message: string;
  pnrLocator: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOTELS
// ═══════════════════════════════════════════════════════════════════════════

export interface HotelSearchParams {
  location: string; // city code or geo coords
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms?: number;
  radius?: number;
  radiusUnit?: "MI" | "KM";
  maxResults?: number;
}

export interface HotelProperty {
  hotelCode: string;
  name: string;
  address: string;
  city: string;
  country: string;
  starRating: number;
  latitude?: number;
  longitude?: number;
  amenities?: string[];
  lowestRate?: {
    amount: number;
    currency: string;
  };
}

export interface HotelSearchResponse {
  properties: HotelProperty[];
  totalCount: number;
}

export interface HotelListParams {
  hotelCodes?: string[];
  cityCode?: string;
  countryCode?: string;
  maxResults?: number;
}

export interface HotelListResponse {
  hotels: HotelProperty[];
  totalCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CAR RENTALS
// ═══════════════════════════════════════════════════════════════════════════

export interface CarSearchParams {
  pickUpLocation: string; // IATA code
  returnLocation?: string;
  pickUpDateTime: string; // ISO 8601
  returnDateTime: string;
  vehicleType?: string;
  vendorCode?: string;
}

export interface CarOffer {
  vendorCode: string;
  vendorName: string;
  vehicleType: string;
  vehicleDescription: string;
  transmission: string;
  airConditioning: boolean;
  dailyRate: {
    amount: number;
    currency: string;
  };
  totalRate: {
    amount: number;
    currency: string;
  };
  pickUpLocation: string;
  returnLocation: string;
}

export interface CarSearchResponse {
  offers: CarOffer[];
  totalCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface Airline {
  code: string;
  name: string;
  country?: string;
}

export interface GeoSearchParams {
  latitude: number;
  longitude: number;
  category?: "AIR" | "HOTEL" | "CAR" | "RAIL";
  radius?: number;
  radiusUnit?: "MI" | "KM";
}

export interface GeoResult {
  code: string;
  name: string;
  type: string;
  distance: number;
  latitude: number;
  longitude: number;
}

export interface GeoSearchResponse {
  results: GeoResult[];
}
