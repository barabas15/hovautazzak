import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateTrip, TripError } from './trip'
import { fetchCountries } from './countries'
import { searchFlight } from './flights'
import { searchHotels } from './hotels'
import type { CountryRecord } from '@/types/country'
import type { TripResult } from '@/types/trip'

// generateTrip attaches runtime-only extras (browseUrl, dates, totalPriceHuf)
// beyond the TripResult contract; surface them for assertions.
type TripWithExtras = TripResult & { totalPriceHuf: number; browseUrl: string }

// Integration test: real trip composition wiring real helpers (dates, IATA
// resolution, booking-url builder), with only the external data sources mocked.
vi.mock('./countries')
vi.mock('./flights')
vi.mock('./hotels')

const COUNTRIES: CountryRecord[] = [
  { code: 'JP', name: 'Japan', capital: 'Tokyo', flag: '🇯🇵', flagUrl: 'https://f/jp.svg' },
  // Atlantis has no IATA mapping -> never pickable / 422 if forced.
  { code: 'AT', name: 'Atlantis', capital: 'Atlantis', flag: '🏳️', flagUrl: '' },
]

const FLIGHT = {
  fromCity: 'Budapest',
  fromIata: 'BUD',
  toCity: 'Tokyo',
  toIata: 'NRT',
  departureDate: '2026-06-30',
  airline: 'LH',
  priceHuf: 190000,
  bookingUrl: 'https://kiwi/abc',
}

const HOTELS = {
  cheapest: { name: 'Cheap', totalPriceHuf: 40000 },
  recommended: { name: 'Mid', totalPriceHuf: 80000 },
}

beforeEach(() => {
  vi.mocked(fetchCountries).mockResolvedValue(COUNTRIES)
  vi.mocked(searchFlight).mockResolvedValue(FLIGHT)
  vi.mocked(searchHotels).mockResolvedValue(HOTELS)
})

describe('generateTrip', () => {
  const today = new Date('2026-05-31T00:00:00Z')

  it('composes a full TripResult for a requested country', async () => {
    const trip = (await generateTrip('JP', today, 30, 3)) as TripWithExtras

    expect(trip.country).toEqual({ code: 'JP', name: 'Japan', flag: '🇯🇵' })
    expect(trip.hotels?.cheapest).toEqual(HOTELS.cheapest)
    expect(trip.hotels?.recommended).toEqual(HOTELS.recommended)
    expect(trip.hotels?.nights).toBe(3)
    // 30-day lead from 2026-05-31 -> check-in 2026-06-30, 3 nights -> 2026-07-03
    expect(trip.hotels?.browseUrl).toContain('checkin=2026-06-30')
    expect(trip.hotels?.browseUrl).toContain('checkout=2026-07-03')
    // total = flight + cheapest hotel
    expect(trip.totalPriceHuf).toBe(230000)
    // bookingUrl is a Kiwi round-trip search URL
    expect(trip.flight?.bookingUrl).toContain('/search/results/budapest-hungary/tokyo-japan/2026-06-30/2026-07-03/')
  })

  it('resolves the destination IATA from the capital and searches with it', async () => {
    await generateTrip('JP', today, 30, 3)
    expect(vi.mocked(searchFlight)).toHaveBeenCalledWith('NRT', '2026-06-30', 'Tokyo')
    expect(vi.mocked(searchHotels)).toHaveBeenCalledWith('Tokyo', '2026-06-30', '2026-07-03', 'JP')
  })

  it('still returns a trip when the flight lookup yields nothing', async () => {
    vi.mocked(searchFlight).mockResolvedValue(null)
    const trip = (await generateTrip('JP', today, 30, 3)) as TripWithExtras
    expect(trip.flight).toBeNull()
    expect(trip.hotels).not.toBeNull()
    expect(trip.totalPriceHuf).toBe(40000)
  })

  it('does not abort when a downstream search rejects (allSettled)', async () => {
    vi.mocked(searchHotels).mockRejectedValue(new Error('network error'))
    const trip = (await generateTrip('JP', today, 30, 3)) as TripWithExtras
    expect(trip.flight).not.toBeNull()
    expect(trip.hotels).toBeNull()
    expect(trip.totalPriceHuf).toBe(190000)
  })

  it('throws a 404 TripError for an unknown country code', async () => {
    await expect(generateTrip('ZZ', today, 30, 3)).rejects.toBeInstanceOf(TripError)
    await expect(generateTrip('ZZ', today, 30, 3)).rejects.toMatchObject({ status: 404 })
  })

  it('throws a 422 TripError when the capital has no airport', async () => {
    await expect(generateTrip('AT', today, 30, 3)).rejects.toMatchObject({ status: 422 })
  })
})
