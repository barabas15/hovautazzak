import { describe, it, expect, vi, afterEach } from 'vitest'
import { searchFlight } from './flights'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function mockFetch(responses: unknown[]) {
  let i = 0
  const fn = vi.fn().mockImplementation(async () => {
    const body = responses[i++] ?? {}
    return { ok: true, json: async () => body }
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

const BASE_ITINERARY = {
  price: { amount: '189999.6' },
  sector: {
    sectorSegments: [
      {
        segment: {
          source: { station: { code: 'BUD', name: 'Budapest' }, localTime: '2026-07-12T08:00:00' },
          destination: { station: { code: 'NRT', name: 'Narita', city: { name: 'Tokyo' } }, localTime: '2026-07-12T20:00:00' },
          carrier: { code: 'LH', name: 'Lufthansa' },
        },
      },
    ],
  },
  bookingOptions: { edges: [{ node: { bookingUrl: 'https://kiwi.com/deep/abc' } }] },
}

const PLACES_RESPONSE = {
  data: {
    places: {
      edges: [
        { node: { __typename: 'Station', legacyId: 'tokyo_narita_jp', id: 'station-nrt' } },
      ],
    },
  },
}

const ITINERARIES_RESPONSE = {
  data: {
    onewayItineraries: {
      itineraries: [BASE_ITINERARY],
    },
  },
}

describe('searchFlight', () => {
  it('maps a GraphQL itinerary to the Flight shape', async () => {
    mockFetch([PLACES_RESPONSE, ITINERARIES_RESPONSE])
    const flight = await searchFlight('NRT', '2026-07-12')

    expect(flight).toEqual({
      fromCity: 'Budapest',
      fromIata: 'BUD',
      toCity: 'Tokyo',
      toIata: 'NRT',
      departureDate: '2026-07-12',
      airline: 'Lufthansa',
      priceHuf: 190000,
      bookingUrl: 'https://kiwi.com/deep/abc',
    })
  })

  it('prepends kiwi.com to relative booking URLs', async () => {
    const withRelativeUrl = {
      data: {
        onewayItineraries: {
          itineraries: [{ ...BASE_ITINERARY, bookingOptions: { edges: [{ node: { bookingUrl: '/en/search/results/BUD/NRT' } }] } }],
        },
      },
    }
    mockFetch([PLACES_RESPONSE, withRelativeUrl])
    const flight = await searchFlight('NRT', '2026-07-12')
    expect(flight?.bookingUrl).toBe('https://www.kiwi.com/en/search/results/BUD/NRT')
  })

  it('returns null when no destination is found', async () => {
    mockFetch([{ data: { places: { edges: [] } } }])
    expect(await searchFlight('ZZZ', '2026-07-12')).toBeNull()
  })

  it('returns null when no itineraries come back', async () => {
    mockFetch([PLACES_RESPONSE, { data: { onewayItineraries: { itineraries: [] } } }])
    expect(await searchFlight('NRT', '2026-07-12')).toBeNull()
  })

  it('falls back to a search URL when bookingOptions is empty', async () => {
    const noUrl = {
      data: {
        onewayItineraries: {
          itineraries: [{ ...BASE_ITINERARY, bookingOptions: { edges: [] } }],
        },
      },
    }
    mockFetch([PLACES_RESPONSE, noUrl])
    const flight = await searchFlight('NRT', '2026-07-12')
    expect(flight?.bookingUrl).toContain('kiwi.com/en/search/results/budapest/NRT')
  })
})
