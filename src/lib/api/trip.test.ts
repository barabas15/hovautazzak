import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateTrip, TripError } from './trip'
import { fetchCountries } from './countries'
import { searchFlight } from './flights'
import { searchHotels } from './hotels'
import type { CountryRecord } from '@/types/country'
import type { TripResult } from '@/types/trip'

type TripWithExtras = TripResult & { totalPriceHuf: number; browseUrl: string }

vi.mock('./countries')
vi.mock('./flights')
vi.mock('./hotels')

const COUNTRIES: CountryRecord[] = [
  { code: 'JP', name: 'Japan', capital: 'Tokyo', flag: '🇯🇵', flagUrl: 'https://f/jp.svg' },
  { code: 'AT', name: 'Atlantis', capital: 'Atlantis', flag: '🏳️', flagUrl: '' },
]

const OUTBOUND = {
  fromCity: 'Budapest', fromIata: 'BUD',
  toCity: 'Tokyo', toIata: 'NRT',
  departureDate: '2026-06-30', airline: 'LH',
  priceHuf: 190000, bookingUrl: 'https://kiwi/out',
}

const RETURN = {
  fromCity: 'Tokyo', fromIata: 'NRT',
  toCity: 'Budapest', toIata: 'BUD',
  departureDate: '2026-07-03', airline: 'LH',
  priceHuf: 185000, bookingUrl: 'https://kiwi/ret',
}

const HOTELS = {
  cheapest: { name: 'Cheap', totalPriceHuf: 40000 },
  recommended: { name: 'Mid', totalPriceHuf: 80000 },
}

beforeEach(() => {
  vi.mocked(fetchCountries).mockResolvedValue(COUNTRIES)
  vi.mocked(searchFlight)
    .mockResolvedValueOnce(OUTBOUND)  // outbound call
    .mockResolvedValueOnce(RETURN)    // return call
  vi.mocked(searchHotels).mockResolvedValue(HOTELS)
})

describe('generateTrip', () => {
  const today = new Date('2026-05-31T00:00:00Z')

  it('composes a full TripResult with outbound + return flights', async () => {
    const trip = (await generateTrip('JP', today, 30, 3)) as TripWithExtras

    expect(trip.country).toEqual({ code: 'JP', name: 'Japan', flag: '🇯🇵' })
    expect(trip.flight).toEqual(OUTBOUND)
    expect(trip.returnFlight).toEqual(RETURN)
    expect(trip.hotels?.cheapest).toEqual(HOTELS.cheapest)
    expect(trip.hotels?.nights).toBe(3)
    expect(trip.hotels?.browseUrl).toContain('checkin=2026-06-30')
    expect(trip.hotels?.browseUrl).toContain('checkout=2026-07-03')
    // total = outbound + return + cheapest hotel
    expect(trip.totalPriceHuf).toBe(190000 + 185000 + 40000)
  })

  it('calls searchFlight twice: outbound (isReturn=false) and return (isReturn=true)', async () => {
    await generateTrip('JP', today, 30, 3)
    expect(vi.mocked(searchFlight)).toHaveBeenCalledWith('NRT', '2026-06-30', 'Tokyo', false)
    expect(vi.mocked(searchFlight)).toHaveBeenCalledWith('NRT', '2026-07-03', 'Tokyo', true)
    expect(vi.mocked(searchHotels)).toHaveBeenCalledWith('Tokyo', '2026-06-30', '2026-07-03', 'JP')
  })

  it('still returns a trip when the outbound flight yields nothing', async () => {
    vi.mocked(searchFlight).mockReset()
    vi.mocked(searchFlight).mockResolvedValue(null)
    const trip = (await generateTrip('JP', today, 30, 3)) as TripWithExtras
    expect(trip.flight).toBeNull()
    expect(trip.returnFlight).toBeNull()
    expect(trip.hotels).not.toBeNull()
    expect(trip.totalPriceHuf).toBe(40000)
  })

  it('does not abort when a downstream search rejects (allSettled)', async () => {
    vi.mocked(searchHotels).mockRejectedValue(new Error('network error'))
    const trip = (await generateTrip('JP', today, 30, 3)) as TripWithExtras
    expect(trip.flight).toEqual(OUTBOUND)
    expect(trip.returnFlight).toEqual(RETURN)
    expect(trip.hotels).toBeNull()
    expect(trip.totalPriceHuf).toBe(190000 + 185000)
  })

  it('throws a 404 TripError for an unknown country code', async () => {
    await expect(generateTrip('ZZ', today, 30, 3)).rejects.toBeInstanceOf(TripError)
    await expect(generateTrip('ZZ', today, 30, 3)).rejects.toMatchObject({ status: 404 })
  })

  it('throws a 422 TripError when the capital has no airport', async () => {
    await expect(generateTrip('AT', today, 30, 3)).rejects.toMatchObject({ status: 422 })
  })
})
