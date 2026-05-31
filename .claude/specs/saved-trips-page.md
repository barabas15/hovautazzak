# Saved Trips Page — Mentett utazások spec

> Útvonal: `/saved` → `src/app/saved/page.tsx`. **Auth-required** oldal.
> Tokenek: [[global-tokens]].

## Hozzáférés-védelem

- Csak bejelentkezett user érheti el.
- Védelem: `middleware.ts` (backend-agent) ellenőrzi a session cookie-t és átirányít `/`-re, ha nincs auth — **vagy** kliensoldali guard: ha `useAuth()` szerint nincs user, redirect `/` + üzenet.
- A backend-agent middleware-e az elsődleges; a kliens guard másodlagos UX réteg (villanás elkerülése loading skeletonnal).

## Adat

- `GET /api/trips` → a bejelentkezett user mentett trip-jei (backend-agent). Várt elem:

```ts
type SavedTrip = {
  id: string;
  country: { name: string; flag: string };
  flight: { fromIata: string; toCity: string; toIata: string; departureDate: string };
  totalPriceHuf: number;
  savedAt: string; // ISO
};
```

## Layout

```
┌─────────────────────────────────────────────┐
│  Navbar (ugyanaz mint főoldal)                │
├─────────────────────────────────────────────┤
│  Mentett utazások              (oldalcím)     │
│                                               │
│  ┌─ TripCard ────────┐  ┌─ TripCard ────────┐ │
│  │ 🇯🇵 Japán       🗑 │  │ 🇮🇹 Olaszország 🗑│ │
│  │ BUD → Tokió (NRT) │  │ BUD → Róma (FCO)  │ │
│  │ 2026.07.12        │  │ 2026.08.03        │ │
│  │ 131 900 Ft        │  │ 98 400 Ft         │ │
│  └───────────────────┘  └───────────────────┘ │
│           ... (2 oszlop desktop)              │
└─────────────────────────────────────────────┘
```

## 1. Navbar

- Azonos a [[home-page]] Navbar-jával (`@/components/Navbar`). Itt a user mindig be van jelentkezve, tehát avatar + logout látszik.

## 2. Oldalcím

- Konténer: `max-w-6xl mx-auto px-4 sm:px-6 py-10`.
- Cím: "Mentett utazások" — `text-3xl font-bold text-text-primary mb-6`.
- Opcionális alcím / darabszám: `text-text-secondary` — pl. "{n} mentett kaland".

## 3. Grid layout

- `grid grid-cols-1 md:grid-cols-2 gap-5` (2 oszlop desktop, 1 oszlop mobil).

## 4. TripCard (`@/components/TripCard`)

- Glass card: `relative bg-bg-card border border-border-default rounded-2xl p-6 hover:shadow-xl hover:shadow-violet-900/20 transition-shadow`.
- **Fejléc sor:** `flex items-start justify-between`
  - Bal: zászló emoji + ország neve (`text-xl font-semibold text-text-primary`).
  - Jobb felső sarok: **törlés ikon** — `🗑` vagy trash SVG, `text-text-muted hover:text-red-500 transition-colors p-1`, `aria-label="Törlés"`.
- **Repülő info:** `text-sm text-text-secondary mt-2` — `{fromIata} → {toCity} ({toIata})`.
- **Dátum:** `text-sm text-text-muted` — `{departureDate}` (formázva `hu-HU`).
- **Teljes ár:** `text-lg font-bold text-text-primary mt-3` — `{totalPriceHuf} Ft` (ezres tagolás). Opcionálisan gradient szöveg a hangsúlyhoz.
- Kattintás a kártyára (a törlés ikonon kívül): opcionálisan navigálás a trip részletre.

### Törlés viselkedés
- Kattintásra: `DELETE /api/trips/{id}` (backend-agent).
- Megerősítés: kis confirm (inline "Biztosan törlöd?" vagy natív `confirm`). MVP-ben elég optimista törlés + visszavonás nélkül, de confirm ajánlott.
- Sikeres törlés után a kártya eltűnik (optimistic update vagy refetch).

## 5. Üres állapot (`@/components/EmptyState`)

- Ha nincs mentett trip:
  - Középre igazított blokk: `flex flex-col items-center justify-center text-center py-20 gap-4`.
  - Illusztráció: nagy emoji vagy egyszerű SVG (pl. ✈ / 🗺 `text-6xl opacity-60`), vagy glass kör háttérrel.
  - Szöveg: "Még nincs mentett utazásod" (`text-xl text-text-primary`) + alcím `text-text-secondary` ("Generálj egyet, és mentsd el a kedvenced!").
  - **CTA:** "Generálj egyet!" — gradient gomb (`from-violet-600 to-cyan-500 rounded-full px-8 py-3.5`), link `/`.

## 6. Loading skeleton

- Töltés alatt: a grid helyén 2–4 skeleton kártya.
- Skeleton: `bg-bg-card border border-border-default rounded-2xl p-6 animate-pulse` belül `bg-white/5 rounded` placeholder csíkok (cím, sorok, ár).
- A skeleton elkerüli az auth-villanást is, amíg `useAuth()` betölt.

## Kapcsolódó specek
- [[global-tokens]] — színek, glass, gradient
- [[home-page]] — Navbar + üres állapot CTA célja
- [[trip-result-page]] — innen mentődnek a trip-ek
