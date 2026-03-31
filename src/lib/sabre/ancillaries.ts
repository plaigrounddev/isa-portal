// ─── Sabre Ancillary APIs ───────────────────────────────────────────────────
// Get, add, and remove optional services (baggage, meals, wifi, etc.)

import { sabreRequest } from "./client";
import type { AncillaryModifyRequest } from "./types";

/**
 * Get available ancillaries for a reservation.
 * POST /v1/offers/getancillaries
 */
export async function getAncillaries(params: {
  origin: string;
  destination: string;
  departureDate: string;
  flightNumber: string;
  airlineCode: string;
}) {
  const body = {
    GetAncillariesRQ: {
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

  return sabreRequest("/v1/offers/getancillaries", {
    method: "POST",
    body,
  });
}

/**
 * Add ancillaries to a PNR.
 * POST /v1/offers/ancillaries/add
 */
export async function addAncillaries(params: AncillaryModifyRequest) {
  const body = {
    ManageAncillariesRQ: {
      version: "1",
      PNRLocator: params.pnrLocator,
      Ancillaries: params.ancillaries.map((a) => ({
        Code: a.code,
        ...(a.segmentRef ? { SegmentRef: a.segmentRef } : {}),
        ...(a.passengerRef ? { PassengerRef: a.passengerRef } : {}),
        ...(a.quantity != null ? { Quantity: a.quantity } : {}),
      })),
    },
  };

  return sabreRequest("/v1/offers/ancillaries/add", {
    method: "POST",
    body,
  });
}

/**
 * Remove ancillaries from a PNR.
 * POST /v1/offers/ancillaries/remove
 */
export async function removeAncillaries(params: AncillaryModifyRequest) {
  const body = {
    ManageAncillariesRQ: {
      version: "1",
      PNRLocator: params.pnrLocator,
      Ancillaries: params.ancillaries.map((a) => ({
        Code: a.code,
        ...(a.segmentRef ? { SegmentRef: a.segmentRef } : {}),
        ...(a.passengerRef ? { PassengerRef: a.passengerRef } : {}),
      })),
    },
  };

  return sabreRequest("/v1/offers/ancillaries/remove", {
    method: "POST",
    body,
  });
}
