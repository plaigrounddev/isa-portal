// ─── LiteAPI v3.0 HTTP Client ───────────────────────────────────────────────
// Two base URLs:
//   - api.liteapi.travel  → rate search
//   - book.liteapi.travel → prebook / book

const API_BASE = "https://api.liteapi.travel/v3.0";
const BOOK_BASE = "https://book.liteapi.travel/v3.0";

function getApiKey(): string {
  const key = process.env.LITEAPI_KEY;
  if (!key) throw new Error("LITEAPI_KEY env var is not set");
  return key;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** Use the booking base URL instead of the search base */
  booking?: boolean;
}

export async function liteApiRequest<T = unknown>(
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, booking = false } = opts;
  const base = booking ? BOOK_BASE : API_BASE;
  const url = `${base}${path}`;

  const headers: Record<string, string> = {
    "X-API-Key": getApiKey(),
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      ...(body != null ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  // Safely parse response — guard against empty or non-JSON bodies
  let data: unknown;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    const text = await res.text();
    data = text || null;
  }

  if (!res.ok) {
    const detail =
      typeof (data as Record<string, unknown>)?.error === "string"
        ? (data as Record<string, string>).error
        : JSON.stringify(data);
    console.error(`LiteAPI ${res.status} ${method} ${path}:`, detail);
    throw new Error(`LiteAPI request failed (${res.status})`);
  }

  return data as T;
}
