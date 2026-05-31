import { NextRequest, NextResponse } from 'next/server'
import { searchHotels } from '@/lib/api/hotels'
import { addDays, DEFAULT_NIGHTS } from '@/lib/trip-helpers'

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const cityName = params.get('cityName') ?? params.get('cityCode')
  const checkIn = params.get('checkIn')
  const countryCode = params.get('countryCode') ?? undefined
  // checkOut optional — defaults to checkIn + 3 nights.
  const checkOut = params.get('checkOut') ?? (checkIn ? addDays(checkIn, DEFAULT_NIGHTS) : null)

  if (!cityName || !checkIn || !checkOut) {
    return NextResponse.json(
      { error: 'Hiányzó paraméter: cityName és checkIn kötelező.' },
      { status: 400 },
    )
  }

  try {
    const hotels = await searchHotels(cityName, checkIn, checkOut, countryCode)
    return NextResponse.json(hotels)
  } catch (err) {
    console.error('GET /api/hotels failed:', err)
    return NextResponse.json(
      { error: 'Nem sikerült szállást keresni.' },
      { status: 502 },
    )
  }
}
