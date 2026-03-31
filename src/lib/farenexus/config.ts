// ─── FareNexus API Configuration ────────────────────────────────────────────
// All config is pulled from environment variables.
// Credentials are injected into each request body (no OAuth token flow).

export const FARENEXUS_CONFIG = {
  baseUrl:
    process.env.FARENEXUS_BASE_URL ||
    "https://a.uat.w.farenexushub.com",
  clientId: process.env.FARENEXUS_CLIENT_ID || "2455883333",
  agencyKey: process.env.FARENEXUS_AGENCY_KEY || "2453476089",
  apiSource: process.env.FARENEXUS_API_SOURCE || "SABRE",
  travelAgencyId: process.env.FARENEXUS_TRAVEL_AGENCY_ID || "1093",
} as const;
