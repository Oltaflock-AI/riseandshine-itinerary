# Rise & Shine — AI Itinerary Generator (v2, live backend)

Next.js app that builds a **branded, hour-by-hour, done-for-you itinerary** from
**live data**: flights + hotels (Amadeus), attractions + diet-matched restaurants
(Google Places), traveller intel (Reddit), composed into a timed day plan by Claude.

> Every provider has a **labelled sample fallback**. The app builds, runs and
> renders with **zero keys** — sample data is clearly badged. Add a key and that
> provider goes live automatically. Nothing to rewire.

## Run it

```bash
npm install
cp .env.example .env.local      # optional — fill keys to go live
npm run dev                     # http://localhost:3000
# production:
npm run build && npm start
```

## Deploy (Vercel)

```bash
vercel
vercel --prod
```
Set the env vars from `.env.example` in **Vercel → Project → Settings →
Environment Variables**. On Vercel the AI Gateway can use the zero-rotation
OIDC token automatically.

## Live data — what to provision

| Capability | Provider | Key(s) | Free? |
|---|---|---|---|
| Flights AMD⇄dest, real fare | **Amadeus Self-Service** | `AMADEUS_CLIENT_ID` / `_SECRET` | free test tier |
| Hotels by city, live rate | **Amadeus** | (same) | free test tier |
| Restaurants (veg/Jain) + monuments + photos | **Google Places (New)** | `GOOGLE_PLACES_API_KEY` | free tier, billing card |
| Hour-by-hour day plan | **Claude** via AI Gateway | `AI_GATEWAY_API_KEY` *or* `ANTHROPIC_API_KEY` | paid per use |
| Do / Skip / Don't-miss intel | **Reddit API** | `REDDIT_CLIENT_ID` / `_SECRET` | free |

Each request fans out to all providers in parallel; the orchestrator falls back
to labelled sample data per provider independently, so a missing key never
breaks the page.

## Architecture

```
app/
  page.tsx                 client UI: form -> /api/itinerary -> visual render + PDF
  api/itinerary/route.ts   POST: validates TripRequest, runs the orchestrator
lib/
  itinerary/
    schema.ts              zod schema/types (TripRequest, Day, TimeBlock, Place)
    build.ts               orchestrator - parallel fan-out, pricing, freshness
    compose.ts             Claude grounded hour-by-hour engine + template
                           fallback + intel synthesis
  providers/
    amadeus.ts             flights + hotels (OAuth token cache) + fallback
    googlePlaces.ts        attractions + diet-aware restaurants + photos + fallback
    reddit.ts              app-only OAuth thread signal + fallback
    claude.ts              model resolver (Gateway/OIDC/key, else Anthropic key)
    sampleData.ts          labelled sample flights/hotels (real Expedia pull)
  destinations.ts          destination meta + nights split across city legs
  money.ts                 USD/INR
legacy/                    original single-file v1 (kept for reference)
public/assets/logo.png     real Rise & Shine logo
```

### The hour-by-hour engine

`compose.ts` feeds Claude a **grounded** context (only the real Google Places
results, plus real flight arrival/departure times and hotel per city) and asks
for a strict structured schema: each day is a continuous timed schedule
(`HH:MM`) of blocks — travel, check-in, sightseeing, activity, meal (2-3
diet-matched restaurant options), leisure. Day 1 starts at the real flight
arrival; the last day ends at departure. Prices are computed in code, never by
the model. With no Claude key a deterministic template engine produces the same
shape.

## Notes

- **PDF** — in-browser via `html2pdf.js`; bundled logo renders; hotel cards
  carry a clickable map link for the PDF (map iframes are on-screen).
- **Auth deviation (intentional, documented):** supports
  `AI_GATEWAY_API_KEY` / `ANTHROPIC_API_KEY` in addition to Vercel OIDC so it
  runs in local/off-Vercel dev. Vercel tooling prefers OIDC-only; the key path
  is kept for portability.
- Built against `ai@6` `generateObject` (verified present & non-deprecated in
  the installed package).
- `legacy/` holds the original static v1 for reference.
