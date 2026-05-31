import { NextRequest, NextResponse } from 'next/server'
import { searchFlight } from '@/lib/api/flights'

export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get('to')
  const date = req.nextUrl.searchParams.get('date')

  if (!to || !date) {
    return NextResponse.json(
      { error: 'Hiányzó paraméter: to és date kötelező.' },
      { status: 400 },
    )
  }

  try {
    const flight = await searchFlight(to, date)
    return NextResponse.json(flight)
  } catch (err) {
    console.error('GET /api/flights failed:', err)
    return NextResponse.json(
      { error: 'Nem sikerült repülőjáratot keresni.' },
      { status: 502 },
    )
  }
}
