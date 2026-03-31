// ─── FareNexus Book API ──────────────────────────────────────────────────────
// POST /nexusapi/book
// Final step: takes bookKey + passenger details → creates booking.

import { farenexusRequest } from "./client";
import type { FareNexusBookParams, FareNexusBookResponse } from "./types";

/**
 * Book a flight via FareNexus.
 *
 * @param params — bookKey from Review + passenger details from the booking form
 */
export async function bookFlight(
  params: FareNexusBookParams
): Promise<FareNexusBookResponse> {
  const passengerDetails = params.passengers.map((p) => ({
    firstName: p.firstName,
    lastName: p.lastName,
    gender: p.gender,
    dateOfBirth: p.dateOfBirth,
    programId: ["", ""],
    membershipId: ["", ""],
    billingDetails: { paymentInfo: [{}] },
    customerDetails: {
      emailAddress: [p.email],
      contactInfo: [{ type: "MOBILE" as const, number: p.phone }],
    },
  }));

  return farenexusRequest<FareNexusBookResponse>("/nexusapi/book", {
    body: {
      bookFlow: "AGENT",
      bookKey: params.bookKey,
      agencyEmailAddress: params.agencyEmailAddress || params.passengers[0]?.email || "",
      passengerDetails,
    },
  });
}
