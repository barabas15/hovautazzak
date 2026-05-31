import type { CountryRecord } from '@/types/country'

const ENDPOINT =
  'https://restcountries.com/v3.1/all?fields=name,cca2,capital,flags,flag,translations'

interface RestCountry {
  name?: { common?: string; translations?: { hun?: { common?: string } } }
  cca2?: string
  capital?: string[]
  flag?: string
  flags?: { svg?: string; png?: string }
  translations?: { hun?: { common?: string } }
}

/**
 * Fetch the full country list from restcountries.com and map it to
 * the internal {@link CountryRecord} shape. Cached for 24h via Next's
 * fetch revalidation. Countries without a name or cca2 are dropped.
 */
export async function fetchCountries(): Promise<CountryRecord[]> {
  const res = await fetch(ENDPOINT, { next: { revalidate: 86400 } })
  if (!res.ok) {
    throw new Error(`restcountries request failed: ${res.status}`)
  }
  const data = (await res.json()) as RestCountry[]

  return data
    .map((c): CountryRecord | null => {
      const name = c.translations?.hun?.common ?? c.name?.translations?.hun?.common ?? c.name?.common
      const code = c.cca2
      if (!name || !code) return null
      return {
        code,
        name,
        capital: c.capital?.[0] ?? '',
        flag: c.flag ?? '',
        flagUrl: c.flags?.svg ?? c.flags?.png ?? '',
      }
    })
    .filter((c): c is CountryRecord => c !== null)
    .sort((a, b) => a.name.localeCompare(b.name, 'hu'))
}
