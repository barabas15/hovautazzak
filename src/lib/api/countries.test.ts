import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchCountries } from './countries'

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: async () => body,
    }),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('fetchCountries', () => {
  it('maps restcountries records to the CountryRecord shape', async () => {
    mockFetchOnce([
      {
        name: { common: 'Japan' },
        cca2: 'JP',
        capital: ['Tokyo'],
        flag: '🇯🇵',
        flags: { svg: 'https://flags/jp.svg', png: 'https://flags/jp.png' },
      },
    ])

    const result = await fetchCountries()

    expect(result).toEqual([
      {
        code: 'JP',
        name: 'Japan',
        capital: 'Tokyo',
        flag: '🇯🇵',
        flagUrl: 'https://flags/jp.svg',
      },
    ])
  })

  it('drops records without a name or country code', async () => {
    mockFetchOnce([
      { name: { common: 'France' }, cca2: 'FR', capital: ['Paris'] },
      { name: {}, cca2: 'XX' }, // no name -> dropped
      { name: { common: 'NoCode' } }, // no cca2 -> dropped
    ])

    const result = await fetchCountries()

    expect(result).toHaveLength(1)
    expect(result[0].code).toBe('FR')
  })

  it('falls back to empty/png fields and sorts by name', async () => {
    mockFetchOnce([
      { name: { common: 'Zambia' }, cca2: 'ZM' },
      {
        name: { common: 'Albania' },
        cca2: 'AL',
        flags: { png: 'https://flags/al.png' },
      },
    ])

    const result = await fetchCountries()

    expect(result.map((c) => c.name)).toEqual(['Albania', 'Zambia'])
    // missing capital/flag/svg -> sensible fallbacks
    expect(result[0].flagUrl).toBe('https://flags/al.png')
    expect(result[1].capital).toBe('')
    expect(result[1].flag).toBe('')
    expect(result[1].flagUrl).toBe('')
  })

  it('throws when the upstream request fails', async () => {
    mockFetchOnce(null, false, 503)
    await expect(fetchCountries()).rejects.toThrow(/restcountries request failed: 503/)
  })
})
