import type { Flights, Hotel } from "@/lib/itinerary/schema";

/** Labelled sample flights — real Expedia AMD⇄BKK pull (2026-05-18), used until Amadeus keys are set. */
export function sampleFlights(arrivalCity: string): Flights {
  return {
    carrier: "IndiGo (6E)",
    outbound: { label: "Outbound", route: "AMD → BOM → BKK", flights: "6E-6285 / 6E-1059",
      dep: "15 Jun · 04:00", arr: "15 Jun · 19:15", dur: "13h 45m", stops: "1 stop · Mumbai" },
    inbound: { label: "Return", route: "BKK → BOM → AMD", flights: "6E-1050 / 6E-632",
      dep: "22 Jun · 07:55", arr: "23 Jun · 05:20", dur: "21h 25m", stops: "1 stop · Mumbai" },
    fareNote: `SAVER · carry-on + 1 bag free · sample fare to ${arrivalCity}`,
    perAdultUSD: 386,
    source: "sample",
  };
}

/** Labelled sample hotels per tier — real Expedia pull for Thailand; generic otherwise. */
export function sampleHotels(destKey: string, tier: 3 | 4 | 5, nightsByCity: number[]): Hotel[] {
  const [n1 = 3, n2 = 4] = nightsByCity;
  if (destKey === "thailand") {
    const map: Record<number, Hotel[]> = {
      3: [
        { name: "Solitaire Bangkok Sukhumvit 11", area: "Bangkok · Sukhumvit", stars: 4, rating: 8.8, reviews: 1815, nights: n1, totalUSD: 62 * n1, strikeUSD: 103 * n1, lat: 13.745355, lng: 100.557451, bookUrl: "https://www.expedia.com/.h19849250.Hotel-Information", photoUrl: null, source: "sample" },
        { name: "Seeka Boutique Resort", area: "Phuket · near Patong", stars: 3, rating: 7.8, reviews: 167, nights: n2, totalUSD: 13 * n2, strikeUSD: 17 * n2, lat: 7.881398, lng: 98.297974, bookUrl: "https://www.expedia.com/.h36146764.Hotel-Information", photoUrl: null, source: "sample" },
      ],
      4: [
        { name: "Chatrium Hotel Riverside Bangkok", area: "Bangkok · Riverside", stars: 4, rating: 9.6, reviews: 1609, nights: n1, totalUSD: 167 * n1, strikeUSD: 256 * n1, lat: 13.710795, lng: 100.510011, bookUrl: "https://www.expedia.com/.h2558980.Hotel-Information", photoUrl: null, source: "sample" },
        { name: "The Shore at Katathani", area: "Phuket · Kata Noi", stars: 5, rating: 9.6, reviews: 957, nights: n2, totalUSD: 463 * n2, strikeUSD: 475 * n2, lat: 7.803246, lng: 98.30004, bookUrl: "https://www.expedia.com/.h3555818.Hotel-Information", photoUrl: null, source: "sample" },
      ],
      5: [
        { name: "Park Hyatt Bangkok", area: "Bangkok · Wireless Rd", stars: 5, rating: 9.6, reviews: 594, nights: n1, totalUSD: 337 * n1, strikeUSD: 397 * n1, lat: 13.743808, lng: 100.547386, bookUrl: "https://www.expedia.com/.h17405012.Hotel-Information", photoUrl: null, source: "sample" },
        { name: "Anantara Layan Phuket Resort", area: "Phuket · Layan Beach", stars: 5, rating: 9.6, reviews: 442, nights: n2, totalUSD: 477 * n2, strikeUSD: null, lat: 8.035707, lng: 98.28452, bookUrl: "https://www.expedia.com/.h6758147.Hotel-Information", photoUrl: null, source: "sample" },
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
  }));
}
