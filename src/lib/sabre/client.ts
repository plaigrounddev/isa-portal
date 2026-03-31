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

  const makeRequest = async (token: string): Promise<Response> => {
    const reqHeaders: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    };

    return fetch(url, {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
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
    throw new Error(`Sabre API error ${res.status} ${method} ${path}: ${errorBody}`);
  }

  return res.json() as Promise<T>;
}
