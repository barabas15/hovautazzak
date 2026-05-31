# randomutazas

Véletlenszerű utazás generáló Next.js app. Budapest-ből indulva random (vagy kiválasztott) célország, repülőjegy + szállásajánlattal.

## Státusz

**Fut lokálban, aktív fejlesztés.** 41/41 teszt zöld, build ✓.  
Lokálisan fut: `npm run dev` → `http://localhost:3000`

## Tech stack

- Next.js 14 App Router + TypeScript + Tailwind CSS
- Firebase Auth (Google) + Firestore
- Kiwi Umbrella GraphQL API (`api.skypicker.com/umbrella/v2/graphql`) — repülőjegy, kulcs nélkül
- Xotelo API (`data.xotelo.com/api`) — szálláskereső, kulcs nélkül; fallback: becsült árak régiónként
- restcountries.com — országlista, kulcs nélkül
- Vercel hosting (`fra1`, `maxDuration: 15`)

## Helyi futtatás

```bash
npm run dev       # dev szerver
npm run build     # production build
npx vitest run    # tesztek
npx tsc --noEmit  # typecheck
npm run lint      # eslint
```

## Környezeti változók (`.env.local`)

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_SERVICE_ACCOUNT_KEY   # teljes service account JSON stringként
JWT_SECRET
```

Kiwi és Amadeus API kulcs **nem kell** — az app kulcs nélküli nyilvános API-kat használ.

## Projektstruktúra

```
src/
├── app/
│   ├── page.tsx                        # főoldal (HeroSection, CountryDropdown)
│   ├── trips/page.tsx                  # trip eredmény oldal
│   ├── saved/page.tsx                  # mentett utazások (védett)
│   └── api/
│       ├── trip/route.ts               # fő orchestration: random/célzott utazás
│       ├── flights/route.ts            # GET ?to=<IATA>&date=<YYYY-MM-DD>
│       ├── hotels/route.ts             # GET ?cityName=...&checkIn=...&countryCode=...
│       ├── countries/route.ts          # GET (24h cache)
│       ├── saved-trips/route.ts        # GET/POST (auth)
│       ├── saved-trips/[id]/route.ts   # DELETE (auth)
│       └── auth/session/route.ts       # POST/DELETE session cookie
├── components/
│   ├── auth/AuthProvider.tsx + ProtectedRoute.tsx
│   ├── layout/Navbar.tsx + Footer.tsx
│   ├── home/HeroSection.tsx + CountryDropdown.tsx + LoginButton.tsx
│   └── trips/TripCard.tsx + FlightInfo.tsx + HotelOption.tsx
│              + BookingLink.tsx + PriceSummary.tsx + SaveTripButton.tsx
├── hooks/useAuth.ts + useSavedTrips.ts
├── lib/
│   ├── firebase.ts + firebase-admin.ts + firestore.ts + auth.ts + session.ts
│   ├── capitalToIata.ts               # főváros név → IATA kód statikus map
│   ├── trip-helpers.ts                # dátumok, Booking.com URL builder
│   └── api/
│       ├── trip.ts                    # generateTrip() — fő logika
│       ├── flights.ts                 # searchFlight() — Kiwi Umbrella GraphQL
│       ├── hotels.ts                  # searchHotels() — Xotelo + fallback
│       └── countries.ts              # fetchCountries() — restcountries.com + HU nevek
├── types/country.ts + flight.ts + hotel.ts + trip.ts + firestore.ts
└── middleware.ts                      # /saved és /api/saved-trips/* védelem
```

## API integráció

### Repülőjegy — Kiwi Umbrella GraphQL (kulcs nélkül)
- **2 lépéses folyamat:**
  1. `places` query a főváros nevére (pl. `"Paris"`) → `legacyId`
  2. `onewayItineraries` query: BUD → legacyId, HUF valuta, 2 felnőtt
- `passengers` objektumban **csak** `{ adults, children, infants }` — a bag mezők (`adultsHoldBags` stb.) `AppError`-t okoznak, ne add hozzá
- `AppError` esetén (`onewayItineraries.__typename === 'AppError'`) hibát dob, nem `null`-t ad vissza
- Ha nem talál járatot: `flight: null` a TripResult-ban
- **`bookingUrl`** = Kiwi round-trip keresési URL: `kiwi.com/en/?origin=budapest-hungary&destination={city}-{country}&outboundDate={dep}&inboundDate={ret}&adults=2&...`
- **IATA kód vs városnév:** a `places` query és a `bookingUrl` városnévvel működik, nem IATA kóddal
- Kis repülőtereknél előfordulhat, hogy a Kiwi search "Nothing here yet"-et mutat — ez valódi hiány (nincs round-trip opció az adott útvonalon), nem URL hiba

### Szállás — Xotelo (kulcs nélkül)
- `LOCATION_KEYS` map: ~60 európai főváros → Xotelo location key (TripAdvisor geo ID)
- Valódi szállásnál `url` mező (TripAdvisor link) is visszajön → kattintható link a UI-ban
- `isEstimate: true` jelzi ha becsült ár (nem valódi Xotelo adat)
- Ha a város nincs a map-ban vagy Xotelo üres: becsült árak régiónként
  - Nyugat-Európa: 12 000 / 25 000 HUF/éj (olcsó/ajánlott)
  - Kelet-Európa: 8 000 / 15 000 HUF/éj
  - Dél-Európa: 10 000 / 20 000 HUF/éj
  - Tengerentúl: 15 000 / 35 000 HUF/éj
- Xotelo search endpoint (névből keresés) **fizetős** (RapidAPI) — nem elérhető

### Trip generálás — `generateTrip()`
- Indulási dátum: **random 30–90 napra** (nem fix 30)
- Tartózkodás: **random 4–10 éjszaka**
- Szállás ára és `nights` mező az aktuális út hosszát tükrözi
- `generateTrip(countryCode, today, leadDays, nights)` — utolsó 2 param teszteléshez injectable

### Booking.com deep link
```
https://www.booking.com/searchresults.html?ss=<city>&checkin=<YYYY-MM-DD>&checkout=<YYYY-MM-DD>&group_adults=2&lang=hu
```

### Országlista — restcountries.com
- `translations.hun.common` → magyar neveket ad vissza (pl. "Franciaország")
- Fallback: `name.common` (angol) ha nincs magyar fordítás
- Magyar ABC sorrend (`localeCompare('hu')`)

## Típusok

```ts
type Flight = {
  fromCity: string; fromIata: string
  toCity: string; toIata: string
  departureDate: string       // ISO date
  airline: string
  priceHuf: number
  bookingUrl: string          // Kiwi round-trip search URL
}

