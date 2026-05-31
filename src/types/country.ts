// The API/UI contract for a country lives in ./trip (shared source of truth).
export type { Country } from './trip'

/**
 * Richer server-side record used internally for IATA resolution and city
 * display. /api/countries narrows this down to the public `Country` shape.
 */
export interface CountryRecord {
  /** ISO 3166-1 alpha-2 code, e.g. "JP" */
  code: string
  /** Common country name, e.g. "Japan" */
  name: string
  /** Flag emoji, e.g. "🇯🇵" */
  flag: string
  /** SVG flag image URL (fallback when emoji unavailable) */
  flagUrl: string
  /** Capital city, e.g. "Tokyo" — used to resolve IATA + display city */
  capital: string
}
