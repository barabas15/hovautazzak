import { describe, it, expect, vi, afterEach } from 'vitest'
import { searchHotels } from './hotels'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

function mockFetch(body: unknown, ok = true) {
  const fn = vi.fn().mockResolvedValue({ ok, json: async () => body })
  vi.stubGlobal('fetch', fn)
  return fn
}

const XOTELO_RESPONSE = {
  result: {
    list: [
      { name: 'Budget Inn', price_ranges: { minimum: 50 }, review_summary: { rating: 3.8 } },
      { name: 'Nice Hotel', price_ranges: { minimum: 90 }, review_summary: { rating: 4.7 } },
      { name: 'Mid Place', price_ranges: { minimum: 70 }, review_summary: { rating: 4.2 } },
    ],
  },
}

describe('searchHotels', () => {
  it('returns cheapest and best-rated offer in HUF for a known city', async () => {
    mockFetch(XOTELO_RESPONSE)
    // Paris is in LOCATION_KEYS
    const result = await searchHotels('Paris', '2026-07-12', '2026-07-15')

    // sorted by price asc: Budget Inn(50), Mid Place(70), Nice Hotel(90)
    // cheapest = Budget Inn: 50 * 390 = 19500/night * 3 nights = 58500
    expect(result?.cheapest.name).toBe('Budget Inn')
    expect(result?.cheapest.totalPriceHuf).toBe(Math.round(50 * 390) * 3)
    // recommended = first with rating >= 4.5 and price > cheapest = Nice Hotel
    expect(result?.recommended.name).toBe('Nice Hotel')
  })

  it('falls back to estimated prices for an unknown city', async () => {
    // No fetch needed — unknown city skips Xotelo entirely
    const result = await searchHotels('Unknownville', '2026-07-12', '2026-07-15', 'DE')
    // DE = western europe, cheap=12000, best=25000, 3 nights
    expect(result?.cheapest.totalPriceHuf).toBe(12000 * 3)
    expect(result?.recommended.totalPriceHuf).toBe(25000 * 3)
  })

  it('falls back to estimates when Xotelo returns an empty list', async () => {
    mockFetch({ result: { list: [] } })
    const result = await searchHotels('Paris', '2026-07-12', '2026-07-15', 'FR')
    expect(result?.cheapest.name).toBe('Legolcsóbb szállás')
    expect(result?.cheapest.totalPriceHuf).toBe(12000 * 3) // FR = west
  })

  it('falls back to estimates when Xotelo request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    const result = await searchHotels('Paris', '2026-07-12', '2026-07-15', 'FR')
    expect(result?.cheapest.name).toBe('Legolcsóbb szállás')
  })

  it('uses overseas price band for non-European country', async () => {
    const result = await searchHotels('Unknownville', '2026-07-12', '2026-07-15', 'JP')
    expect(result?.cheapest.totalPriceHuf).toBe(15000 * 3)
    expect(result?.recommended.totalPriceHuf).toBe(35000 * 3)
  })

  it('computes nights from checkIn/checkOut', async () => {
    const result = await searchHotels('Unknownville', '2026-07-12', '2026-07-14', 'DE')
    // 2 nights, west cheap = 12000
    expect(result?.cheapest.totalPriceHuf).toBe(12000 * 2)
  })
})
