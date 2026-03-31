// ─── Sabre API — Barrel Export ───────────────────────────────────────────────
// Re-exports everything from all modules for convenient imports.

// Core
export { SABRE_CONFIG } from "./config";
export { getToken, clearTokenCache } from "./auth";
export { sabreRequest } from "./client";

// Air Shopping & Revalidation (from official OpenAPI specs)
export {
  flightShop,
  flightCheck,
  flightCheckByOfferId,
} from "./air";
export type {
  FlightShopParams,
  FlightCheckParams,
  FlightCheckFlight,
  FlightCheckByOfferIdParams,
} from "./air";

// Hotels (from official OpenAPI specs)
export {
  hotelSearch,
  getHotelRates,
  checkHotelRate,
} from "./hotels";
export type {
  HotelSearchParams,
  HotelSearchByGeoParams,
  HotelSearchByAddressParams,
  HotelSearchByRefPointParams,
  HotelRatesParams,
  HotelPriceCheckParams,
} from "./hotels";

// Booking
export { createBooking, getBooking, cancelBooking } from "./booking";

// Seat Maps
export { getSeatsByReservation, getSeatsByPNR } from "./seats";

// Ancillaries
export {
  getAncillaries,
  addAncillaries,
  removeAncillaries,
} from "./ancillaries";

// Car Rentals
export { searchCars, bookCar } from "./cars";

// Utilities
export { getAirports, getAirlines, geoSearch } from "./utilities";

// Types
export type * from "./types";
