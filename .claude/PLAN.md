# randomutazas — Projekt terv

## Státusz: Lokálban fut — aktív fejlesztés

41/41 teszt zöld, build ✓. Következő lépés: Vercel deploy.

---

## Multi-agent team indítása (helyes sorrend!)

**FONTOS: így kell legközelebb elindítani a teamet, hogy tmux split pane-ekben jelenjenek meg az agenteket:**

### 1. TeamCreate
```
TeamCreate(team_name="randomutazas", description="...", agent_type="orchestrator")
```

### 2. TaskCreate (függőségekkel)
```
TaskCreate: #1 bootstrap, #2 figma-agent, #3 backend-agent, #4 frontend-agent, #5 qa-agent
TaskUpdate: #2 blockedBy #1, #3 blockedBy #1+#2, #4 blockedBy #1+#2, #5 blockedBy #3+#4
```

### 3. Agent tool — MIND A 4 AGENTET EGYSZERRE SPAWNOLNI (egy üzenetben!)
```
Agent(team_name="randomutazas", name="backend-agent", prompt="...")
Agent(team_name="randomutazas", name="figma-agent", prompt="...")
Agent(team_name="randomutazas", name="frontend-agent", prompt="...")
Agent(team_name="randomutazas", name="qa-agent", prompt="...")
```

**Miért fontos:** A split tmux pane-ek CSAK az `Agent(team_name=...)` hívásoknál jönnek létre. TeamCreate + TaskCreate önmagában nem indít el split pane-eket. Az összes agentet egyszerre kell spawnolni — a blocked taskokkal rendelkezők automatikusan várnak.

### 4. Orchestrator szerepe
- Board.md olvasása rendszeresen
- `TaskUpdate(status="completed")` ha egy agent kész (néha nem jelölik maguktól)
- `SendMessage` handoff-okhoz
- Idle agenteket `{"type": "shutdown_request"}` üzenettel leállítani ha végeztek

---

## Tech stack

- **Next.js 14** App Router + TypeScript + Tailwind CSS
- **Firebase** Auth (Google) kliens + Admin SDK szerver
- **Firestore** — mentett utazások (`users/{uid}/trips/{tripId}`)
- **Kiwi Umbrella GraphQL API** — repülőjegy (BUD → cél, HUF, oda-vissza link) — kulcs nélkül
- **Xotelo API** — szálláskereső (kulcs nélkül, TripAdvisor link + fallback becsült árak)
- **restcountries.com** — országlista magyar nevekkel (`translations.hun.common`)
- **Vercel** — hosting (`fra1`, `maxDuration: 15`)

---

## Agent csapat (5 szerepkör)

| Agent | Szerepkör |
|---|---|
| **orchestrator** | board.md figyelés, handoff koordináció |
| **figma-agent** | Figma → `.claude/specs/` |
| **backend-agent** | Firebase, API route-ok, middleware |
| **frontend-agent** | Next.js komponensek, Tailwind |
| **qa-agent** | build/lint/tsc/tesztek |

---

## Végrehajtási sorrend

```
bootstrap (backend-agent)
    ↓
figma-agent (specs írás)
    ↓         ↓
backend     frontend  (párhuzamosan)
    ↓         ↓
      qa-agent
```

---

## Fő funkciók

- Főoldal: "Generálj utazást!" + "Célország" legördülő (magyar nevekkel) + Google login
- Trip flow: random/kiválasztott ország → BUD repülő → szállás → ár összesítő
  - Indulás: random 30–90 nap múlva, tartózkodás: random 4–10 éjszaka
  - Repülő: oda-vissza Kiwi keresési link, visszaút dátuma megjelenítve
  - Szállás: valódi TripAdvisor link ha elérhető, becslésnél `isEstimate` jelzés
- Bejelentkezés után: utazás mentése Firestore-ba, `/saved` oldal

## Ismert gotchák

- **Kiwi passengers**: csak `{ adults, children, infants }` — `adultsHoldBags` stb. `AppError`-t okoz
- **Kiwi places keresés**: városnévvel kell (`"Paris"`), nem IATA kóddal (`"CDG"`)
- **Xotelo search** (névből): fizetős RapidAPI endpoint — ne próbáld kulcs nélkül
- **`generateTrip` tesztelhetőség**: `leadDays` és `nights` 3-4. paraméterként injectable

---

## Environment változók

```
# Firebase kliens (publikus)
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# Firebase Admin
FIREBASE_SERVICE_ACCOUNT_KEY   # teljes service account JSON stringként, JSON.parse() az init-nél
JWT_SECRET                     # session cookie / custom token aláírás
```

Nincs szükség Kiwi vagy Amadeus API kulcsra — mindkét API nyilvános.

### Firebase Admin init pattern
```ts
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!)
initializeApp({ credential: cert(serviceAccount) })
```

---

## API route-ok

| Endpoint | Metódus | Auth | Leírás |
|---|---|---|---|
| `/api/countries` | GET | - | Országlista (24h cache) |
| `/api/flights` | GET | - | `?to=<IATA>&date=<YYYY-MM-DD>` |
| `/api/hotels` | GET | - | `?cityName=<név>&checkIn=...&checkOut=...&countryCode=...` |
| `/api/trip` | POST/GET | - | `{countryCode?}` → TripResult |
| `/api/saved-trips` | GET/POST | Bearer | Mentett utazások |
| `/api/saved-trips/[id]` | DELETE | Bearer | Törlés |
| `/api/auth/session` | POST/DELETE | - | Session cookie |

---

## Vercel deploy checklist

- [x] `FIREBASE_SERVICE_ACCOUNT_KEY` és `JWT_SECRET` — Vercelen már megvan
- [ ] 6 `NEXT_PUBLIC_FIREBASE_*` változó hozzáadása Vercelen
- [ ] Firebase Auth: Google provider engedélyezve
- [ ] Firebase Auth: `<project>.vercel.app` domain hozzáadva
- [ ] Firestore security rules: `request.auth.uid == uid`
