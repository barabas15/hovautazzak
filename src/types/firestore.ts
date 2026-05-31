import type { Timestamp } from 'firebase-admin/firestore'
import type { TripResult } from './trip'

/**
 * Firestore document shape stored under `users/{uid}/trips/{tripId}`.
 * The document id is the Firestore key (not stored in the doc body).
 * `createdAt` is a server Timestamp; it is serialized to an ISO `savedAt`
 * string before being returned to the client as a `SavedTrip` (see ./trip).
 */
export interface SavedTripDoc {
  country: TripResult['country']
  flight: TripResult['flight']
  hotels: TripResult['hotels']
  /** flight.priceHuf + hotels.cheapest.totalPriceHuf */
  totalPriceHuf: number
  createdAt: Timestamp
}

/** Re-export the client-facing saved-trip contract. */
export type { SavedTrip } from './trip'
