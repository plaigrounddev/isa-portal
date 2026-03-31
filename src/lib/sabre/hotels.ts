// ─── Sabre Hotel APIs (from official OpenAPI specs) ─────────────────────────
// Hotel Search:      POST /v1/hotels/hotelSearch
// Hotel Rates:       POST /v1/hotels/getHotelRates
// Hotel Price Check: POST /v1/hotels/checkHotelRate

import { sabreRequest } from "./client";

// ════════════════════════════════════════════════════════════════════════════
// HOTEL SEARCH — Broad availability search
// POST /v1/hotels/hotelSearch
// ════════════════════════════════════════════════════════════════════════════

export interface HotelSearchByGeoParams {
  latitude: number;
  longitude: number;
  radiusInMiles: number;
  checkInDate: string;   // YYYY-MM-DD
  checkOutDate: string;  // YYYY-MM-DD
  numberOfAdults?: number;
  numberOfChildren?: number;
  childAges?: number[];
  maxResults?: number;
  restrictSearchToCountry?: string; // 2-letter ISO
  sortBy?: "NegotiatedRateAvailability" | "DistanceFrom" | "SabreRating" | "AverageNightlyRate" | "AverageNightlyRateBeforeTax";
  sortOrder?: "ASC" | "DESC";
  searchSource?: "ALL" | "ALL_NON_GDS" | "GDS" | "EXPEDIA" | "BEDSONLINE" | "BOOKING" | "CMNET" | "NUITEE";
}

export interface HotelSearchByAddressParams {
  address: {
    street?: string;
    city?: string;
    stateProvinceCode?: string;
    postalCode?: string;
    countryCode: string;
  };
  radiusInMiles: number;
  checkInDate: string;
  checkOutDate: string;
  numberOfAdults?: number;
  numberOfChildren?: number;
  childAges?: number[];
  maxResults?: number;
  restrictSearchToCountry?: string;
  sortBy?: "NegotiatedRateAvailability" | "DistanceFrom" | "SabreRating" | "AverageNightlyRate" | "AverageNightlyRateBeforeTax";
  sortOrder?: "ASC" | "DESC";
  searchSource?: "ALL" | "ALL_NON_GDS" | "GDS" | "EXPEDIA" | "BEDSONLINE" | "BOOKING" | "CMNET" | "NUITEE";
}

export interface HotelSearchByRefPointParams {
  referencePoint: {
    type: "Airport" | "Rail" | "Property" | "Point" | "Polygon";
    value: string; // e.g. "DFW"
    stateProvinceCode?: string;
    countryCode?: string;
  };
  radiusInMiles: number;
  checkInDate: string;
  checkOutDate: string;
  numberOfAdults?: number;
  numberOfChildren?: number;
  childAges?: number[];
  maxResults?: number;
  restrictSearchToCountry?: string;
  sortBy?: "NegotiatedRateAvailability" | "DistanceFrom" | "SabreRating" | "AverageNightlyRate" | "AverageNightlyRateBeforeTax";
  sortOrder?: "ASC" | "DESC";
  searchSource?: "ALL" | "ALL_NON_GDS" | "GDS" | "EXPEDIA" | "BEDSONLINE" | "BOOKING" | "CMNET" | "NUITEE";
}

export type HotelSearchParams =
  | HotelSearchByGeoParams
  | HotelSearchByAddressParams
  | HotelSearchByRefPointParams;

/**
 * Hotel Search — broad availability search.
 * Based on `hotelsearch.yml` OpenAPI spec.
 *
 * POST /v1/hotels/hotelSearch
 */
export async function hotelSearch(params: HotelSearchParams) {
  return sabreRequest("/v1/hotels/hotelSearch", {
    method: "POST",
    body: params,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// HOTEL RATES — Detailed rates for a specific property
// POST /v1/hotels/getHotelRates
// ════════════════════════════════════════════════════════════════════════════

export interface HotelRatesParams {
  hotelCode: string;
  checkInDate: string;   // YYYY-MM-DD
  checkOutDate: string;  // YYYY-MM-DD
  numberOfAdults?: number;
  numberOfChildren?: number;
  childAges?: number[];
  roomType?: string;  // e.g. "Suite", "Deluxe Room", etc.
  bedType?: "Double" | "Futon" | "King" | "Murphy" | "Queen" | "Sofa" | "Twin" | "Dorm" | "Water";
  maxResults?: number;
  searchSource?: "ALL" | "ALL_NON_GDS" | "GDS" | "EXPEDIA" | "BEDSONLINE" | "BOOKING" | "CMNET" | "NUITEE";
  sortBy?: "AverageNightlyRateBeforeTax" | "NightlyRate" | "Refundability" | "NegotiatedRates";
  sortOrder?: "ASC" | "DESC";
  corporateNumber?: string;
}

/**
 * Hotel Rates — rates for a specific hotel property.
 * Based on `hotelrates.yml` OpenAPI spec.
 *
 * POST /v1/hotels/getHotelRates
 */
export async function getHotelRates(params: HotelRatesParams) {
  return sabreRequest("/v1/hotels/getHotelRates", {
    method: "POST",
    body: params,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// HOTEL PRICE CHECK — Verify rate before booking
// POST /v1/hotels/checkHotelRate
// ════════════════════════════════════════════════════════════════════════════

export interface HotelPriceCheckParams {
  /** The rateKey from a previous getHotelRates response */
  rateKey: string;
  /** Stay dates (optional override) */
  stayDateTimeRange?: {
    checkInDate: string;  // YYYY-MM-DD
    checkOutDate: string; // YYYY-MM-DD
  };
  /** Room configuration */
  rooms?: Array<{
    roomIndex: number;
    numberOfAdults: number;
    numberOfChildren?: number;
    childAges?: number[];
  }>;
}

/**
 * Hotel Price Check — verify rate availability before booking.
 * Based on `hotelpricecheck.yml` OpenAPI spec.
 *
 * POST /v1/hotels/checkHotelRate
 */
export async function checkHotelRate(params: HotelPriceCheckParams) {
  const body: Record<string, unknown> = {
    hotelPriceCheckRq: {
      rateInfoRef: {
        rateKey: params.rateKey,
        ...(params.stayDateTimeRange
          ? { stayDateTimeRange: params.stayDateTimeRange }
          : {}),
        ...(params.rooms
          ? { rooms: { room: params.rooms } }
          : {}),
      },
    },
  };

  return sabreRequest("/v1/hotels/checkHotelRate", {
    method: "POST",
    body,
  });
}
