/** Default lead time (days from today) before the trip starts. */
export const DEFAULT_LEAD_DAYS = 30
/** Default trip length in nights. */
export const DEFAULT_NIGHTS = 3

/** Format a Date as an ISO calendar date (YYYY-MM-DD), UTC-based. */
export function formatISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Return a new ISO date string `days` after the given ISO date. */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return formatISODate(d)
}

/**
 * Compute check-in / check-out for a trip starting `leadDays` from `today`
 * and lasting `nights` nights.
 */
export function computeStayDates(
  today: Date,
  leadDays: number = DEFAULT_LEAD_DAYS,
  nights: number = DEFAULT_NIGHTS,
): { checkIn: string; checkOut: string; nights: number } {
  const checkIn = addDays(formatISODate(today), leadDays)
  const checkOut = addDays(checkIn, nights)
  return { checkIn, checkOut, nights }
}

/**
 * Build a Booking.com search deep link for a destination city + date range.
 * `group_adults=2`, Hungarian locale.
 */
export function buildBookingUrl(
  city: string,
  checkIn: string,
  checkOut: string,
): string {
  const params = new URLSearchParams({
    ss: city,
    checkin: checkIn,
    checkout: checkOut,
    group_adults: '2',
    lang: 'hu',
  })
  return `https://www.booking.com/searchresults.html?${params.toString()}`
}
