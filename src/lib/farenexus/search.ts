// ─── FareNexus Search API ────────────────────────────────────────────────────
// POST /nexusapi/search
// Returns flight options with reviewKey for the Review step.

import { farenexusRequest } from "./client";
import { FARENEXUS_CONFIG } from "./config";
import type {
  FareNexusSearchParams,
  FareNexusFlightLeg,
  FareNexusSearchResponse,
} from "./types";

/**
 * Search for flights via FareNexus.
 *
 * Builds the full payload from simplified front-end params
 * and returns the raw API response (contains reviewKey per offer
 * needed for the Review step).
 */
export async function searchFlights(
  params: FareNexusSearchParams
): Promise<FareNexusSearchResponse> {
  const isRoundTrip =
    (params.tripType || "RT") === "RT" && !!params.returnDate;

  // Build flight legs
  const flights: FareNexusFlightLeg[] = [
    {
      sequence: 1,
      departureAirport: params.origin,
      arrivalAirport: params.destination,
      departureDate: params.departureDate,
      searchByArrival: false,
    },
  ];

  if (isRoundTrip && params.returnDate) {
    flights.push({
      sequence: 2,
      departureAirport: params.destination,
      arrivalAirport: params.origin,
      departureDate: params.returnDate,
      searchByArrival: false,
    });
  }

  // Build passenger list — default to 1 ADT
  const passengers = params.passengers?.length
    ? params.passengers
    : [{ type: "ADT" as const, quantity: 1 }];

  const body = {
    flight: flights,
    passenger: passengers,
    tripType: isRoundTrip ? "RT" : "OW",
    travelClass: params.travelClass || "ECO",
    pos: params.pos || "CA",
    travelAgencyId: FARENEXUS_CONFIG.travelAgencyId,
  };

  return farenexusRequest<FareNexusSearchResponse>("/nexusapi/search", {
    body,
  });
}
