// ─── FareNexus API TypeScript Definitions ───────────────────────────────────
// Covers request/response shapes for Search, Review, and Book endpoints.

// ═══════════════════════════════════════════════════════════════════════════
// COMMON
// ═══════════════════════════════════════════════════════════════════════════

export interface FareNexusCredentials {
  clientId: string;
  agencyKey: string;
  apiSource: string;
  travelAgencyId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════════════════════

export interface FareNexusFlightLeg {
  sequence: number;
  departureAirport?: string;
  arrivalAirport?: string;
  departureDate?: string; // YYYY-MM-DD
  arrivalDate?: string; // YYYY-MM-DD
  searchByArrival?: boolean;
}

export interface FareNexusPassenger {
  type: "ADT" | "CNN" | "INF"; // Adult, Child, Infant
  quantity: number;
}

export interface FareNexusSearchRequest {
  flight: FareNexusFlightLeg[];
  passenger: FareNexusPassenger[];
  tripType: "OW" | "RT" | "MC"; // One-way, Round-trip, Multi-city
  travelClass: "ECO" | "PEY" | "BUS" | "FIR"; // Economy, Prem-Eco, Business, First
  pos: string; // Point of sale country code
  clientId: string;
  agencyKey: string;
  apiSource: string;
  travelAgencyId: string;
}

/** Simplified search params the front-end sends to our API route */
export interface FareNexusSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers?: FareNexusPassenger[];
  tripType?: "OW" | "RT" | "MC";
  travelClass?: "ECO" | "PEY" | "BUS" | "FIR";
  pos?: string;
}

// The raw search response is large and varies — we type the parts we need
export interface FareNexusSearchResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// ═══════════════════════════════════════════════════════════════════════════
// REVIEW
// ═══════════════════════════════════════════════════════════════════════════

export interface FareNexusReviewRequest {
  reviewKey: string;
  clientId: string;
  agencyKey: string;
  apiSource: string;
}

export interface FareNexusReviewResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOK
// ═══════════════════════════════════════════════════════════════════════════

export interface FareNexusContactInfo {
  type: "MOBILE" | "HOME" | "WORK";
  number: string;
}

export interface FareNexusPassengerDetail {
  firstName: string;
  lastName: string;
  gender: "M" | "F";
  dateOfBirth: string; // YYYY-MM-DD
  programId?: string[];
  membershipId?: string[];
  billingDetails?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paymentInfo: Record<string, any>[];
  };
  customerDetails?: {
    emailAddress: string[];
    contactInfo: FareNexusContactInfo[];
  };
}

export interface FareNexusBookRequest {
  clientId: string;
  agencyKey: string;
  apiSource: string;
  bookFlow: "AGENT" | "CUSTOMER";
  bookKey: string;
  agencyEmailAddress: string;
  passengerDetails: FareNexusPassengerDetail[];
}

/** Simplified book params the front-end sends to our API route */
export interface FareNexusBookParams {
  bookKey: string;
  agencyEmailAddress?: string;
  passengers: Array<{
    firstName: string;
    lastName: string;
    gender: "M" | "F";
    dateOfBirth: string;
    email: string;
    phone: string;
  }>;
}

export interface FareNexusBookResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
