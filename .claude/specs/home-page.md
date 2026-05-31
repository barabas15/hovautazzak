# Home Page — Főoldal spec

> Útvonal: `/` → `src/app/page.tsx`. Dark, Hydra-stílusú landing.
> Tokenek: lásd [[global-tokens]]. Minden szín/gradient/glass onnan.

## Layout áttekintés

```
┌─────────────────────────────────────────────┐
│  Navbar (sticky, glass)                       │
├─────────────────────────────────────────────┤
│                                               │
│            [ ✈ Fedezd fel a világot ]  badge  │
│                                               │
│            Véletlenszerű                      │
│            Utazás Generátor      (gradient H1)│
│                                               │
│      Hagyd, hogy a véletlenszerűség...        │
│                                               │
│   [ Generálj utazást! ]   [ Célország → ]     │
│                                               │
│        (háttér: radial blur foltok)           │
└─────────────────────────────────────────────┘
   ▼ Célország kattintásra: CountryDropdown overlay
```

## 1. Navbar (`@/components/Navbar`)

- Sticky felül: `sticky top-0 z-50`.
- Háttér: `bg-bg-nav/80 backdrop-blur-md border-b border-white/10`.
- Konténer: `max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between`.
- **Bal:** brand. Kis ✈ ikon + szöveg "RandomUtazás" (gradient szöveg vagy `text-text-primary font-semibold`). Link `/`.
- **Jobb (auth-függő):**
  - Ha **nincs** bejelentkezve: `LoginButton` (glass gomb, "Bejelentkezés"). Kattintásra Google login (Firebase Auth — backend-agent biztosítja a `signInWithGoogle` flow-t).
  - Ha **be van** jelentkezve: user avatar (kerek, `next/image` a `photoURL`-ból, fallback monogram) + "Mentett utazások" link (`/saved`) + logout gomb (ghost, "Kilépés").
- Auth állapot: kliens oldali `useAuth()` hook / context (backend-agent szállítja). A Navbar `"use client"`.
- Mobil: a jobb oldali elemek kompaktak; avatar + hamburger nem szükséges (kevés elem), de a "Mentett utazások" szöveg helyett ikon is lehet `sm` alatt.

## 2. Hero section

- Teljes viewport: `min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center relative overflow-hidden px-4`.
- **Háttér dekoráció** (a hero `relative`-en belül, `-z-10`, `pointer-events-none`):
  - `<div class="absolute top-1/4 -left-20 w-72 h-72 bg-violet-600/30 rounded-full blur-3xl" />`
  - `<div class="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl" />`
  - Opcionális finom csillag/particle: statikus SVG noise vagy `radial-gradient` overlay. (MVP-ben elég a 2 blur folt.)

### Tartalom (felülről lefelé, `space-y-6` / `gap-6`)

1. **Badge pill** (`@/components/Badge` vagy inline):
   - `inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 text-sm text-text-secondary`
   - Tartalom: `✈ Fedezd fel a világot`

2. **H1 (gradient):**
   - `text-5xl md:text-7xl font-bold tracking-tight leading-tight`
   - `bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent`
   - Tartalom két sorban:
     ```
     Véletlenszerű
     Utazás Generátor
     ```
     (`<br />` vagy `block` span-ek; mobilon is törhet.)

3. **Alcím:**
   - `text-lg md:text-xl text-text-secondary max-w-2xl`
   - "Hagyd, hogy a véletlenszerűség vigyen el a következő kalandba"

4. **CTA gombok** (`flex flex-col sm:flex-row gap-4 mt-4`):
   - **Elsődleges — "Generálj utazást!"**
     - `bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400`
     - `text-white font-semibold rounded-full px-8 py-3.5 shadow-lg shadow-violet-600/30 transition-all`
     - Akció: véletlen célország kiválasztása → navigálás a trip eredmény oldalra (lásd [[trip-result-page]]). A generálás logikáját a frontend hívja a backend API-n (`POST /api/generate` vagy `/api/trip?country=...`), backend-agent definiálja.
   - **Másodlagos — "Célország →"**
     - Glass: `bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 text-text-primary rounded-full px-8 py-3.5 transition-colors`
     - Akció: megnyitja a `CountryDropdown` overlayt (lásd lent).

- Mobil viselkedés: gombok egymás alatt (`flex-col`), H1 `text-5xl`, alcím `text-base`.

## 3. CountryDropdown (`@/components/CountryDropdown`)

- `"use client"`, állapotot a page (vagy hero) tartja: `const [open, setOpen] = useState(false)`.
- Megjelenés: **modal/overlay** középen.
  - Backdrop: `fixed inset-0 z-50 bg-black/60 backdrop-blur-sm` — kattintásra zár.
  - Panel: középre igazítva, `w-full max-w-md bg-bg-card border border-border-default rounded-2xl p-6 shadow-2xl`.
- **Fejléc:** "Válassz célországot" (`text-text-primary font-semibold`) + zár ikon (jobb felül, `text-text-muted hover:text-text-primary`).
- **Kereshető input:**
  - `w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-purple`
  - placeholder: "Keresés ország szerint..."
  - Élő szűrés a lista felett (kliens oldali `filter` névre).
- **Lista:**
  - `max-h-72 overflow-y-auto mt-4 space-y-1`
  - Minden sor: `flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer`
  - Tartalom: zászló emoji (vagy flag ikon) + ország neve (`text-text-primary`).
  - Kattintásra: kiválasztás → navigálás a trip eredmény oldalra az adott országgal, overlay zár.
- Országlista forrása: statikus lista (frontend `@/lib/countries.ts`) vagy backend végpont. A lead/backend-agent dönti el; MVP-hez elég egy statikus `{ code, name, flag }[]`.
- Accessibility: `role="dialog"`, `aria-modal`, Esc zár, fókusz az inputra nyitáskor.

## 4. Auth & navigáció megjegyzések

- A főoldal **nem** auth-required (publikus).
- "Generálj utazást!" és a célország kiválasztás auth nélkül is működik — a mentés funkció lesz csak auth mögött (lásd [[trip-result-page]]).
- Navigáció trip eredményre: ajánlott query param vagy útvonal, pl. `/trip?country=JP` vagy `/trip/[code]`. A pontos útvonalat a frontend-agent és backend-agent egyezteti; ez a spec a `/trip` query-param formát feltételezi.

## Kapcsolódó specek
- [[global-tokens]] — színek, gradient, glass
- [[trip-result-page]] — ide navigálunk generálás után
- [[saved-trips-page]] — navbar "Mentett utazások" link célja
