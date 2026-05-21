/**
 * Scrape Rise & Shine package listing + detail pages (Playwright).
 * Run: node scripts/scrape-packages.mjs
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../data/scraped");

const PAGES = [
  { category: "domestic", url: "https://www.riseandshinetravel.com/domestic.html" },
  { category: "international", url: "https://www.riseandshinetravel.com/international-packages.html" },
  { category: "cruise", url: "https://www.riseandshinetravel.com/cruise.html" },
];

async function scrapeListing(page, category, url) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);

  const cards = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll("a, button, .package, [class*='package'], h2, h3").forEach(() => {});
    const links = [...document.querySelectorAll("a")];
    const seen = new Set();
    for (const a of links) {
      const text = (a.textContent || "").replace(/\s+/g, " ").trim();
      const href = a.href || "";
      if (!href || href === "#" || seen.has(href)) continue;
      if (/explore|package|tour|andaman|kerala|goa|rajast|thailand|dubai|mauritius|hong|cruise|golden|bali|singapore/i.test(text + href)) {
        seen.add(href);
        results.push({ text: text.slice(0, 120), href });
      }
    }
    const headings = [...document.querySelectorAll("h1,h2,h3,h4")].map((h) => ({
      tag: h.tagName,
      text: (h.textContent || "").replace(/\s+/g, " ").trim(),
    }));
    const imgs = [...document.querySelectorAll("img")].map((img) => ({
      src: img.src,
      alt: img.alt || "",
    }));
    const bodyText = (document.body?.innerText || "").slice(0, 12000);
    return { links: results.slice(0, 40), headings, imgs: imgs.slice(0, 30), bodyText };
  });

  return { category, url, ...cards };
}

async function scrapeDetail(page, url) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(2000);
    return await page.evaluate((pageUrl) => {
      const title =
        document.querySelector("h1")?.textContent?.trim() ||
        document.querySelector("h2")?.textContent?.trim() ||
        document.title;
      const paragraphs = [...document.querySelectorAll("p, li")]
        .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
        .filter((t) => t.length > 20 && t.length < 800);
      const dayBlocks = [];
      const text = document.body?.innerText || "";
      const dayRe = /Day\s*(\d+)[^\n]*/gi;
      let m;
      while ((m = dayRe.exec(text)) !== null) {
        const start = m.index;
        const next = text.slice(start + 20).search(/Day\s*\d+/i);
        const chunk = text.slice(start, next > 0 ? start + 20 + next : start + 1200);
        dayBlocks.push(chunk.trim());
      }
      const imgs = [...document.querySelectorAll("img")]
        .map((i) => ({ src: i.src, alt: i.alt }))
        .filter((i) => i.src && !i.src.includes("logo") && !i.src.includes("member"));
      return { url: pageUrl, title, paragraphs: paragraphs.slice(0, 40), dayBlocks, imgs: imgs.slice(0, 15), fullText: text.slice(0, 25000) };
    }, url);
  } catch (e) {
    return { url, error: String(e) };
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const listings = [];
  const detailUrls = new Set();

  for (const p of PAGES) {
    console.log("Listing:", p.url);
    const data = await scrapeListing(page, p.category, p.url);
    listings.push(data);
    for (const l of data.links) {
      if (l.href.includes("riseandshinetravel.com") && !l.href.endsWith(".html#"))
        detailUrls.add(l.href);
    }
  }

  // Common detail URL patterns on travel sites
  const TOUR_URLS = [
    "https://www.riseandshinetravel.com/andaman-domestic-tour.html",
    "https://www.riseandshinetravel.com/rajasthan-domestic-tour.html",
    "https://www.riseandshinetravel.com/kerala-domestic-tour.html",
    "https://www.riseandshinetravel.com/goa-domestic-tour.html",
    "https://www.riseandshinetravel.com/golden-triangle-domestic-tour.html",
    "https://www.riseandshinetravel.com/thailand-international-tour.html",
    "https://www.riseandshinetravel.com/dubai-international-tour.html",
    "https://www.riseandshinetravel.com/mauritius-international-tour.html",
    "https://www.riseandshinetravel.com/hong-kong-macau-shenzhen-international-tour.html",
    "https://www.riseandshinetravel.com/mauritius-with-dubai-international-tour.html",
    "https://www.riseandshinetravel.com/singapore-bali-with-cruise-tour.html",
  ];
  TOUR_URLS.forEach((u) => detailUrls.add(u));

  const details = [];
  for (const url of TOUR_URLS) {
    console.log("Detail:", url);
    const d = await scrapeDetail(page, url);
    details.push(d);
  }

  writeFileSync(join(OUT, "listings.json"), JSON.stringify(listings, null, 2));
  writeFileSync(join(OUT, "details.json"), JSON.stringify(details, null, 2));
  console.log("Wrote", listings.length, "listings,", details.length, "details");
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
