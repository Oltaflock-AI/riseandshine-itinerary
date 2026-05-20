import type { Destination } from "@/lib/destinations";
import type { Flights, Hotel } from "@/lib/itinerary/schema";

/** Format ISO YYYY-MM-DD into "15 Jun" for display. */
function fmtDay(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
}

interface RoutePreset {
  carrier: string;
  perAdultUSD: number;
  midpoint?: string;          // omitted = non-stop
  midpointCity?: string;
  outDep: string; outArr: string; outArrNextDay?: boolean;
  inDep: string; inArr: string; inArrNextDay?: boolean;
  outDur: string; inDur: string;
  cabin: string;
}

/** AMD → arrival per destination, with realistic carrier + route + times. */
const ROUTES: Record<string, RoutePreset> = {
  thailand: {
    carrier: "IndiGo (6E)", perAdultUSD: 386,
    midpoint: "BOM", midpointCity: "Mumbai",
    outDep: "04:00", outArr: "19:15", outDur: "13h 45m",
    inDep: "07:55",  inArr: "05:20", inArrNextDay: true, inDur: "21h 25m",
    cabin: "ECONOMY SAVER",
  },
  kerala: {
    carrier: "IndiGo (6E)", perAdultUSD: 145,
    midpoint: "BOM", midpointCity: "Mumbai",
    outDep: "06:00", outArr: "11:40", outDur: "5h 40m",
    inDep: "15:00",  inArr: "20:25", inDur: "5h 25m",
    cabin: "ECONOMY",
  },
  rajasthan: {
    carrier: "IndiGo (6E)", perAdultUSD: 78,
    outDep: "08:20", outArr: "09:35", outDur: "1h 15m",
    inDep: "17:00",  inArr: "18:20", inDur: "1h 20m",
    cabin: "ECONOMY",
  },
  mauritius: {
    carrier: "Air Mauritius (MK)", perAdultUSD: 612,
    midpoint: "BOM", midpointCity: "Mumbai",
    outDep: "23:30", outArr: "08:10", outArrNextDay: true, outDur: "11h 10m",
    inDep: "11:30",  inArr: "00:40", inArrNextDay: true,  inDur: "10h 40m",
    cabin: "ECONOMY",
  },
  maldives: {
    carrier: "IndiGo (6E)", perAdultUSD: 428,
    midpoint: "BOM", midpointCity: "Mumbai",
    outDep: "01:20", outArr: "11:55", outDur: "9h 5m",
    inDep: "13:25",  inArr: "22:40", inDur: "8h 45m",
    cabin: "ECONOMY",
  },
  bali: {
    carrier: "Singapore Airlines (SQ)", perAdultUSD: 521,
    midpoint: "SIN", midpointCity: "Singapore",
    outDep: "21:30", outArr: "21:05", outArrNextDay: true, outDur: "21h 5m",
    inDep: "23:15",  inArr: "11:50", inArrNextDay: true,  inDur: "10h 5m",
    cabin: "ECONOMY",
  },
};

