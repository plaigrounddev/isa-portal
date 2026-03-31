// ─── Sabre API Configuration ────────────────────────────────────────────────
// All config is pulled from environment variables.
// Default base URL points to the CERT (sandbox) environment.

export const SABRE_CONFIG = {
  baseUrl:
    process.env.SABRE_BASE_URL || "https://api.cert.platform.sabre.com",
  userId: process.env.SABRE_USER_ID || "",
  password: process.env.SABRE_PASSWORD || "",
  tokenEndpoint: "/v2/auth/token",
} as const;
