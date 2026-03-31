// ─── Sabre OAuth 2.0 Authentication ─────────────────────────────────────────
// Implements the double-Base64 credential encoding required by Sabre:
//   1. Base64(userId) + ":" + Base64(password)
//   2. Base64(step1)
// Tokens are cached in-memory and auto-refreshed when expired.

import { SABRE_CONFIG } from "./config";

interface TokenCache {
  accessToken: string;
  expiresAt: number; // unix ms
}

let cache: TokenCache | null = null;
let inFlightTokenRequest: Promise<TokenCache> | null = null;

/** Request timeout in milliseconds (30s) */
const AUTH_TIMEOUT_MS = 30_000;

/** Base64 encode a string (works in Node.js) */
function b64(str: string): string {
  return Buffer.from(str).toString("base64");
}

/** Build the Authorization header value for the token request */
function buildAuthHeader(): string {
  const { userId, password } = SABRE_CONFIG;
  if (!userId || !password) {
    throw new Error(
      "Missing SABRE_USER_ID or SABRE_PASSWORD environment variables"
    );
  }
  const userIdB64 = b64(userId);
  const passwordB64 = b64(password);
  const combined = `${userIdB64}:${passwordB64}`;
  return `Basic ${b64(combined)}`;
}

/**
 * Fetch a fresh OAuth token from Sabre.
 * Uses client_credentials grant → returns a sessionless bearer token (7-day TTL).
 * Includes a 30s timeout via AbortController to prevent hanging.
 */
async function fetchToken(): Promise<TokenCache> {
  const url = `${SABRE_CONFIG.baseUrl}${SABRE_CONFIG.tokenEndpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: buildAuthHeader(),
      },
      body: "grant_type=client_credentials",
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Sabre auth failed (${res.status}): ${body}`);
    }

    const data = await res.json();

    const expiresInSec = Number(data.expires_in);
    const safeTtlSec = Number.isFinite(expiresInSec)
      ? Math.max(expiresInSec - 60, 5)
      : 300;

    return {
      accessToken: data.access_token,
      expiresAt: Date.now() + safeTtlSec * 1000,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Get a valid Sabre bearer token.
 * Returns a cached token if still valid, otherwise fetches a new one.
 */
export async function getToken(): Promise<string> {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.accessToken;
  }
  if (!inFlightTokenRequest) {
    inFlightTokenRequest = fetchToken().finally(() => {
      inFlightTokenRequest = null;
    });
  }
  cache = await inFlightTokenRequest;
  return cache.accessToken;
}

/** Force-clear the cached token (useful after a 401). */
export function clearTokenCache(): void {
  cache = null;
}
