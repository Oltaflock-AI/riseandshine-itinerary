# Rise & Shine — AI Itinerary Generator (Vercel Deploy)

Live web tool for the Rise & Shine Travel demo. Single-file, no build step, no env vars, no backend.

---

## Deploy to Vercel — pick one path

### Option A · Drag-and-drop (fastest, ~60 seconds, no CLI)

1. Open **https://vercel.com/new**
2. Sign in with your GitHub / Google / email
3. Scroll down — you'll see a **"Deploy a template"** section. Above it there is a button labeled **"Browse all templates"** — ignore.
4. Instead, **drag this entire `riseandshine-itinerary-vercel` folder** onto the page (anywhere in the upload area). Vercel will detect `index.html` and treat it as a static site.
5. Give the project a name (e.g. `riseandshine-itinerary`) and hit **Deploy**.
6. ~30 seconds later you'll get a live URL like `https://riseandshine-itinerary.vercel.app`. That's the link to share on Google Meet.

> If the new-page UI doesn't show drag-drop, use Option B instead — it's the same thing via the terminal.

### Option B · Vercel CLI (great if you already have Node installed)

```bash
# 1. install the CLI once
npm install -g vercel

# 2. from inside this folder
cd riseandshine-itinerary-vercel
vercel
```

The CLI will ask 4 quick questions:
- *Set up and deploy?* → **Y**
- *Which scope?* → your account
- *Link to existing project?* → **N**
- *Project name?* → `riseandshine-itinerary` (or anything)
- *In which directory is your code located?* → press **Enter** (current dir)

It'll deploy to a preview URL in ~20 seconds. To promote it to a permanent production URL:

```bash
vercel --prod
```

You'll get a clean URL like `https://riseandshine-itinerary.vercel.app`.

### Option C · Push to GitHub then connect

If you want a "redeploy on every Git push" workflow:

```bash
cd riseandshine-itinerary-vercel
git init && git add . && git commit -m "Initial"
gh repo create riseandshine-itinerary --public --source=. --push
```

Then go to vercel.com/new → "Import Git Repository" → select the repo → Deploy.

---

## During the demo

1. Open your deployed URL on the laptop you're screen-sharing.
2. Click **"Load Demo Scenario"** to instantly populate the Rajesh family / Thailand inputs from the SOP.
3. Walk through the form while narrating. Hit **Generate**.
4. The 7-step progress animation runs (~40 seconds).
5. Walk the client through the branded PDF preview on the right.
6. Click **Edit Day** to demonstrate the "swap Phi Phi for a cooking class" moment from the SOP.
7. Click **Send WhatsApp** → enter a team member's number → show the confirmation.
8. Click **Download PDF** to hand them the branded file in the meeting.

## Custom domain (optional)

Once deployed, in the Vercel project dashboard → **Settings → Domains** → add `itinerary.riseandshine.in` (or any subdomain you own). Vercel auto-issues a free SSL cert in ~2 minutes.

## What's in this folder

| File | Purpose |
|------|---------|
| `index.html` | The entire tool — HTML, CSS, JS, live data + destination templates |
| `assets/logo.png` | Real Rise & Shine logo (bundled so it renders in the PDF) |
| `vercel.json` | Caching headers + clean URLs config |
| `README.md` | This file |

## v2 — Real live data (what changed)

**Thailand is now backed by real data**, not invented strings:

- **Flights** — real AMD⇄BKK quote pulled from Expedia (IndiGo via Mumbai, real flight numbers, times, fare rules, USD price).
- **Hotels** — real properties per budget tier (Solitaire / Chatrium / Park Hyatt · The Shore at Katathani / Anantara Layan) with live rates, strike-through discounts, real guest rating /10, review counts, and an embedded **live Google map** per hotel + a real "view photos & book on Expedia" deep link.
- **Transparent price estimate** — a real itemised breakdown (flight + hotels + transfers + activities + visa + service margin) in ₹ and $, per-person and total. The old "price shared later" cop-out is gone.
- **Traveller Intel** — a Do / Skip / Don't-miss panel synthesised from current traveller-consensus sources (Tripadvisor, US Embassy advisory, Phuket101, Horizon Guides — mirrors r/Thailand · r/phuket), filtered to the client's group, diet and budget.
- **De-faked** — the WhatsApp button now opens a real `wa.me` deep link with the message pre-filled (no fake "✓ sent" toast). Branding uses the real bundled logo, real phone `+91-79-2329 7232`, real email `info@riseandshinetravel.com`, real accreditations (IATTE · BNI · ADTOI · Gujarat Tourism).
- The data stamp shows exactly when rates were pulled and that they re-confirm at booking.

The other five destinations still use built-in templates and are clearly labelled **"indicative — live rates on request"**.

> **Data freshness note:** Thailand's live figures were pulled on **2026-05-18** for a sample **15–23 Jun 2026** trip. They are accurate as of that pull, not refreshed on every page load (see upgrade path below).

## Production upgrade — true per-request live data

The static site can't call live APIs on each visit (no backend, no keys it owns). To make every quote live on every load, add **Vercel Functions** (this is already a Vercel project):

| Need | Provider | Notes |
|------|----------|-------|
| Live flights | Amadeus Self-Service / Duffel / Kiwi Tequila | free tier; real AMD→dest price + schedule |
| Live hotels | Amadeus Hotel Search / Hotelbeds / Expedia Rapid (Partner) | availability + rate by tier |
| Hotel photos / reviews text | Google Places | Expedia MCP returns rating + count only, no photos/text |
| Visa rules | Sherpa° (joinsherpa) API | no reliable free source otherwise |
| Reddit validation | Reddit official API (free OAuth app) → Claude to synthesise Do/Skip/Don't-miss | the live version of the Traveller Intel panel |
| Itinerary brain | Claude API via Vercel AI Gateway | composes days grounded on the real data above; prices validated in code, not by the model |

Flow: `/api/itinerary` fans out flight + hotel + POI + Reddit calls in parallel, caches short-TTL (Vercel runtime cache) so it feels instant, streams **real** progress, returns JSON the existing front-end renders.

## Notes

- **PDF** — generated in-browser via `html2pdf.js`. The bundled logo renders in the PDF; the interactive map iframes are on-screen only (each hotel card also has a clickable map link that works in the PDF).
- **No tracking** — no analytics or cookies. Privacy-clean for client demos.
- **Mobile-friendly** — works on phones.

## Updating the content

Thailand's real data lives in the `live: { ... }` object inside `DESTINATIONS.thailand` in `index.html` (flight, hotels-by-tier, traveller intel, FX). To refresh, re-pull the Expedia quotes and update those values + the `updated` date. To add more destinations, copy the `live` schema onto another destination; without it the destination falls back to the indicative template.
