// ─── FareNexus API — Barrel Export ───────────────────────────────────────────
// Re-exports everything from all modules for convenient imports.

// Core
export { FARENEXUS_CONFIG } from "./config";
export { farenexusRequest } from "./client";

// Search
export { searchFlights } from "./search";

// Review
export { reviewFlight } from "./review";

// Book
export { bookFlight } from "./book";

// Types
export type * from "./types";