/** Sample flights — uses destination route + actual dates. Never references BKK unless destination IS Thailand. */
export function sampleFlights(dest: Destination, startDate: string, endDate: string): Flights {
  const p = ROUTES[dest.key] ?? ROUTES.thailand;
  const origin = dest.originAirport;        // always AMD
  const arr = dest.arrivalAirport;

  const outRoute = p.midpoint ? `${origin} → ${p.midpoint} → ${arr}` : `${origin} → ${arr}`;
  const inRoute  = p.midpoint ? `${arr} → ${p.midpoint} → ${origin}` : `${arr} → ${origin}`;
  const stops = p.midpoint ? `1 stop · ${p.midpointCity}` : "Non-stop";

  const startNext = (() => {
    const d = new Date(startDate + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  })();
  const endNext = (() => {
    const d = new Date(endDate + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  return {
    carrier: p.carrier,
    outbound: {
      label: "Outbound", route: outRoute,
      flights: p.midpoint ? "6E-6285 / 6E-1059" : "6E-9001",
      dep: `${fmtDay(startDate)} · ${p.outDep}`,
      arr: `${fmtDay(p.outArrNextDay ? startNext : startDate)} · ${p.outArr}`,
      dur: p.outDur, stops,
    },
    inbound: {
      label: "Return", route: inRoute,
      flights: p.midpoint ? "6E-1050 / 6E-632" : "6E-9002",
      dep: `${fmtDay(endDate)} · ${p.inDep}`,
      arr: `${fmtDay(p.inArrNextDay ? endNext : endDate)} · ${p.inArr}`,
      dur: p.inDur, stops,
    },
    fareNote: `${p.cabin} · indicative sample fare · subject to availability`,
    perAdultUSD: p.perAdultUSD,
    source: "sample",
    alternatives: [],
  };
}

/** Labelled sample hotels per tier — real Expedia pull for Thailand; generic otherwise. */
export function sampleHotels(destKey: string, tier: 3 | 4 | 5, nightsByCity: number[]): Hotel[] {
  const [n1 = 3, n2 = 4] = nightsByCity;
  if (destKey === "thailand") {
    const map: Record<number, Hotel[]> = {
      3: [
        { name: "Solitaire Bangkok Sukhumvit 11", area: "Bangkok · Sukhumvit", stars: 4, rating: 8.8, reviews: 1815, nights: n1, totalUSD: 62 * n1, strikeUSD: 103 * n1, lat: 13.745355, lng: 100.557451, bookUrl: "https://www.expedia.com/.h19849250.Hotel-Information", photoUrl: null, source: "sample", alternatives: [] },
        { name: "Seeka Boutique Resort", area: "Phuket · near Patong", stars: 3, rating: 7.8, reviews: 167, nights: n2, totalUSD: 13 * n2, strikeUSD: 17 * n2, lat: 7.881398, lng: 98.297974, bookUrl: "https://www.expedia.com/.h36146764.Hotel-Information", photoUrl: null, source: "sample", alternatives: [] },
      ],
      4: [
        { name: "Chatrium Hotel Riverside Bangkok", area: "Bangkok · Riverside", stars: 4, rating: 9.6, reviews: 1609, nights: n1, totalUSD: 167 * n1, strikeUSD: 256 * n1, lat: 13.710795, lng: 100.510011, bookUrl: "https://www.expedia.com/.h2558980.Hotel-Information", photoUrl: null, source: "sample", alternatives: [] },
        { name: "The Shore at Katathani", area: "Phuket · Kata Noi", stars: 5, rating: 9.6, reviews: 957, nights: n2, totalUSD: 463 * n2, strikeUSD: 475 * n2, lat: 7.803246, lng: 98.30004, bookUrl: "https://www.expedia.com/.h3555818.Hotel-Information", photoUrl: null, source: "sample", alternatives: [] },
      ],
      5: [
        { name: "Park Hyatt Bangkok", area: "Bangkok · Wireless Rd", stars: 5, rating: 9.6, reviews: 594, nights: n1, totalUSD: 337 * n1, strikeUSD: 397 * n1, lat: 13.743808, lng: 100.547386, bookUrl: "https://www.expedia.com/.h17405012.Hotel-Information", photoUrl: null, source: "sample", alternatives: [] },
        { name: "Anantara Layan Phuket Resort", area: "Phuket · Layan Beach", stars: 5, rating: 9.6, reviews: 442, nights: n2, totalUSD: 477 * n2, strikeUSD: null, lat: 8.035707, lng: 98.28452, bookUrl: "https://www.expedia.com/.h6758147.Hotel-Information", photoUrl: null, source: "sample", alternatives: [] },
      ],
    };
    return map[tier];
  }
  const base = tier === 3 ? 55 : tier === 4 ? 120 : 260;
  return nightsByCity.map((nt, i) => ({
    name: `${tier}-Star Partner Hotel ${i + 1}`,
    area: "City centre", stars: tier, rating: 8.6, reviews: 0, nights: nt,
    totalUSD: base * nt, strikeUSD: null, lat: 0, lng: 0,
    bookUrl: "https://www.google.com/travel/hotels", photoUrl: null, source: "sample",
    alternatives: [],
  }));
}
