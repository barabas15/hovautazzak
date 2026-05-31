import { NextResponse } from 'next/server'
import { fetchCountries } from '@/lib/api/countries'
import type { Country } from '@/types/trip'

// Cache for 24h — the country list rarely changes.
export const revalidate = 86400

export async function GET() {
  try {
    const records = await fetchCountries()
    const countries: Country[] = records.map((c) => ({
      code: c.code,
      name: c.name,
      flag: c.flag || c.flagUrl,
    }))
    return NextResponse.json(countries)
  } catch (err) {
    console.error('GET /api/countries failed:', err)
    return NextResponse.json(
      { error: 'Nem sikerült lekérni az országlistát.' },
      { status: 502 },
    )
  }
}
