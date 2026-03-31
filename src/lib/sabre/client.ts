// ─── Sabre HTTP Client ──────────────────────────────────────────────────────
// Shared fetch wrapper that auto-injects the bearer token and handles
// JSON serialization, error responses, and 401 retry.

import { SABRE_CONFIG } from "./config";
import { getToken, clearTokenCache } from "./auth";

export interface SabreRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

/**
 * Make an authenticated request to the Sabre REST API.
 * Automatically retries once on 401 (token expired).
 */
export async function sabreRequest<T = unknown>(
  path: string,
  options: SabreRequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, params } = options;

  let url = `${SABRE_CONFIG.baseUrl}${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    url += `?${qs}`;
  }

  const REQUEST_TIMEOUT_MS = 30_000;

  const makeRequest = async (token: string): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const reqHeaders: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    };

    try {
      return await fetch(url, {
        method,
        headers: reqHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // First attempt
  let token = await getToken();
  let res = await makeRequest(token);

  // Retry once on 401
  if (res.status === 401) {
    clearTokenCache();
    token = await getToken();
    res = await makeRequest(token);
  }

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`Sabre API error ${res.status} ${method} ${path}:`, errorBody.slice(0, 500));
    throw new Error(`Sabre request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}
