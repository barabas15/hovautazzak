# Global Design Tokens — Hydra dark/modern stílus

> Forrás: Figma "Hydra Landing Page (Community)". Dark, modern, glassmorphism + lila/cyan gradient hangulat.
> Cél: minden komponens ezekre a tokenekre épüljön. Hardcode-olt hex érték a komponensekben kerülendő — a Tailwind kiterjesztett színeit és a CSS változókat használjuk.

## 1. Színpaletta

| Token | Hex | Használat |
|---|---|---|
| `bg-primary` | `#0a0a0f` | Oldal fő háttér (body) |
| `bg-card` | `#13131a` | Kártya / panel háttér |
| `bg-nav` | `#1a1a2e` | Navbar háttér (áttetszően: `bg-nav/80`) |
| `accent-purple` | `#7c3aed` | Primary CTA, fókusz, aktív állapot |
| `accent-cyan` | `#06b6d4` | Secondary accent, link hover, gradient vég |
| `text-primary` | `#f9fafb` | Címsorok, fő szöveg |
| `text-secondary` | `#9ca3af` | Alcím, leírás |
| `text-muted` | `#6b7280` | Placeholder, segédszöveg, disabled |
| `border-default` | `#1f2937` | Kártya / input border |

## 2. Tipográfia

- **Font család:** Geist Sans (a bootstrap `src/app/fonts/GeistVF.woff` lokálisan tartalmazza; a `layout.tsx`-ben `next/font/local` vagy a meglévő setup szerint). Fallback: Inter, system-ui, sans-serif.
- Monospace (kódszerű/IATA): Geist Mono (`GeistMonoVF.woff`).
- Skála (Tailwind default):
  - H1 hero: `text-5xl md:text-7xl font-bold` (`leading-tight`)
  - H2 szekció: `text-2xl md:text-3xl font-semibold`
  - Body: `text-base` / `text-lg`
  - Small / badge: `text-sm` / `text-xs`
- Letter spacing nagy címeknél: `tracking-tight`.

## 3. Border radius

| Token | Érték | Tailwind |
|---|---|---|
| sm | 4px | `rounded` (alapból 0.25rem) → használd: `rounded-sm`=2px helyett `rounded` |
| md | 8px | `rounded-lg` |
| lg | 16px | `rounded-2xl` |
| xl | 24px | `rounded-3xl` |

> Megjegyzés: CTA gombok és kártyák alapból `rounded-2xl` (16px) vagy gomboknál `rounded-full` (pill). A `borderRadius` Tailwind extension-ben definiált alias-okat is használhatunk (lásd config), de a fenti standard osztályok elsődlegesek.

## 4. Spacing

- Tailwind default 4px-es bázis (`1` = 0.25rem = 4px). Nincs override.
- Szekció vertikális padding: `py-16 md:py-24`.
- Konténer: `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`.
- Kártya belső padding: `p-6` (mobil) → `p-8` (desktop).

## 5. Gradient

- **CTA / primary gomb háttér:** `bg-gradient-to-r from-violet-600 to-cyan-500`
  - hover: `hover:from-violet-500 hover:to-cyan-400`
- **Gradient szöveg (címsorok):** `bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent`
- **Háttér blur foltok (hero):** abszolút pozicionált `div`-ek `bg-violet-600/30` és `bg-cyan-500/20` + `blur-3xl rounded-full`, `pointer-events-none`.

## 6. Glass effekt (glassmorphism)

Újrahasznosítható osztály-kombináció (érdemes egy `glass` utility-be vagy `clsx` helperbe tenni):

```
bg-white/5 backdrop-blur-sm border border-white/10
```

Variánsok:
- Erősebb kártya: `bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl`
- Glass gomb hover: `hover:bg-white/10 transition-colors`
- Navbar: `bg-bg-nav/80 backdrop-blur-md border-b border-white/10`

## 7. Árnyékok

- CTA gomb: `shadow-lg shadow-violet-600/30`
- Kártya emelés hover: `hover:shadow-xl hover:shadow-violet-900/20 transition-shadow`

## 8. Tailwind config extension

`tailwind.config.ts` → `theme.extend` egészítendő ki (a bootstrap jelenleg csak `background`/`foreground` CSS-var színeket tartalmaz — ezeket megtarthatjuk, de hozzáadjuk a Hydra tokeneket):

```ts
theme: {
  extend: {
    colors: {
      // meglévő CSS-var alapúak megtarthatók
      background: "var(--background)",
      foreground: "var(--foreground)",
      // Hydra tokenek
      "bg-primary": "#0a0a0f",
      "bg-card": "#13131a",
      "bg-nav": "#1a1a2e",
      "accent-purple": "#7c3aed",
      "accent-cyan": "#06b6d4",
      "text-primary": "#f9fafb",
      "text-secondary": "#9ca3af",
      "text-muted": "#6b7280",
      "border-default": "#1f2937",
    },
    borderRadius: {
      sm: "4px",
      md: "8px",
      lg: "16px",
      xl: "24px",
    },
  },
},
```

> A `text-text-primary`, `bg-bg-card` stb. osztálynevek így működnek (Tailwind a token-kulcsból generál). Pl. cím: `text-text-primary`, kártya: `bg-bg-card border border-border-default`.

## 9. globals.css

A `src/app/globals.css`-ben állítsuk be a sötét alapot (a default `:root`/`prefers-color-scheme` blokk felülírandó dark-only értékekre):

```css
:root {
  --background: #0a0a0f;
  --foreground: #f9fafb;
}

body {
  background-color: #0a0a0f;
  color: #f9fafb;
  font-family: var(--font-geist-sans), Inter, system-ui, sans-serif;
}

/* finom scrollbar dark témához (opcionális) */
* { scrollbar-color: #1f2937 #0a0a0f; }
```

> Töröljük a create-next-app default világos témás `@media (prefers-color-scheme: light)` blokkját — az app dark-only.

## 10. Újrahasznosítható UI building block-ok (ajánlás frontend-agentnek)

- `<Button variant="gradient" | "glass" | "ghost">` — egységes CTA-k.
- `<Card>` — glass kártya wrapper (`bg-bg-card`/glass + `rounded-2xl` + `border-border-default`).
- `<Badge>` — glass pill (`bg-white/5 border border-white/10 rounded-full text-sm px-3 py-1`).
- `cn()` helper (`clsx` + `tailwind-merge`, mindkettő telepítve) a `@/lib/utils`-ban.

## Kapcsolódó specek
- [[home-page]] — főoldal / hero
- [[trip-result-page]] — trip eredmény
- [[saved-trips-page]] — mentett utazások
