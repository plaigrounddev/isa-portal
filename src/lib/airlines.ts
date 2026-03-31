// ─── Airline Taxonomy ───────────────────────────────────────────────────────
// Comprehensive airline database: IATA code → name, logo, alliance, country.
// Logos served from pics.avs.io CDN (free, reliable, wide coverage).
//
// This covers all major airlines likely to appear in SABRE/FareNexus results.
// The getAirlineLogo() function also handles unknown airlines gracefully.

export interface AirlineInfo {
  code: string;
  name: string;
  country: string;
  alliance?: "Star Alliance" | "oneworld" | "SkyTeam" | "none";
}

/**
 * Get airline logo URL from the avs.io CDN.
 * Returns a 2x resolution PNG for retina displays.
 */
export function getAirlineLogo(
  code: string,
  size: number = 60
): string {
  return `https://pics.avs.io/${size * 2}/${size * 2}/${code.toUpperCase()}.png`;
}

/**
 * Get airline info by IATA code.
 * Falls back to a generic entry with the code as the name.
 */
export function getAirlineInfo(code: string): AirlineInfo {
  return (
    AIRLINE_DB[code.toUpperCase()] || {
      code: code.toUpperCase(),
      name: code.toUpperCase(),
      country: "",
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AIRLINE DATABASE
// ═══════════════════════════════════════════════════════════════════════════

export const AIRLINE_DB: Record<string, AirlineInfo> = {
  // ── Canadian Carriers (primary FareNexus market) ──────────────────────
  AC: { code: "AC", name: "Air Canada", country: "CA", alliance: "Star Alliance" },
  PD: { code: "PD", name: "Porter Airlines", country: "CA", alliance: "none" },
  TS: { code: "TS", name: "Air Transat", country: "CA", alliance: "none" },
  WS: { code: "WS", name: "WestJet", country: "CA", alliance: "none" },
  WR: { code: "WR", name: "WestJet Encore", country: "CA", alliance: "none" },
  QK: { code: "QK", name: "Jazz Aviation (Air Canada)", country: "CA", alliance: "Star Alliance" },
  RV: { code: "RV", name: "Air Canada Rouge", country: "CA", alliance: "Star Alliance" },
  "4N": { code: "4N", name: "Flair Airlines", country: "CA", alliance: "none" },
  Y9: { code: "Y9", name: "Lynx Air", country: "CA", alliance: "none" },
  MO: { code: "MO", name: "Calm Air", country: "CA", alliance: "none" },
  PB: { code: "PB", name: "PAL Airlines", country: "CA", alliance: "none" },

  // ── US Majors ─────────────────────────────────────────────────────────
  AA: { code: "AA", name: "American Airlines", country: "US", alliance: "oneworld" },
  DL: { code: "DL", name: "Delta Air Lines", country: "US", alliance: "SkyTeam" },
  UA: { code: "UA", name: "United Airlines", country: "US", alliance: "Star Alliance" },
  WN: { code: "WN", name: "Southwest Airlines", country: "US", alliance: "none" },
  B6: { code: "B6", name: "JetBlue Airways", country: "US", alliance: "none" },
  AS: { code: "AS", name: "Alaska Airlines", country: "US", alliance: "oneworld" },
  NK: { code: "NK", name: "Spirit Airlines", country: "US", alliance: "none" },
  F9: { code: "F9", name: "Frontier Airlines", country: "US", alliance: "none" },
  HA: { code: "HA", name: "Hawaiian Airlines", country: "US", alliance: "none" },
  SY: { code: "SY", name: "Sun Country Airlines", country: "US", alliance: "none" },
  G4: { code: "G4", name: "Allegiant Air", country: "US", alliance: "none" },

  // ── US Regionals (common codeshare/operating carriers) ────────────────
  OO: { code: "OO", name: "SkyWest Airlines", country: "US", alliance: "none" },
  YX: { code: "YX", name: "Republic Airways", country: "US", alliance: "none" },
  MQ: { code: "MQ", name: "Envoy Air (American Eagle)", country: "US", alliance: "oneworld" },
  OH: { code: "OH", name: "PSA Airlines (American Eagle)", country: "US", alliance: "oneworld" },
  PT: { code: "PT", name: "Piedmont Airlines", country: "US", alliance: "none" },
  CP: { code: "CP", name: "Compass Airlines", country: "US", alliance: "none" },
  YV: { code: "YV", name: "Mesa Airlines", country: "US", alliance: "none" },
  C5: { code: "C5", name: "CommutAir", country: "US", alliance: "none" },
  ZW: { code: "ZW", name: "Air Wisconsin", country: "US", alliance: "none" },
  "9E": { code: "9E", name: "Endeavor Air (Delta)", country: "US", alliance: "SkyTeam" },

  // ── European Majors ───────────────────────────────────────────────────
  BA: { code: "BA", name: "British Airways", country: "GB", alliance: "oneworld" },
  LH: { code: "LH", name: "Lufthansa", country: "DE", alliance: "Star Alliance" },
  AF: { code: "AF", name: "Air France", country: "FR", alliance: "SkyTeam" },
  KL: { code: "KL", name: "KLM Royal Dutch Airlines", country: "NL", alliance: "SkyTeam" },
  IB: { code: "IB", name: "Iberia", country: "ES", alliance: "oneworld" },
  AZ: { code: "AZ", name: "ITA Airways", country: "IT", alliance: "SkyTeam" },
  LX: { code: "LX", name: "Swiss International Air Lines", country: "CH", alliance: "Star Alliance" },
  OS: { code: "OS", name: "Austrian Airlines", country: "AT", alliance: "Star Alliance" },
  SK: { code: "SK", name: "SAS Scandinavian Airlines", country: "SE", alliance: "SkyTeam" },
  AY: { code: "AY", name: "Finnair", country: "FI", alliance: "oneworld" },
  TP: { code: "TP", name: "TAP Air Portugal", country: "PT", alliance: "Star Alliance" },
  EI: { code: "EI", name: "Aer Lingus", country: "IE", alliance: "none" },
  SN: { code: "SN", name: "Brussels Airlines", country: "BE", alliance: "Star Alliance" },
  LO: { code: "LO", name: "LOT Polish Airlines", country: "PL", alliance: "Star Alliance" },
  OK: { code: "OK", name: "Czech Airlines", country: "CZ", alliance: "SkyTeam" },
  RO: { code: "RO", name: "TAROM", country: "RO", alliance: "SkyTeam" },
  TK: { code: "TK", name: "Turkish Airlines", country: "TR", alliance: "Star Alliance" },

  // ── European LCCs ─────────────────────────────────────────────────────
  FR: { code: "FR", name: "Ryanair", country: "IE", alliance: "none" },
  U2: { code: "U2", name: "easyJet", country: "GB", alliance: "none" },
  W6: { code: "W6", name: "Wizz Air", country: "HU", alliance: "none" },
  VY: { code: "VY", name: "Vueling", country: "ES", alliance: "none" },
  DY: { code: "DY", name: "Norwegian Air Shuttle", country: "NO", alliance: "none" },
  LS: { code: "LS", name: "Jet2.com", country: "GB", alliance: "none" },

  // ── Middle East & Africa ──────────────────────────────────────────────
  EK: { code: "EK", name: "Emirates", country: "AE", alliance: "none" },
  QR: { code: "QR", name: "Qatar Airways", country: "QA", alliance: "oneworld" },
  EY: { code: "EY", name: "Etihad Airways", country: "AE", alliance: "none" },
  MS: { code: "MS", name: "EgyptAir", country: "EG", alliance: "Star Alliance" },
  RJ: { code: "RJ", name: "Royal Jordanian", country: "JO", alliance: "oneworld" },
  SA: { code: "SA", name: "South African Airways", country: "ZA", alliance: "Star Alliance" },
  ET: { code: "ET", name: "Ethiopian Airlines", country: "ET", alliance: "Star Alliance" },
  KQ: { code: "KQ", name: "Kenya Airways", country: "KE", alliance: "SkyTeam" },
  AT: { code: "AT", name: "Royal Air Maroc", country: "MA", alliance: "oneworld" },

  // ── Asia-Pacific ──────────────────────────────────────────────────────
  SQ: { code: "SQ", name: "Singapore Airlines", country: "SG", alliance: "Star Alliance" },
  CX: { code: "CX", name: "Cathay Pacific", country: "HK", alliance: "oneworld" },
  NH: { code: "NH", name: "ANA (All Nippon Airways)", country: "JP", alliance: "Star Alliance" },
  JL: { code: "JL", name: "Japan Airlines", country: "JP", alliance: "oneworld" },
  KE: { code: "KE", name: "Korean Air", country: "KR", alliance: "SkyTeam" },
  OZ: { code: "OZ", name: "Asiana Airlines", country: "KR", alliance: "Star Alliance" },
  CI: { code: "CI", name: "China Airlines", country: "TW", alliance: "SkyTeam" },
  BR: { code: "BR", name: "EVA Air", country: "TW", alliance: "Star Alliance" },
  TG: { code: "TG", name: "Thai Airways", country: "TH", alliance: "Star Alliance" },
  MH: { code: "MH", name: "Malaysia Airlines", country: "MY", alliance: "oneworld" },
  GA: { code: "GA", name: "Garuda Indonesia", country: "ID", alliance: "SkyTeam" },
  PR: { code: "PR", name: "Philippine Airlines", country: "PH", alliance: "none" },
  AI: { code: "AI", name: "Air India", country: "IN", alliance: "Star Alliance" },
  QF: { code: "QF", name: "Qantas", country: "AU", alliance: "oneworld" },
  NZ: { code: "NZ", name: "Air New Zealand", country: "NZ", alliance: "Star Alliance" },
  VA: { code: "VA", name: "Virgin Australia", country: "AU", alliance: "none" },

  // ── Asia LCCs ─────────────────────────────────────────────────────────
  AK: { code: "AK", name: "AirAsia", country: "MY", alliance: "none" },
  SL: { code: "SL", name: "Thai Lion Air", country: "TH", alliance: "none" },
  "3K": { code: "3K", name: "Jetstar Asia", country: "SG", alliance: "none" },
  JQ: { code: "JQ", name: "Jetstar Airways", country: "AU", alliance: "none" },

  // ── Latin America ─────────────────────────────────────────────────────
  LA: { code: "LA", name: "LATAM Airlines", country: "CL", alliance: "none" },
  CM: { code: "CM", name: "Copa Airlines", country: "PA", alliance: "Star Alliance" },
  AV: { code: "AV", name: "Avianca", country: "CO", alliance: "Star Alliance" },
  AM: { code: "AM", name: "Aeromexico", country: "MX", alliance: "SkyTeam" },
  AR: { code: "AR", name: "Aerolíneas Argentinas", country: "AR", alliance: "SkyTeam" },
  G3: { code: "G3", name: "GOL Linhas Aéreas", country: "BR", alliance: "none" },

  // ── China ──────────────────────────────────────────────────────────────
  CA: { code: "CA", name: "Air China", country: "CN", alliance: "Star Alliance" },
  MU: { code: "MU", name: "China Eastern Airlines", country: "CN", alliance: "SkyTeam" },
  CZ: { code: "CZ", name: "China Southern Airlines", country: "CN", alliance: "SkyTeam" },
  HU: { code: "HU", name: "Hainan Airlines", country: "CN", alliance: "none" },
};

// ═══════════════════════════════════════════════════════════════════════════
// AIRPORT DATABASE (commonly seen in FareNexus Canadian results)
// ═══════════════════════════════════════════════════════════════════════════

export interface AirportInfo {
  code: string;
  city: string;
  name: string;
  country: string;
}

/**
 * Get airport info by IATA code.
 * Falls back to a basic entry using just the code.
 */
export function getAirportInfo(code: string): AirportInfo {
  return (
    AIRPORT_DB[code.toUpperCase()] || {
      code: code.toUpperCase(),
      city: code.toUpperCase(),
      name: code.toUpperCase(),
      country: "",
    }
  );
}

/**
 * Search airports by query (code or city name).
 * Returns up to maxResults matches, sorted by relevance.
 */
export function searchAirports(query: string, maxResults: number = 8): AirportInfo[] {
  if (!query || query.length < 2) return [];
  const q = query.toUpperCase();
  const results: AirportInfo[] = [];

  for (const airport of Object.values(AIRPORT_DB)) {
    if (
      airport.code.includes(q) ||
      airport.city.toUpperCase().includes(q) ||
      airport.name.toUpperCase().includes(q)
    ) {
      results.push(airport);
    }
    if (results.length >= maxResults) break;
  }

  // Sort: exact code match first, then by city name
  return results.sort((a, b) => {
    if (a.code === q) return -1;
    if (b.code === q) return 1;
    return a.city.localeCompare(b.city);
  });
}

export const AIRPORT_DB: Record<string, AirportInfo> = {
  // ── Major Canadian ────────────────────────────────────────────────────
  YUL: { code: "YUL", city: "Montreal", name: "Pierre E. Trudeau International", country: "CA" },
  YYZ: { code: "YYZ", city: "Toronto", name: "Pearson International", country: "CA" },
  YVR: { code: "YVR", city: "Vancouver", name: "Vancouver International", country: "CA" },
  YOW: { code: "YOW", city: "Ottawa", name: "Macdonald-Cartier International", country: "CA" },
  YYC: { code: "YYC", city: "Calgary", name: "Calgary International", country: "CA" },
  YEG: { code: "YEG", city: "Edmonton", name: "Edmonton International", country: "CA" },
  YWG: { code: "YWG", city: "Winnipeg", name: "James A. Richardson International", country: "CA" },
  YHZ: { code: "YHZ", city: "Halifax", name: "Stanfield International", country: "CA" },
  YQB: { code: "YQB", city: "Quebec City", name: "Jean Lesage International", country: "CA" },
  YTZ: { code: "YTZ", city: "Toronto", name: "Billy Bishop City Airport", country: "CA" },
  YLW: { code: "YLW", city: "Kelowna", name: "Kelowna International", country: "CA" },
  YXE: { code: "YXE", city: "Saskatoon", name: "John G. Diefenbaker International", country: "CA" },
  YQR: { code: "YQR", city: "Regina", name: "Regina International", country: "CA" },
  YXU: { code: "YXU", city: "London", name: "London International", country: "CA" },
  YKF: { code: "YKF", city: "Kitchener-Waterloo", name: "Region of Waterloo International", country: "CA" },
  YQM: { code: "YQM", city: "Moncton", name: "Greater Moncton Roméo LeBlanc", country: "CA" },
  YSJ: { code: "YSJ", city: "Saint John", name: "Saint John Airport", country: "CA" },
  YFC: { code: "YFC", city: "Fredericton", name: "Fredericton International", country: "CA" },
  YYJ: { code: "YYJ", city: "Victoria", name: "Victoria International", country: "CA" },
  YXY: { code: "YXY", city: "Whitehorse", name: "Erik Nielsen International", country: "CA" },
  YZF: { code: "YZF", city: "Yellowknife", name: "Yellowknife Airport", country: "CA" },
  YQT: { code: "YQT", city: "Thunder Bay", name: "Thunder Bay International", country: "CA" },

  // ── Major US ──────────────────────────────────────────────────────────
  JFK: { code: "JFK", city: "New York", name: "John F. Kennedy International", country: "US" },
  LAX: { code: "LAX", city: "Los Angeles", name: "Los Angeles International", country: "US" },
  ORD: { code: "ORD", city: "Chicago", name: "O'Hare International", country: "US" },
  ATL: { code: "ATL", city: "Atlanta", name: "Hartsfield-Jackson International", country: "US" },
  DFW: { code: "DFW", city: "Dallas", name: "Dallas/Fort Worth International", country: "US" },
  DEN: { code: "DEN", city: "Denver", name: "Denver International", country: "US" },
  SFO: { code: "SFO", city: "San Francisco", name: "San Francisco International", country: "US" },
  SEA: { code: "SEA", city: "Seattle", name: "Seattle-Tacoma International", country: "US" },
  MIA: { code: "MIA", city: "Miami", name: "Miami International", country: "US" },
  BOS: { code: "BOS", city: "Boston", name: "Logan International", country: "US" },
  FLL: { code: "FLL", city: "Fort Lauderdale", name: "Fort Lauderdale-Hollywood International", country: "US" },
  MCO: { code: "MCO", city: "Orlando", name: "Orlando International", country: "US" },
  EWR: { code: "EWR", city: "Newark", name: "Newark Liberty International", country: "US" },
  LGA: { code: "LGA", city: "New York", name: "LaGuardia Airport", country: "US" },
  IAD: { code: "IAD", city: "Washington", name: "Dulles International", country: "US" },
  DCA: { code: "DCA", city: "Washington", name: "Reagan National", country: "US" },
  PHX: { code: "PHX", city: "Phoenix", name: "Sky Harbor International", country: "US" },
  IAH: { code: "IAH", city: "Houston", name: "George Bush Intercontinental", country: "US" },
  MSP: { code: "MSP", city: "Minneapolis", name: "Minneapolis-Saint Paul International", country: "US" },
  DTW: { code: "DTW", city: "Detroit", name: "Detroit Metropolitan", country: "US" },
  PHL: { code: "PHL", city: "Philadelphia", name: "Philadelphia International", country: "US" },
  CLT: { code: "CLT", city: "Charlotte", name: "Charlotte Douglas International", country: "US" },
  LAS: { code: "LAS", city: "Las Vegas", name: "Harry Reid International", country: "US" },
  SAN: { code: "SAN", city: "San Diego", name: "San Diego International", country: "US" },
  TPA: { code: "TPA", city: "Tampa", name: "Tampa International", country: "US" },
  PDX: { code: "PDX", city: "Portland", name: "Portland International", country: "US" },
  HNL: { code: "HNL", city: "Honolulu", name: "Daniel K. Inouye International", country: "US" },
  AUS: { code: "AUS", city: "Austin", name: "Austin-Bergstrom International", country: "US" },
  BNA: { code: "BNA", city: "Nashville", name: "Nashville International", country: "US" },
  RDU: { code: "RDU", city: "Raleigh", name: "Raleigh-Durham International", country: "US" },
  SLC: { code: "SLC", city: "Salt Lake City", name: "Salt Lake City International", country: "US" },

  // ── Major International ───────────────────────────────────────────────
  LHR: { code: "LHR", city: "London", name: "Heathrow Airport", country: "GB" },
  LGW: { code: "LGW", city: "London", name: "Gatwick Airport", country: "GB" },
  CDG: { code: "CDG", city: "Paris", name: "Charles de Gaulle Airport", country: "FR" },
  FRA: { code: "FRA", city: "Frankfurt", name: "Frankfurt Airport", country: "DE" },
  AMS: { code: "AMS", city: "Amsterdam", name: "Schiphol Airport", country: "NL" },
  MAD: { code: "MAD", city: "Madrid", name: "Adolfo Suárez Madrid–Barajas", country: "ES" },
  BCN: { code: "BCN", city: "Barcelona", name: "Josep Tarradellas Barcelona–El Prat", country: "ES" },
  FCO: { code: "FCO", city: "Rome", name: "Leonardo da Vinci–Fiumicino", country: "IT" },
  MXP: { code: "MXP", city: "Milan", name: "Malpensa Airport", country: "IT" },
  ZRH: { code: "ZRH", city: "Zurich", name: "Zurich Airport", country: "CH" },
  MUC: { code: "MUC", city: "Munich", name: "Munich Airport", country: "DE" },
  IST: { code: "IST", city: "Istanbul", name: "Istanbul Airport", country: "TR" },
  DXB: { code: "DXB", city: "Dubai", name: "Dubai International", country: "AE" },
  DOH: { code: "DOH", city: "Doha", name: "Hamad International", country: "QA" },
  SIN: { code: "SIN", city: "Singapore", name: "Changi Airport", country: "SG" },
  HKG: { code: "HKG", city: "Hong Kong", name: "Hong Kong International", country: "HK" },
  NRT: { code: "NRT", city: "Tokyo", name: "Narita International", country: "JP" },
  HND: { code: "HND", city: "Tokyo", name: "Haneda Airport", country: "JP" },
  ICN: { code: "ICN", city: "Seoul", name: "Incheon International", country: "KR" },
  SYD: { code: "SYD", city: "Sydney", name: "Kingsford Smith Airport", country: "AU" },
  MEL: { code: "MEL", city: "Melbourne", name: "Tullamarine Airport", country: "AU" },
  AKL: { code: "AKL", city: "Auckland", name: "Auckland Airport", country: "NZ" },
  CUN: { code: "CUN", city: "Cancún", name: "Cancún International", country: "MX" },
  MEX: { code: "MEX", city: "Mexico City", name: "Benito Juárez International", country: "MX" },
  GRU: { code: "GRU", city: "São Paulo", name: "Guarulhos International", country: "BR" },
  SCL: { code: "SCL", city: "Santiago", name: "Arturo Merino Benítez International", country: "CL" },
  BOG: { code: "BOG", city: "Bogotá", name: "El Dorado International", country: "CO" },
  PTY: { code: "PTY", city: "Panama City", name: "Tocumen International", country: "PA" },

  // ── Caribbean (popular from Canada) ───────────────────────────────────
  PUJ: { code: "PUJ", city: "Punta Cana", name: "Punta Cana International", country: "DO" },
  MBJ: { code: "MBJ", city: "Montego Bay", name: "Sangster International", country: "JM" },
  NAS: { code: "NAS", city: "Nassau", name: "Lynden Pindling International", country: "BS" },
  SJU: { code: "SJU", city: "San Juan", name: "Luis Muñoz Marín International", country: "PR" },
  AUA: { code: "AUA", city: "Aruba", name: "Queen Beatrix International", country: "AW" },
  VRA: { code: "VRA", city: "Varadero", name: "Juan Gualberto Gómez Airport", country: "CU" },
  HAV: { code: "HAV", city: "Havana", name: "José Martí International", country: "CU" },
};

// ═══════════════════════════════════════════════════════════════════════════
// CURRENCY FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

const CURRENCY_SYMBOLS: Record<string, string> = {
  CAD: "C$",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
  NZD: "NZ$",
  CHF: "CHF",
  MXN: "MX$",
  BRL: "R$",
};

/**
 * Format a price with the correct currency symbol.
 */
export function formatPrice(amount: number, currencyCode: string): string {
  const symbol = CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || currencyCode;
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Format a price with decimals.
 */
export function formatPriceExact(amount: number, currencyCode: string): string {
  const symbol = CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || currencyCode;
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
