// ─── Sabre Utility / Intelligence APIs ──────────────────────────────────────
// Airport lookup, airline lookup, and geo-based location search.

import { sabreRequest } from "./client";
import type { GeoSearchParams } from "./types";

/**
 * Look up airports by keyword or code.
 * GET /v1/lists/utilities/airports
 */
export async function getAirports(query: string) {
  return sabreRequest("/v1/lists/utilities/airports", {
    method: "GET",
    params: {
      airportcode: query,
    },
  });
}

/**
 * Look up airlines by code or name.
 * GET /v1/lists/utilities/airlines
 */
export async function getAirlines(query: string) {
  return sabreRequest("/v1/lists/utilities/airlines", {
    method: "GET",
    params: {
      airlinecode: query,
    },
  });
}

/**
 * Geo-based location search — find airports, hotels, car locations near coordinates.
 * GET /v1/lists/utilities/geosearch/locations
 */
export async function geoSearch(params: GeoSearchParams) {
  return sabreRequest("/v1/lists/utilities/geosearch/locations", {
    method: "GET",
    params: {
      latitude: String(params.latitude),
      longitude: String(params.longitude),
      ...(params.category ? { category: params.category } : {}),
      ...(params.radius ? { radius: String(params.radius) } : {}),
      ...(params.radiusUnit ? { radiusunit: params.radiusUnit } : {}),
    },
  });
}
