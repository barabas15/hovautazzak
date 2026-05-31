import { NextResponse } from 'next/server'
import { getUidFromRequest } from '../auth'
import { saveTrip, getSavedTrips, deleteTrip } from '../firestore'
import type { TripResult } from '@/types/trip'

const unauthorized = () =>
  NextResponse.json({ error: 'Bejelentkezés szükséges.' }, { status: 401 })

/** GET — list the authenticated user's saved trips. */
export async function handleList(req: Request) {
  const uid = await getUidFromRequest(req)
  if (!uid) return unauthorized()
  try {
    const trips = await getSavedTrips(uid)
    return NextResponse.json(trips)
  } catch (err) {
    console.error('list saved trips failed:', err)
    return NextResponse.json(
      { error: 'Nem sikerült lekérni a mentett utazásokat.' },
      { status: 500 },
    )
  }
}

/** POST — persist a trip (TripResult in the body) for the user. */
export async function handleSave(req: Request) {
  const uid = await getUidFromRequest(req)
  if (!uid) return unauthorized()

  let trip: TripResult
  try {
    trip = (await req.json()) as TripResult
  } catch {
    return NextResponse.json({ error: 'Érvénytelen kérés.' }, { status: 400 })
  }
  if (!trip?.country?.code) {
    return NextResponse.json(
      { error: 'Hiányzó utazás-adat.' },
      { status: 400 },
    )
  }

  try {
    const id = await saveTrip(uid, trip)
    return NextResponse.json({ id }, { status: 201 })
  } catch (err) {
    console.error('save trip failed:', err)
    return NextResponse.json(
      { error: 'Nem sikerült menteni az utazást.' },
      { status: 500 },
    )
  }
}

/** DELETE — remove one saved trip belonging to the user. */
export async function handleDelete(req: Request, id: string) {
  const uid = await getUidFromRequest(req)
  if (!uid) return unauthorized()
  if (!id) {
    return NextResponse.json({ error: 'Hiányzó azonosító.' }, { status: 400 })
  }
  try {
    await deleteTrip(uid, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('delete trip failed:', err)
    return NextResponse.json(
      { error: 'Nem sikerült törölni az utazást.' },
      { status: 500 },
    )
  }
}
