import { describe, it, expect } from 'vitest'
import {
  addDays,
  formatISODate,
  computeStayDates,
  buildBookingUrl,
  DEFAULT_LEAD_DAYS,
  DEFAULT_NIGHTS,
} from './trip-helpers'

describe('formatISODate', () => {
  it('formats a Date as YYYY-MM-DD', () => {
    expect(formatISODate(new Date('2026-07-12T10:30:00Z'))).toBe('2026-07-12')
  })
})

describe('addDays', () => {
  it('adds days across month boundaries', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02')
  })
  it('handles leap years', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
  })
})

describe('computeStayDates', () => {
  it('defaults to 30 days lead and 3 nights', () => {
    const { checkIn, checkOut } = computeStayDates(new Date('2026-05-31T00:00:00Z'))
    expect(checkIn).toBe('2026-06-30')
    expect(checkOut).toBe('2026-07-03')
  })
  it('respects custom lead/nights', () => {
    const { checkIn, checkOut } = computeStayDates(
      new Date('2026-01-01T00:00:00Z'),
      10,
      5,
    )
    expect(checkIn).toBe('2026-01-11')
    expect(checkOut).toBe('2026-01-16')
  })
  it('exposes sane defaults', () => {
    expect(DEFAULT_LEAD_DAYS).toBe(30)
    expect(DEFAULT_NIGHTS).toBe(3)
  })
})

describe('buildBookingUrl', () => {
  it('builds a Booking.com search link with encoded city and dates', () => {
    const url = buildBookingUrl('São Paulo', '2026-07-12', '2026-07-15')
    expect(url).toContain('https://www.booking.com/searchresults.html?')
    expect(url).toContain('ss=S%C3%A3o+Paulo')
    expect(url).toContain('checkin=2026-07-12')
    expect(url).toContain('checkout=2026-07-15')
    expect(url).toContain('group_adults=2')
    expect(url).toContain('lang=hu')
  })
})
