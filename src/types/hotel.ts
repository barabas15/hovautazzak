// Hotel shapes live in ./trip (shared API/UI contract).
export type { HotelOffer, Hotels } from './trip'
import type { HotelOffer, Hotels } from './trip'

/** Legacy aliases kept for readability in the service layer. */
export type HotelOption = HotelOffer
export type HotelResult = Hotels
