import { describe, it, expect } from 'vitest'
import { capitalToIata, resolveIata } from './capitalToIata'

describe('capitalToIata map', () => {
  it('contains at least 100 capitals', () => {
    expect(Object.keys(capitalToIata).length).toBeGreaterThanOrEqual(100)
  })

  it('maps well-known capitals correctly', () => {
    expect(capitalToIata.Budapest).toBe('BUD')
    expect(capitalToIata.Paris).toBe('CDG')
    expect(capitalToIata.London).toBe('LHR')
    expect(capitalToIata.Tokyo).toBe('NRT')
  })

  it('uses uppercase 3-letter IATA codes', () => {
    for (const code of Object.values(capitalToIata)) {
      expect(code).toMatch(/^[A-Z]{3}$/)
    }
  })
})

describe('resolveIata', () => {
  it('returns the code for a known capital', () => {
    expect(resolveIata('Budapest')).toBe('BUD')
  })
  it('trims whitespace', () => {
    expect(resolveIata('  Paris  ')).toBe('CDG')
  })
  it('returns null for unknown / empty input', () => {
    expect(resolveIata('Atlantis')).toBeNull()
    expect(resolveIata('')).toBeNull()
    expect(resolveIata(null)).toBeNull()
    expect(resolveIata(undefined)).toBeNull()
  })
})
