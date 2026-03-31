// ─── FareNexus API Configuration ────────────────────────────────────────────
// All config is pulled from environment variables.
// Credentials are injected into each request body (no OAuth token flow).

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const FARENEXUS_CONFIG = {
  get baseUrl() { return requireEnv("FARENEXUS_BASE_URL"); },
  get clientId() { return requireEnv("FARENEXUS_CLIENT_ID"); },
  get agencyKey() { return requireEnv("FARENEXUS_AGENCY_KEY"); },
  get apiSource() { return requireEnv("FARENEXUS_API_SOURCE"); },
  get travelAgencyId() { return requireEnv("FARENEXUS_TRAVEL_AGENCY_ID"); },
} as const;
