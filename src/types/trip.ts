// Shared frontend ↔ backend contract for trip data.
// Source of truth for the API response shapes consumed by the UI.
// Backend (Task #3) should conform /api/trip, /api/countries and /api/saved-trips
// responses to these types and import from here rather than redefining.

export type Country = {
  /** ISO 3166-1 alpha-2 code, e.g. "JP" */
  code: string;
  /** Localized country name, e.g. "Japán" */
  name: string;
  /** Flag emoji ("🇯🇵") OR an image URL (https://…). UI handles both. */
  flag: string;
};

export type Flight = {
  fromCity: string; // "Budapest"
  fromIata: string; // "BUD"
  toCity: string; // "Tokió"
  toIata: string; // "NRT"
  departureDate: string; // ISO date, e.g. "2026-07-12"
  airline: string;
  priceHuf: number;
  bookingUrl: string; // Kiwi deep link
};

export type HotelOffer = {
  name: string;
  totalPriceHuf: number; // full price for `nights`
  isEstimate?: boolean;  // true when price is a regional estimate, not a real offer
  url?: string;          // TripAdvisor / hotel page URL when available
};

export type Hotels = {
  cheapest: HotelOffer;
  recommended: HotelOffer;
  browseUrl: string; // Booking.com search deep link (backend may omit; UI can build it)
  nights: number; // default 3
};

export type TripResult = {
  country: Country;
  /** null when no flight could be found for the destination. */
  flight: Flight | null;
  /** null when no hotel offers could be found. */
  hotels: Hotels | null;
};

export type SavedTrip = TripResult & {
  id: string;
  savedAt: string; // ISO timestamp
  totalPriceHuf: number; // flight + cheapest hotel
};
