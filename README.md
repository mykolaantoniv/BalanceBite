# BalanceBite — Meal Planner + Auchan Cart Automation

A Next.js app that lets users plan weekly menus, auto-generates shopping lists,
searches Auchan products on zakaz.ua, and fills the Auchan cart automatically.

## User Flow

```
Sign in (Google / Apple)
    ↓
📅 /menu       — Pick recipes for each day/meal of the week
    ↓
📝 /shopping   — Review shopping list, match products to Auchan
    ↓
🛒 /cart       — Review cart → "Fill Auchan Cart" → redirected to Auchan for delivery time
```

## Tech Stack

- **Next.js 14** (App Router)
- **NextAuth.js** — Google + Apple OAuth
- **Zustand** — client state (menu, shopping list, cart)
- **Tailwind CSS** — styling
- **zakaz.ua internal API** — product search + cart fill

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<run: openssl rand -base64 32>

# Google OAuth — get from console.cloud.google.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Apple OAuth — get from developer.apple.com
APPLE_ID=...
APPLE_TEAM_ID=...
APPLE_PRIVATE_KEY=...
APPLE_KEY_ID=...
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploying to Vercel

```bash
npx vercel
```

Set all environment variables in the Vercel dashboard.

**Important:** Because Vercel uses serverless functions, Auchan session tokens
are stored in Node.js memory per-instance. Users may need to reconnect their
Auchan account occasionally (every ~12 hours or after cold starts).

For production, consider replacing `lib/sessionStore.ts` with Redis/Upstash
for persistent token storage across serverless instances.

## How the Auchan Integration Works

1. User clicks "Connect Auchan" → enters their auchan.zakaz.ua credentials
2. App POSTs to `auchan.zakaz.ua/api/login/` → receives session token
3. Token stored server-side in memory (never exposed to browser)
4. Product search: `GET stores-api.zakaz.ua/stores/48215611/products/?q={query}`
5. Cart fill: `POST stores-api.zakaz.ua/stores/48215611/cart/` with token in header

## Adding More Stores

To add Silpo, Novus, etc.:
1. Find store ID from zakaz.ua network tab or known values:
   - Auchan: `48215611`
   - Silpo: `48215611` → check network tab for actual ID
2. Add store config to `lib/zakaz.ts`
3. Allow users to pick store in onboarding

## Folder Structure

```
app/
  page.tsx          — Landing page
  auth/signin/      — Google/Apple sign in
  menu/             — Weekly meal planner
  shopping/         — Shopping list + product matching
  cart/             — Cart review + Auchan fill
  api/
    auth/           — NextAuth handler
    zakaz/connect/  — Auchan login/disconnect
    zakaz/search/   — Product search proxy
    zakaz/cart/     — Cart fill proxy
components/
  layout/AppNav     — Navigation + step indicator
  ui/AuchanConnect  — Auchan login modal
lib/
  zakaz.ts          — zakaz.ua API client
  sessionStore.ts   — In-memory token store
  recipes.ts        — Recipe template library
  utils.ts          — Helpers
store/
  index.ts          — Zustand stores
types/
  index.ts          — TypeScript types
```

## Known Limitations & Next Steps

- [ ] Add AI menu generation (Claude API)
- [ ] Add user onboarding (family size, dietary prefs)
- [ ] Replace in-memory session store with Redis for Vercel
- [ ] Add more stores (Silpo, Novus)
- [ ] Add recipe favorites and custom recipes
- [ ] Mobile app (React Native with same API layer)
- [ ] Add delivery time picker within the app
