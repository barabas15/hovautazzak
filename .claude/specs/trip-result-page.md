# Trip Result Page — Utazás eredmény spec

> Útvonal: `/trip` (query param `?country=XX`) → `src/app/trip/page.tsx`, vagy `/trip/[code]`.
> A pontos útvonal-forma a [[home-page]]-ben rögzített `/trip?country=XX` feltételezést követi.
> Tokenek: [[global-tokens]].

## Adatmodell (amit a backend ad / a page vár)

A page szerver- vagy kliensoldalon lekér egy trip objektumot a backend API-tól (`GET /api/trip?country=XX`, backend-agent definiálja). Várt forma (illusztratív):

```ts
type TripResult = {
  country: { code: string; name: string; flag: string };
  flight: {
    fromCity: string;     // "Budapest"
    fromIata: string;     // "BUD"
    toCity: string;       // pl. "Tokió"
    toIata: string;       // pl. "NRT"
    departureDate: string;// ISO dátum
    airline: string;
    priceHuf: number;
    bookingUrl: string;   // Kiwi deep link
  };
  hotels: {
    cheapest: { name: string; totalPriceHuf: number };
    recommended: { name: string; totalPriceHuf: number };
    browseUrl: string;    // Booking.com link
    nights: number;       // 3
  };
};
```

> Ha a backend más mezőneveket ad, ez a spec a layout/UX-re mérvadó; a mezőnevek a backend-agent API szerződéséhez igazítandók.

## Layout (felülről lefelé)

```
┌─────────────────────────────────────────┐
│  ← Vissza        🇯🇵 Japán                 │  Header
├─────────────────────────────────────────┤
│  ┌─ FlightInfo (glass card) ───────────┐ │
│  │ Budapest (BUD) → Tokió (NRT)         │ │
│  │ Indulás: 2026.07.12 · Wizz Air       │ │
│  │ 89 900 Ft   (nagy, bold)             │ │
│  │ Jegy foglalása →                     │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Szállás                                   │
│  ┌── 💰 Legolcsóbb ──┐ ┌── ⭐ Ajánlott ──┐ │
│  │ Hotel X           │ │ Hotel Y          │ │
│  │ 42 000 Ft         │ │ 78 000 Ft        │ │
│  └───────────────────┘ └──────────────────┘ │
│  [ Szállások böngészése → ]  (teljes szél.) │
│                                            │
│  ┌─ Ár összesítő ──────────────────────┐  │
│  │ Repülő:          89 900 Ft           │  │
│  │ Szállás (3 éj):  42 000 Ft           │  │
│  │ Összesen:       131 900 Ft (gradient)│  │
│  └──────────────────────────────────────┘  │
│                                            │
│  [ 💾 Utazás mentése ]   (auth esetén)      │
│  vagy: "Jelentkezz be a mentéshez" link    │
└─────────────────────────────────────────┘
```

Konténer: `max-w-2xl mx-auto px-4 py-10 space-y-6`.

## 1. Header

- `flex items-center justify-between mb-2`.
- **Vissza gomb:** `← Vissza` — ghost stílus (`text-text-secondary hover:text-text-primary inline-flex items-center gap-1`). Akció: `router.back()` vagy link `/`.
- **Ország:** zászló emoji + név (`text-2xl font-semibold text-text-primary`), jobbra igazítva vagy középen.

## 2. FlightInfo kártya (`@/components/FlightInfo`)

- Glass card: `bg-bg-card border border-border-default rounded-2xl p-6 md:p-8 space-y-3`.
- **Útvonal sor:** `text-lg md:text-xl font-medium text-text-primary`
  - `Budapest (BUD) → {toCity} ({toIata})`
  - A `→` nyíl és az IATA kódok `text-accent-cyan` kiemeléssel.
