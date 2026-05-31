import { fetchCountries } from './countries'
import { searchFlight } from './flights'
import { searchHotels } from './hotels'
import { resolveIata } from '../capitalToIata'
import {
  buildBookingUrl,
  computeStayDates,
} from '../trip-helpers'
import type { CountryRecord } from '@/types/country'
import type { TripResult } from '@/types/trip'

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function toCitySlug(city: string): string {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export class TripError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'TripError'
  }
}

/** Pick a random country that has a resolvable destination airport. */
function pickRandomWithIata(countries: CountryRecord[]): CountryRecord | null {
  const candidates = countries.filter((c) => resolveIata(c.capital))
  if (candidates.length === 0) return null
  const idx = Math.floor(Math.random() * candidates.length)
  return candidates[idx]
}

/**
 * Generate a random (or country-specific) trip from Budapest.
 *
 * @param countryCode optional ISO alpha-2 code; when omitted a random
 *   country with a known airport is picked.
 * @param today injectable "now" for deterministic testing.
 */
export async function generateTrip(
  countryCode?: string,
  today: Date = new Date(),
  leadDays?: number,
  nights?: number,
): Promise<TripResult> {
  const countries = await fetchCountries()

  let country: CountryRecord | null
  if (countryCode) {
    country =
      countries.find(
        (c) => c.code.toUpperCase() === countryCode.toUpperCase(),
      ) ?? null
    if (!country) {
      throw new TripError(`Ismeretlen ország: ${countryCode}`, 404)
    }
  } else {
    country = pickRandomWithIata(countries)
  }
  if (!country) {
    throw new TripError('Nem sikerült célországot választani.', 500)
  }

  const iata = resolveIata(country.capital)
  if (!iata) {
    throw new TripError(
      `Ehhez az országhoz (${country.name}) nincs repülőtér adat.`,
      422,
    )
  }

  const { checkIn, checkOut, nights: stayNights } = computeStayDates(
    today,
    leadDays ?? randomInt(30, 90),
    nights ?? randomInt(4, 10),
  )

  // Flights + hotels in parallel; neither failure aborts the whole trip.
  const [flightRes, hotelRes] = await Promise.allSettled([
    searchFlight(iata, checkIn, country.capital),
    searchHotels(country.capital, checkIn, checkOut, country.code),
  ])

  const rawFlight =
    flightRes.status === 'fulfilled' ? flightRes.value : null
  const hotelOffers =
    hotelRes.status === 'fulfilled' ? hotelRes.value : null

  const flight = rawFlight
    ? {
        ...rawFlight,
        bookingUrl: rawFlight.toCity
          ? `https://www.kiwi.com/en/?origin=budapest-hungary&destination=${toCitySlug(rawFlight.toCity)}-${toCitySlug(country.name)}&outboundDate=${rawFlight.departureDate}&inboundDate=${checkOut}&adults=2&children=0&infants=0&returnFromDifferentAirport=false&returnToDifferentAirport=false`
          : rawFlight.bookingUrl,
      }
    : null

  const city = flight?.toCity || country.capital || country.name
  const browseUrl = buildBookingUrl(city, checkIn, checkOut)

  const hotels = hotelOffers
    ? { ...hotelOffers, browseUrl, nights: stayNights }
    : null

  const totalPriceHuf =
    (flight?.priceHuf ?? 0) + (hotels?.cheapest.totalPriceHuf ?? 0)

  return {
    country: {
      code: country.code,
      name: country.name,
      flag: country.flag || country.flagUrl,
    },
    flight,
    hotels,
    // Extra (non-contract) fields the UI may use; harmless to typed consumers.
    browseUrl,
    checkIn,
    checkOut,
    nights: stayNights,
    totalPriceHuf,
  } as TripResult
}
