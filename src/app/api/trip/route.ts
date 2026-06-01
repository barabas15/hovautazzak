import { NextRequest, NextResponse } from 'next/server'
import { generateTrip, TripError } from '@/lib/api/trip'

export const maxDuration = 15

export const dynamic = 'force-dynamic'

async function handle(countryCode?: string) {
  try {
    const trip = await generateTrip(countryCode)
    return NextResponse.json(trip)
  } catch (err) {
    if (err instanceof TripError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('/api/trip failed:', err)
    return NextResponse.json(
      { error: 'Nem sikerült utazást generálni. Próbáld újra.' },
      { status: 500 },
    )
  }
}

/** GET /api/trip?country=XX (or ?countryCode=XX) — convenience for the UI. */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const code = params.get('country') ?? params.get('countryCode') ?? undefined
  return handle(code || undefined)
}

/** POST /api/trip — body: { countryCode?: string }. */
export async function POST(req: NextRequest) {
  let countryCode: string | undefined
  try {
    const body = await req.json()
    countryCode = body?.countryCode ?? body?.country ?? undefined
  } catch {
    // Empty / invalid body → random trip.
    countryCode = undefined
  }
  return handle(countryCode)
}