- **Meta sor:** `text-sm text-text-secondary` — `Indulás: {dátum} · {airline}`.
- **Ár:** `text-3xl md:text-4xl font-bold text-text-primary` — `{priceHuf} Ft` (ezres tagolással, `Intl.NumberFormat('hu-HU')`).
- **Jegy foglalása →** link:
  - `inline-flex items-center gap-1 text-accent-purple hover:text-accent-cyan font-medium transition-colors`
  - `href={bookingUrl}` (Kiwi deep link), `target="_blank" rel="noopener noreferrer"`.

## 3. Hotel szekció (`@/components/HotelSection`)

- Szekciócím: "Szállás" (`text-xl font-semibold text-text-primary mb-3`).
- **2 kártya** — `grid grid-cols-1 md:grid-cols-2 gap-4` (mobilon egymás alatt).
  - Mindkettő: `bg-bg-card border border-border-default rounded-2xl p-5 space-y-2`.
  - **Legolcsóbb kártya:**
    - Badge: `💰 Legolcsóbb` — `bg-white/5 border border-white/10 rounded-full text-xs px-2.5 py-1 text-text-secondary inline-flex`.
    - Hotel neve: `text-text-primary font-medium`.
    - Ár: `text-lg font-semibold text-text-primary` — `{totalPriceHuf} Ft` (teljes ár 3 éjre).
  - **Ajánlott kártya:**
    - Badge: `⭐ Ajánlott` — kiemeltebb: `bg-accent-purple/15 border border-accent-purple/30 text-accent-purple`.
    - ugyanaz a tartalom-struktúra.
- **Alattuk — "Szállások böngészése →" gomb:**
  - Teljes szélességű, glass stílus: `w-full bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 rounded-xl py-3 text-center text-text-primary transition-colors mt-4 inline-flex items-center justify-center gap-1`.
  - `href={hotels.browseUrl}` (Booking.com), `target="_blank" rel="noopener noreferrer"`.

## 4. Ár összesítő kártya (`@/components/PriceSummary`)

- Glass card: `bg-bg-card border border-border-default rounded-2xl p-6 space-y-2`.
- Sorok (`flex justify-between text-text-secondary`):
  - `Repülő` … `{flight.priceHuf} Ft`
  - `Szállás (3 éj, legolcsóbb)` … `{hotels.cheapest.totalPriceHuf} Ft`
  - Elválasztó: `border-t border-border-default my-2`.
  - **Összesen sor:** `flex justify-between items-baseline`
    - Label: `text-text-primary font-semibold` — "Összesen"
    - Érték: `text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent` — `{total} Ft`.
  - Total = `flight.priceHuf + hotels.cheapest.totalPriceHuf`.

## 5. Mentés / auth

- **Auth esetén — "💾 Utazás mentése" gomb:**
  - Solid gradient: `w-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold rounded-full py-3.5 shadow-lg shadow-violet-600/30 transition-all`.
  - Akció: `POST /api/trips` (backend-agent), a TripResult mentése a bejelentkezett userhez. Siker után visszajelzés (toast / disabled "Mentve ✓" állapot).
- **Auth nélkül:** a gomb helyén subtle link:
  - "Jelentkezz be a mentéshez" — `text-sm text-text-muted hover:text-text-secondary underline-offset-2 hover:underline`. Kattintásra a Navbar login flow-t indítja (vagy login oldal).
- Auth állapot: `useAuth()` hook (backend-agent). A mentés gombot tartalmazó rész `"use client"`.

## 6. Állapotok

- **Loading:** skeleton — szürke `animate-pulse` blokkok a kártyák helyén (`bg-white/5 rounded-2xl`).
- **Hiba / nincs adat:** "Nem sikerült utazást generálni. Próbáld újra." + "Vissza a főoldalra" CTA.

## Kapcsolódó specek
- [[global-tokens]] — színek, gradient, glass
- [[home-page]] — innen érkezünk (generálás / célország)
- [[saved-trips-page]] — ide kerülnek a mentett trip-ek
