// The flight shape lives in ./trip (shared API/UI contract).
export type { Flight } from './trip'
import type { Flight } from './trip'

/** Legacy alias kept for readability in the service layer. */
export type FlightOption = Flight
