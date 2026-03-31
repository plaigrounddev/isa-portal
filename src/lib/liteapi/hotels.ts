// ─── LiteAPI Hotel Functions ────────────────────────────────────────────────
// Search rates, prebook, book, hotel details, places, reviews

import { liteApiRequest } from "./client";

// ════════════════════════════════════════════════════════════════════════════
// HOTEL DETAIL
// ════════════════════════════════════════════════════════════════════════════

export async function getHotelDetail(hotelId: string) {
  return liteApiRequest(`/data/hotel?hotelId=${encodeURIComponent(hotelId)}`);
}

// ════════════════════════════════════════════════════════════════════════════
// HOTEL REVIEWS
// ════════════════════════════════════════════════════════════════════════════

export async function getHotelReviews(hotelId: string, limit = 10) {
  return liteApiRequest(`/data/reviews?hotelId=${encodeURIComponent(hotelId)}&limit=${limit}`);
}

// ════════════════════════════════════════════════════════════════════════════
// PLACES SEARCH
// ════════════════════════════════════════════════════════════════════════════

export async function searchPlaces(textQuery: string, type?: string) {
  const params = new URLSearchParams({ textQuery });
  if (type) params.set('type', type);
  params.set('language', 'en');
  return liteApiRequest(`/data/places?${params.toString()}`);
}

// ════════════════════════════════════════════════════════════════════════════
// SEARCH HOTEL RATES
// ════════════════════════════════════════════════════════════════════════════

export interface SearchHotelRatesParams {
  /** City name (e.g. "New York") */
  cityName: string;
  /** ISO country code (e.g. "US") */
  countryCode: string;
  /** Check-in date YYYY-MM-DD */
  checkin: string;
  /** Check-out date YYYY-MM-DD */
  checkout: string;
  /** Number of adults */
  adults: number;
  /** Children ages (empty array if none) */
  children?: number[];
  /** Number of rooms */
  rooms?: number;
  /** Currency code (e.g. "USD") */
  currency?: string;
  /** Guest nationality ISO code */
  guestNationality?: string;
  /** Max results to return */
  limit?: number;
}

export async function searchHotelRates(params: SearchHotelRatesParams) {
  const {
    cityName,
    countryCode,
    checkin,
    checkout,
    adults,
    children = [],
    rooms = 1,
    currency = "USD",
    guestNationality = "US",
    limit = 20,
  } = params;

  // Build occupancies — one object per room
  const occupancies = Array.from({ length: rooms }, () => ({
    adults,
    ...(children.length > 0 ? { children } : {}),
  }));

  const body = {
    cityName,
    countryCode,
    checkin,
    checkout,
    currency,
    guestNationality,
    occupancies,
    limit,
    timeout: 10,
    includeHotelData: true,
    maxRatesPerHotel: 3,
    sort: [{ field: "top_picks" as const, direction: "descending" as const }],
  };

  return liteApiRequest("/hotels/rates", {
    method: "POST",
    body,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// PREBOOK
// ════════════════════════════════════════════════════════════════════════════

export interface PrebookParams {
  offerId: string;
  usePaymentSdk?: boolean;
}

export async function prebookRate(params: PrebookParams) {
  return liteApiRequest("/rates/prebook", {
    method: "POST",
    body: {
      offerId: params.offerId,
      usePaymentSdk: params.usePaymentSdk ?? false,
    },
    booking: true,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// BOOK
// ════════════════════════════════════════════════════════════════════════════

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
}

export interface BookParams {
  prebookId: string;
  guestInfo: GuestInfo;
  payment: {
    method: string; // e.g. "ACC_CREDIT_CARD" for sandbox
  };
}

export async function bookRate(params: BookParams & { rooms?: number }) {
  const roomCount = params.rooms ?? 1;
  const guests = Array.from({ length: roomCount }, (_, i) => ({
    occupancyNumber: i + 1,
    remarks: "",
    firstName: params.guestInfo.firstName,
    lastName: params.guestInfo.lastName,
  }));

  return liteApiRequest("/rates/book", {
    method: "POST",
    body: {
      prebookId: params.prebookId,
      holder: params.guestInfo,
      payment: params.payment,
      guests,
    },
    booking: true,
  });
}
