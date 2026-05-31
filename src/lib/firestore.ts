import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from './firebase-admin'
import type { TripResult, SavedTrip } from '@/types/trip'

function tripsCol(uid: string) {
  return getAdminDb().collection('users').doc(uid).collection('trips')
}

/** Total price = flight price + cheapest hotel total (both HUF). */
export function computeTotalPriceHuf(trip: TripResult): number {
  const flight = trip.flight?.priceHuf ?? 0
  const hotel = trip.hotels?.cheapest.totalPriceHuf ?? 0
  return flight + hotel
}

/** Persist a generated trip for a user. Returns the new document id. */
export async function saveTrip(uid: string, trip: TripResult): Promise<string> {
  const ref = await tripsCol(uid).add({
    country: trip.country,
    flight: trip.flight,
    hotels: trip.hotels,
    totalPriceHuf: computeTotalPriceHuf(trip),
    createdAt: FieldValue.serverTimestamp(),
  })
  return ref.id
}

/** List a user's saved trips, newest first. */
export async function getSavedTrips(uid: string): Promise<SavedTrip[]> {
  const snap = await tripsCol(uid).orderBy('createdAt', 'desc').get()
  return snap.docs.map((doc) => {
    const data = doc.data()
    const createdAt = data.createdAt as Timestamp | undefined
    return {
      id: doc.id,
      country: data.country,
      flight: data.flight ?? null,
      hotels: data.hotels ?? null,
      totalPriceHuf: data.totalPriceHuf ?? 0,
      savedAt: createdAt ? createdAt.toDate().toISOString() : new Date(0).toISOString(),
    } as SavedTrip
  })
}

/** Delete one saved trip belonging to a user. */
export async function deleteTrip(uid: string, tripId: string): Promise<void> {
  await tripsCol(uid).doc(tripId).delete()
}
