// ─── FareNexus Review API ────────────────────────────────────────────────────
// POST /nexusapi/review
// Takes a reviewKey from Search, returns bookKey for the Book step.

import { farenexusRequest } from "./client";
import type { FareNexusReviewResponse } from "./types";

/**
 * Review a flight offer to get the bookKey.
 *
 * @param reviewKey — from a previous Search response
 */
export async function reviewFlight(
  reviewKey: string
): Promise<FareNexusReviewResponse> {
  return farenexusRequest<FareNexusReviewResponse>("/nexusapi/review", {
    body: { reviewKey },
  });
}
