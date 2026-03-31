// ─── FareNexus HTTP Client ──────────────────────────────────────────────────
// Shared fetch wrapper that auto-injects credentials into the request body
// and handles JSON serialization and error responses.

import { FARENEXUS_CONFIG } from "./config";

export interface FareNexusRequestOptions {
  /** Additional body fields (credentials are auto-merged) */
  body: Record<string, unknown>;
}

/**
 * Make a POST request to the FareNexus API.
 * Automatically injects clientId, agencyKey, and apiSource into the body.
 */
export async function farenexusRequest<T = unknown>(
  path: string,
  options: FareNexusRequestOptions
): Promise<T> {
  const url = `${FARENEXUS_CONFIG.baseUrl}${path}`;

  // Merge credentials into every request body (credentials last — cannot be overridden)
  const body = {
    ...options.body,
    clientId: FARENEXUS_CONFIG.clientId,
    agencyKey: FARENEXUS_CONFIG.agencyKey,
    apiSource: FARENEXUS_CONFIG.apiSource,
  };

  /** Request timeout (30s) */
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  });

  // Always read body as text first — avoids body-stream-consumed errors
  const rawText = await res.text();

  // Try to parse as JSON
  let data: unknown;
  try {
    data = JSON.parse(rawText);
  } catch {
    if (!res.ok) {
      throw new Error(
        `FareNexus API error ${res.status} POST ${path}: ${rawText.slice(0, 500)}`
      );
    }
    // Non-JSON success is unusual but possible
    data = rawText;
  }

  if (!res.ok) {
    const errorDetail = typeof data === "string" ? data : JSON.stringify(data);
    console.error(`FareNexus API error ${res.status} POST ${path}:`, errorDetail.slice(0, 500));
    throw new Error(`FareNexus request failed (${res.status})`);
  }

  return data as T;
  } finally {
    clearTimeout(timeoutId);
  }
}