type HotelOffer = {
  name: string
  totalPriceHuf: number   // teljes ár az út hosszára
  isEstimate?: boolean    // true = regionális becslés, nem valódi ajánlat
  url?: string            // TripAdvisor hotel link (ha van)
}
```

## Firestore adatmodell

```
users/{uid}/trips/{tripId}
  createdAt: Timestamp
  country: { name, cca2, flagUrl }
  flight: { from, to, departureAt, priceHUF, airline, bookingUrl } | null
  hotels: { cheapest: { name, totalPrice }, recommended: { name, totalPrice } } | null
  totalPriceHUF: number
  nights: number
```

## Auth flow

1. Kliens: `signInWithPopup` → Firebase `idToken`
2. `POST /api/auth/session { idToken }` → szerver validálja, session cookie
3. Middleware: session cookie ellenőrzés → `/saved` és `/api/saved-trips/*` védelem
4. API route-oknál: `Authorization: Bearer <idToken>` header

## Vercel deploy tennivalók

- [ ] 6 `NEXT_PUBLIC_FIREBASE_*` env var hozzáadása (`FIREBASE_SERVICE_ACCOUNT_KEY` és `JWT_SECRET` már megvan)
- [ ] Firebase Console: Google Auth provider engedélyezve
- [ ] Firebase Console: `<project>.vercel.app` hozzáadva authorized domain-ként
- [ ] Firestore security rules: csak `request.auth.uid == uid` esetén read/write

## Agent workflow (ha folytatni kell fejlesztést)

Részletek: `.claude/PLAN.md` és `.claude/board.md`

5 szerepkör: orchestrator, figma-agent, backend-agent, frontend-agent, qa-agent  
Sorrend: TeamCreate → TaskCreate → Agent (mind egyszerre, egy üzenetben)
