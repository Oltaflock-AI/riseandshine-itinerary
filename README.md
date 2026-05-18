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
| `index.html` | The entire tool — HTML, CSS, JS, and destination templates in one file |
| `vercel.json` | Caching headers + clean URLs config |
| `README.md` | This file |

## Notes

- **No API keys** — destination content is built-in (Thailand, Kerala, Mauritius, Maldives, Rajasthan, Bali). Safe for live demos with zero network failure risk.
- **No backend** — PDF generation runs entirely in the browser via `html2pdf.js` (loaded from CDN).
- **No tracking** — no analytics or cookies. Privacy-clean for client demos.
- **Mobile-friendly** — works on phones; you can show the tool on a phone during the meeting too.

## Updating the content

To add more destinations, edit the `DESTINATIONS` object inside `index.html` (around line 600). The schema is documented inline. Push to redeploy, or drag the updated folder to Vercel again.
