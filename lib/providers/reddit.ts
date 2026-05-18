/**
 * Reddit traveller signal. App-only OAuth (client_credentials).
 * Returns short thread snippets the itinerary engine folds into Do/Skip/Don't-miss.
 * Returns null when unconfigured/unavailable → orchestrator uses sample intel.
 */
let tok: { t: string; exp: number } | null = null;

function configured(): boolean {
  return Boolean(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET);
}
const UA = () => process.env.REDDIT_USER_AGENT || "riseandshine-itinerary/2.0";

async function token(): Promise<string | null> {
  if (!configured()) return null;
  if (tok && tok.exp > Date.now() + 30_000) return tok.t;
  try {
    const basic = Buffer.from(
      `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`,
    ).toString("base64");
    const r = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": UA(),
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    tok = { t: j.access_token, exp: Date.now() + j.expires_in * 1000 };
    return tok.t;
  } catch {
    return null;
  }
}

export async function redditSignal(destinationName: string): Promise<string[] | null> {
  const t = await token();
  if (!t) return null;
  try {
    const q = encodeURIComponent(`${destinationName} itinerary tips OR scams OR overrated OR "worth it"`);
    const r = await fetch(
      `https://oauth.reddit.com/search?q=${q}&sort=relevance&t=year&limit=25&type=link`,
      { headers: { Authorization: `Bearer ${t}`, "User-Agent": UA() } },
    );
    if (!r.ok) return null;
    const j = await r.json();
    const snippets: string[] = (j.data?.children ?? [])
      .map((c: any) => {
        const d = c.data;
        const body = (d.selftext || "").replace(/\s+/g, " ").slice(0, 280);
        return `[r/${d.subreddit} · ${d.ups}↑] ${d.title}${body ? " — " + body : ""}`;
      })
      .filter((s: string) => s.length > 20)
      .slice(0, 20);
    return snippets.length ? snippets : null;
  } catch {
    return null;
  }
}
