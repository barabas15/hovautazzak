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

export class TripError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'TripError'
  }
}

function pickRandomWithIata(countries: CountryRecord[]): CountryRecord | null {
  const candidates = countries.filter((c) => resolveIata(c.capital))
  if (candidates.length === 0) return null
  const idx = Math.floor(Math.random() * candidates.length)
  return candidates[idx]
}

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

  // Outbound, return and hotels searched in parallel; any failure yields null.
  const [outboundRes, returnRes, hotelRes] = await Promise.allSettled([
    searchFlight(iata, checkIn, country.capital, false),
    searchFlight(iata, checkOut, country.capital, true),
    searchHotels(country.capital, checkIn, checkOut, country.code),
  ])

  const flight = outboundRes.status === 'fulfilled' ? outboundRes.value : null
  const returnFlight = returnRes.status === 'fulfilled' ? returnRes.value : null
  const hotelOffers = hotelRes.status === 'fulfilled' ? hotelRes.value : null

  const city = flight?.toCity || country.capital || country.name
  const browseUrl = buildBookingUrl(city, checkIn, checkOut)

  const hotels = hotelOffers
    ? { ...hotelOffers, browseUrl, nights: stayNights }
    : null

  const totalPriceHuf =
    (flight?.priceHuf ?? 0) +
    (returnFlight?.priceHuf ?? 0) +
    (hotels?.cheapest.totalPriceHuf ?? 0)

  return {
    country: {
      code: country.code,
      name: country.name,
      flag: country.flag || country.flagUrl,
    },
    flight,
    returnFlight,
    hotels,
    browseUrl,
    checkIn,
    checkOut,
    nights: stayNights,
    totalPriceHuf,
  } as TripResult
}
