import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { handleList, handleSave, handleDelete } from './saved-trips'
import { getAdminAuth } from '../firebase-admin'
import { getSavedTrips, saveTrip } from '../firestore'
import type { TripResult } from '@/types/trip'

// Integration test for the saved-trips route handlers: the auth guard plus the
// Firestore wiring, with Firebase Admin + Firestore mocked.
vi.mock('../firebase-admin')
vi.mock('../firestore')

const verifyIdToken = vi.fn()

beforeEach(() => {
  vi.mocked(getAdminAuth).mockReturnValue({ verifyIdToken } as never)
})

afterEach(() => {
  vi.clearAllMocks()
})

const SAMPLE_TRIP: TripResult = {
  country: { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  flight: null,
  hotels: null,
}

function authedRequest(init: RequestInit = {}) {
  verifyIdToken.mockResolvedValue({ uid: 'user-123' })
  return new Request('http://localhost/api/saved-trips', {
    headers: { authorization: 'Bearer valid-token', ...(init.headers ?? {}) },
    ...init,
  })
}

describe('saved-trips auth guard', () => {
  it('GET returns 401 without a token', async () => {
    const res = await handleList(new Request('http://localhost/api/saved-trips'))
    expect(res.status).toBe(401)
    expect(getSavedTrips).not.toHaveBeenCalled()
  })

  it('POST returns 401 without a token', async () => {
    const res = await handleSave(
      new Request('http://localhost/api/saved-trips', {
        method: 'POST',
        body: JSON.stringify(SAMPLE_TRIP),
      }),
    )
    expect(res.status).toBe(401)
    expect(saveTrip).not.toHaveBeenCalled()
  })

  it('returns 401 when the token is invalid', async () => {
    verifyIdToken.mockRejectedValue(new Error('bad token'))
    const req = new Request('http://localhost/api/saved-trips', {
      headers: { authorization: 'Bearer garbage' },
    })
    const res = await handleList(req)
    expect(res.status).toBe(401)
  })
})

describe('saved-trips authenticated flows', () => {
  it('GET lists the trips for the authenticated user', async () => {
    vi.mocked(getSavedTrips).mockResolvedValue([
      { ...SAMPLE_TRIP, id: 't1', savedAt: '2026-05-31T00:00:00Z', totalPriceHuf: 0 },
    ])
    const res = await handleList(authedRequest())
    expect(res.status).toBe(200)
    expect(getSavedTrips).toHaveBeenCalledWith('user-123')
    await expect(res.json()).resolves.toHaveLength(1)
  })

  it('POST saves a valid trip and returns 201 with the new id', async () => {
    vi.mocked(saveTrip).mockResolvedValue('new-id')
    const res = await handleSave(
      authedRequest({ method: 'POST', body: JSON.stringify(SAMPLE_TRIP) }),
    )
    expect(res.status).toBe(201)
    expect(saveTrip).toHaveBeenCalledWith('user-123', expect.objectContaining({
      country: expect.objectContaining({ code: 'JP' }),
    }))
    await expect(res.json()).resolves.toEqual({ id: 'new-id' })
  })

  it('POST rejects a body missing trip data with 400', async () => {
    const res = await handleSave(
      authedRequest({ method: 'POST', body: JSON.stringify({ nope: true }) }),
    )
    expect(res.status).toBe(400)
    expect(saveTrip).not.toHaveBeenCalled()
  })

  it('DELETE returns 401 without a token', async () => {
    const res = await handleDelete(
      new Request('http://localhost/api/saved-trips/t1', { method: 'DELETE' }),
      't1',
    )
    expect(res.status).toBe(401)
  })
})
