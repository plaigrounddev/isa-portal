// ─── Sabre Seat Map APIs ────────────────────────────────────────────────────
// Retrieve seat maps by reservation payload or PNR locator.

import { sabreRequest } from "./client";
import type { SeatMapRequest } from "./types";

/**
 * Get seat map by reservation payload.
 * POST /v1/offers/getseats
 */
export async function getSeatsByReservation(params: SeatMapRequest) {
  const body = {
    GetSeatsRQ: {
      version: "1",
      FlightInfo: {
        DepartureDate: params.departureDate,
        FlightNumber: params.flightNumber,
        Airline: { Code: params.airlineCode },
        DepartureAirport: params.origin,
        ArrivalAirport: params.destination,
      },
    },
  };

  return sabreRequest("/v1/offers/getseats", {
    method: "POST",
    body,
  });
}

/**
 * Get seat map by PNR locator.
 * POST /v1/offers/getseats/bypnr
 */
export async function getSeatsByPNR(pnrLocator: string) {
  const normalizedPnr = pnrLocator.trim();
  if (!normalizedPnr) {
    throw new Error("pnrLocator is required");
  }

  const body = {
    GetSeatsRQ: {
      version: "1",
      PNRLocator: normalizedPnr,
    },
  };

  return sabreRequest("/v1/offers/getseats/bypnr", {
    method: "POST",
    body,
  });
}
