import type { Flights, Hotel } from "@/lib/itinerary/schema";

const BASE = () =>
  process.env.AMADEUS_ENV === "production"
    ? "https://api.amadeus.com"
    : "https://test.api.amadeus.com";

let tokenCache: { token: string; exp: number } | null = null;

function configured(): boolean {
  return Boolean(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET);
}

async function token(): Promise<string | null> {
  if (!configured()) return null;
  if (tokenCache && tokenCache.exp > Date.now() + 30_000) return tokenCache.token;
  try {
    const r = await fetch(`${BASE()}/v1/security/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.AMADEUS_CLIENT_ID!,
        client_secret: process.env.AMADEUS_CLIENT_SECRET!,
      }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    tokenCache = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
    return tokenCache.token;
  } catch {
    return null;
  }
}

function hhmm(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}
function dur(d: string): string {
  const m = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  return m ? `${m[1] ?? 0}h ${m[2] ?? 0}m` : d;
}

/** Live flight offer (cheapest) AMD→arrival round trip, or null to signal fallback. */
export async function liveFlights(
  origin: string, dest: string, departISO: string, returnISO: string, adults: number,
): Promise<Flights | null> {
  const t = await token();
  if (!t) return null;
  try {
    const qs = new URLSearchParams({
      originLocationCode: origin,
      destinationLocationCode: dest,
      departureDate: departISO,
      returnDate: returnISO,
      adults: String(Math.max(1, adults)),
      currencyCode: "USD",
      max: "10",
    });
    const r = await fetch(`${BASE()}/v2/shopping/flight-offers?${qs}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j.data?.length) return null;
    const carriers = j.dictionaries?.carriers ?? {};
    const leg = (it: any, label: string) => {
      const segs = it.segments;
      const first = segs[0], last = segs[segs.length - 1];
      const code = first.carrierCode;
      return {
        label,
        route: segs.map((s: any) => s.departure.iataCode).concat(last.arrival.iataCode).join(" → "),
        flights: segs.map((s: any) => `${s.carrierCode}-${s.number}`).join(" / "),
        dep: hhmm(first.departure.at),
        arr: hhmm(last.arrival.at),
        dur: dur(it.duration),
        stops: segs.length === 1 ? "Non-stop" : `${segs.length - 1} stop`,
      };
    };
    // Map up to 5 deduped offers; cheapest = primary, rest = alternatives.
    const mapOffer = (o: any) => {
      const cName = carriers[o.itineraries[0].segments[0].carrierCode] ||
        o.itineraries[0].segments[0].carrierCode;
      const pa = Number(o.travelerPricings?.[0]?.price?.total ?? o.price.total);
      return {
        carrier: cName,
        outbound: leg(o.itineraries[0], "Outbound"),
        inbound: leg(o.itineraries[1], "Return"),
        fareNote: `${o.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin ?? "ECONOMY"} · live Amadeus fare`,
        perAdultUSD: Math.round(pa),
      };
    };
    const offers = (j.data ?? []).slice(0, 8).map(mapOffer);
    // dedupe by flight-number set
    const seen = new Set<string>();
    const deduped = offers.filter((o: any) => {
      const k = o.outbound.flights + "|" + o.inbound.flights;
      if (seen.has(k)) return false;
      seen.add(k); return true;
    }).slice(0, 5);
    const primary = deduped[0];
    return {
      ...primary,
      source: "live" as const,
      alternatives: deduped.slice(1),
    };
  } catch {
    return null;
  }
}

/** Live hotel offers by city code, mapped to our tiered Hotel shape, or null. */
export async function liveHotels(
  cityQuery: string, lat: number, lng: number,
  checkIn: string, checkOut: string, adults: number, nights: number,
): Promise<Hotel[] | null> {
  const t = await token();
  if (!t) return null;
  try {
    const listQs = new URLSearchParams({
      latitude: String(lat), longitude: String(lng),
      radius: "20", radiusUnit: "KM", hotelSource: "ALL",
    });
    const list = await fetch(
      `${BASE()}/v1/reference-data/locations/hotels/by-geocode?${listQs}`,
      { headers: { Authorization: `Bearer ${t}` } },
    );
    if (!list.ok) return null;
    const ids: string[] = (await list.json()).data
      ?.slice(0, 25).map((h: any) => h.hotelId).filter(Boolean) ?? [];
    if (!ids.length) return null;

    const offQs = new URLSearchParams({
      hotelIds: ids.join(","),
      adults: String(Math.max(1, adults)),
      checkInDate: checkIn, checkOutDate: checkOut,
      currency: "USD", bestRateOnly: "true",
    });
    const off = await fetch(`${BASE()}/v3/shopping/hotel-offers?${offQs}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!off.ok) return null;
    const data = (await off.json()).data ?? [];
    const mapped: Hotel[] = data
      .filter((d: any) => d.available && d.offers?.[0])
      .map((d: any) => {
        const total = Number(d.offers[0].price?.total ?? 0);
        return {
          name: d.hotel.name,
          area: cityQuery,
          stars: Number(d.hotel.rating ?? 4) || 4,
          rating: Number(d.hotel.rating ?? 4) * 2,
          reviews: 0,
          nights,
          totalUSD: Math.round(total),
          strikeUSD: null,
          lat: d.hotel.latitude ?? lat,
          lng: d.hotel.longitude ?? lng,
          bookUrl: `https://www.google.com/search?q=${encodeURIComponent(d.hotel.name + " " + cityQuery)}`,
          photoUrl: null,
          source: "live" as const,
          alternatives: [],
        };
      });
    if (!mapped.length) return null;
    // Sort cheapest-first; primary = mapped[0]; pack the next 4 as primary.alternatives
    mapped.sort((a, b) => a.totalUSD - b.totalUSD);
    const altsForPrimary = mapped.slice(1, 5).map(({ alternatives: _a, ...rest }) => rest);
    mapped[0] = { ...mapped[0], alternatives: altsForPrimary };
    return mapped;
  } catch {
    return null;
  }
}
