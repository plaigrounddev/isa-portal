// ─── Sabre Air APIs (from official OpenAPI specs) ───────────────────────────
// Flight Shop: POST /v1/offers/flightShop
// Flight Check: POST /v1/offers/flightCheck

import { sabreRequest } from "./client";

// ════════════════════════════════════════════════════════════════════════════
// FLIGHT SHOP — Multi-source shopping API
// POST /v1/offers/flightShop
// ════════════════════════════════════════════════════════════════════════════

export interface FlightShopParams {
  /** Departure airport/city code (3 letters) */
  origin: string;
  /** Arrival airport/city code (3 letters) */
  destination: string;
  /** Departure date YYYY-MM-DD */
  departureDate: string;
  /** Return date YYYY-MM-DD (omit for one-way) */
  returnDate?: string;
  /** Passenger types (defaults to 1 ADT) */
  passengers?: Array<{ passengerTypeCode: string; count?: number }>;
  /** Cabin preference */
  cabin?: "Premium First" | "First" | "Premium Business" | "Business" | "Premium Economy" | "Economy";
  /** Max results to return */
  maxOffers?: number;
  /** Max number of stops */
  maxStops?: number;
  /** Currency code for prices */
  currencyCode?: string;
  /** Return baggage / flexibility attributes */
  returnOfferAttributes?: Array<"Baggage" | "Flexibility" | "Carbon Emissions">;
}

/**
 * Flight Shop — multi-source air shopping.
 * Based on `flightshop.yml` OpenAPI spec.
 *
 * POST /v1/offers/flightShop
 */
export async function flightShop(params: FlightShopParams) {
  // Build journeys array
  const journeys: Array<Record<string, unknown>> = [
    {
      departureLocation: { airportCode: params.origin },
      arrivalLocation: { airportCode: params.destination },
      departureDate: params.departureDate,
    },
  ];

  // Add return leg if round trip
  if (params.returnDate) {
    journeys.push({
      departureLocation: { airportCode: params.destination },
      arrivalLocation: { airportCode: params.origin },
      departureDate: params.returnDate,
    });
  }

  // Build travelers array
  const travelers = params.passengers?.map((p) => ({
    passengerTypeCode: p.passengerTypeCode,
  })) || [{ passengerTypeCode: "ADT" }];

  // Build request body per spec
  const body: Record<string, unknown> = {
    journeys,
    travelers,
  };

  // Route preferences
  if (params.maxStops !== undefined) {
    body.route = { maximumNumberOfStops: params.maxStops };
  }

  // Fare preferences
  const fare: Record<string, unknown> = {};
  if (params.currencyCode) fare.currencyCode = params.currencyCode;
  if (params.cabin) fare.cabin = { name: params.cabin };
  if (Object.keys(fare).length > 0) body.fare = fare;

  // Retailing attributes
  if (params.returnOfferAttributes?.length) {
    body.retailing = {
      returnOfferAttributes: params.returnOfferAttributes,
    };
  }

  // Processing options
  if (params.maxOffers) {
    body.processingOptions = {
      limitNumberOfOffers: params.maxOffers,
    };
  }

  return sabreRequest("/v1/offers/flightShop", {
    method: "POST",
    body,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// FLIGHT CHECK — Revalidate price & availability
// POST /v1/offers/flightCheck
// ════════════════════════════════════════════════════════════════════════════

export interface FlightCheckFlight {
  departureAirportCode: string;
  departureDate: string; // YYYY-MM-DD
  departureTime: string; // HH:MM
  arrivalAirportCode: string;
  arrivalDate: string;
  arrivalTime: string;
  marketingAirlineCode: string;
  marketingFlightNumber: number;
  segmentDetails?: {
    bookingClassCode: string; // e.g. "Y", "E"
  };
}

export interface FlightCheckParams {
  /** Payload-based: journeys with flights */
  journeys: Array<{
    flights: FlightCheckFlight[];
  }>;
  /** Traveler types */
  travelers: Array<{
    passengerTypeCode: string; // e.g. "ADT"
  }>;
  /** Currency preference */
  currencyCode?: string;
  /** Cabin preference */
  cabin?: "Premium First" | "First" | "Premium Business" | "Business" | "Premium Economy" | "Economy";
}

export interface FlightCheckByOfferIdParams {
  /** Offer item IDs from a previous flightShop response */
  offerItemIds: string[];
  travelers?: Array<{
    passengerTypeCode: string;
  }>;
}

/**
 * Flight Check — payload-based revalidation.
 * Based on `flightcheck.yml` OpenAPI spec.
 *
 * POST /v1/offers/flightCheck
 */
export async function flightCheck(params: FlightCheckParams) {
  const body: Record<string, unknown> = {
    journeys: params.journeys,
    travelers: params.travelers,
  };

  // Fare qualifiers
  const fare: Record<string, unknown> = {};
  if (params.currencyCode) fare.currencyCode = params.currencyCode;
  if (params.cabin) fare.cabin = { name: params.cabin };
  if (Object.keys(fare).length > 0) body.fare = fare;

  return sabreRequest("/v1/offers/flightCheck", {
    method: "POST",
    body,
  });
}

/**
 * Flight Check — offerItemId-based revalidation.
 * Validates offers by their IDs from a previous flightShop response.
 *
 * POST /v1/offers/flightCheck
 */
export async function flightCheckByOfferId(params: FlightCheckByOfferIdParams) {
  const body: Record<string, unknown> = {
    offerItemIds: params.offerItemIds,
  };

  if (params.travelers?.length) {
    body.travelers = params.travelers;
  }

  return sabreRequest("/v1/offers/flightCheck", {
    method: "POST",
    body,
  });
}
