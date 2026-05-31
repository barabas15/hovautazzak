# Team Board — .claude/board.md

Ide írnak az agentok státuszt, blocker-eket és handoff üzeneteket.

## Formátum
```
[agent-név] [STÁTUSZ] | [leírás]
```

## Státuszok
- `STARTED` — elkezdte a feladatot
- `BLOCKED` — valami megakadályozza, segítség kell
- `DONE` — kész, következő agent jöhet
- `PASS` — QA tesztek átmentek
- `FAIL` — QA hibát talált

---

## Log

<!-- Az agentok ide írják a bejegyzéseket -->
[backend-agent] DONE | Bootstrap kész — figma-agent és backend folytathat
[figma-agent] DONE | Spec kész: global-tokens, home-page, trip-result-page, saved-trips-page — frontend-agent és backend-agent folytathat
[frontend-agent] STARTED | Task #4 claim-elve. Megosztott API-szerződés: src/types/trip.ts (TripResult, Country, SavedTrip). Komponensek + oldalak építése indul. Backend-agent: /api/trip, /api/countries, /api/saved-trips ehhez igazítva + @/lib/firebase exportáljon `auth`-ot.
[frontend-agent] DONE | Összes komponens kész — qa-agent review-olhat. tailwind+globals tokenek, AuthProvider/useAuth, layout+Navbar+Footer, HeroSection+CountryDropdown+LoginButton, /trips+TripCard(FlightInfo/HotelOption/BookingLink/PriceSummary/SaveTripButton), ProtectedRoute+useSavedTrips+/saved. `tsc --noEmit` ✓, `next lint` ✓, `next build` ✓ (8/8 oldal). MEGJEGYZÉS: létrehoztam `.env.local`-t dummy NEXT_PUBLIC_FIREBASE_* placeholder értékekkel (gitignore-olt) hogy a build ne dobjon auth/invalid-api-key-t prerender közben — éles kulcsok Vercelen. + next.config.mjs-be images.remotePatterns (avatar/flag).
[backend-agent] DONE | Backend kész — src/types/trip.ts szerződéshez igazítva. Route-ok: GET/POST /api/trip, GET /api/countries|flights|hotels, GET/POST /api/saved-trips (+/api/trips alias), DELETE /api/saved-trips/[id] (+/api/trips/[id]), POST/DELETE /api/auth/session, middleware.ts. `tsc` ✓, `next lint` ✓, `next build` ✓ (10 route + middleware), 13 unit teszt ✓. Smoke: 401 guard ✓, /saved→/ redirect ✓, /api/trip 200 (flight/hotel null kulcsok nélkül, graceful). qa-agent mehet. FONTOS frontendnek: saved-trips hívásokhoz `Authorization: Bearer <idToken>` + login után `POST /api/auth/session {idToken}`, logout-kor `DELETE` — különben a middleware a /saved-ot /-re irányítja.

[qa-agent] PASS | Build clean, tesztek zöldek ✅ — deploy ready
- `npm run build` → ✓ compiled & 10 route + middleware generálva
- `npx tsc --noEmit` → 0 hiba
- `npm run lint` → ✓ No ESLint warnings or errors
- `npx vitest run` → 7 fájl / 41 teszt zöld (~1.7s)
  - unit: countries / flights / hotels API mapping + meglévő trip-helpers & capitalToIata
  - integration: trip.ts TripResult kompozíció (mockolt service-ek, allSettled fallback,
    404/422 TripError); saved-trips auth guard → 401 token nélkül (GET/POST/DELETE) +
    authentikált list/save flow-k
- `npm test` script hozzáadva (`vitest run`)
- Megjegyzés: a tesztek a projekt meglévő konvenciója szerint co-located `*.test.ts`
  fájlok `src/` alatt (a vitest.config include glob ezt fedi), nem `__tests__/`.
