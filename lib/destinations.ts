export interface CityLeg {
  name: string;          // display, e.g. "Bangkok"
  hotelCity: string;     // query string for hotel/place search
  lat: number;
  lng: number;
  weight: number;        // share of total nights
}

export interface Destination {
  key: string;
  name: string;
  title: string;
  tagline: string;
  originAirport: string; // AMD
  arrivalAirport: string;
  arrivalCity: string;
  cities: CityLeg[];
  visa: { type: string; validity: string; processing: string; fee: string; docs: string };
  international: boolean;
}

export const DESTINATIONS: Record<string, Destination> = {
  thailand: {
    key: "thailand",
    name: "Thailand",
    title: "Thailand — Bangkok & Phuket",
    tagline: "Beaches, Buddhas, and Bangkok by night",
    originAirport: "AMD",
    arrivalAirport: "BKK",
    arrivalCity: "Bangkok",
    cities: [
      { name: "Bangkok", hotelCity: "Bangkok, Thailand", lat: 13.7466, lng: 100.5347, weight: 0.42 },
      { name: "Phuket — Kata/Patong", hotelCity: "Phuket, Thailand", lat: 7.8965, lng: 98.2966, weight: 0.58 },
    ],
    visa: {
      type: "Thailand Tourist Visa (eVisa)",
      validity: "60 days from issue",
      processing: "5–7 working days",
      fee: "₹2,500 per person (incl. service)",
      docs: "Passport (6mo validity), 2 photos, confirmed tickets & hotel, bank statement (last 3 months)",
    },
    international: true,
  },
  kerala: {
    key: "kerala",
    name: "Kerala",
    title: "Kerala — God's Own Country",
    tagline: "Hill stations, houseboats, and Cochin's old soul",
    originAirport: "AMD",
    arrivalAirport: "COK",
    arrivalCity: "Kochi",
    cities: [
      { name: "Munnar", hotelCity: "Munnar, Kerala", lat: 10.0889, lng: 77.0595, weight: 0.34 },
      { name: "Alleppey", hotelCity: "Alleppey, Kerala", lat: 9.4981, lng: 76.3388, weight: 0.3 },
      { name: "Kochi", hotelCity: "Kochi, Kerala", lat: 9.9658, lng: 76.2422, weight: 0.36 },
    ],
    visa: {
      type: "Domestic — No visa required",
      validity: "N/A", processing: "N/A", fee: "N/A",
      docs: "Govt photo ID for all travellers (Aadhaar / PAN / Passport) at hotel check-in",
    },
    international: false,
  },
  mauritius: {
    key: "mauritius",
    name: "Mauritius",
    title: "Mauritius — Indian Ocean Idyll",
    tagline: "Lagoons, volcanoes, and barefoot luxury",
    originAirport: "AMD", arrivalAirport: "MRU", arrivalCity: "Port Louis",
    cities: [{ name: "North & West Coast", hotelCity: "Grand Baie, Mauritius", lat: -20.0136, lng: 57.5806, weight: 1 }],
    visa: {
      type: "Mauritius — Visa on arrival (free, 60 days)",
      validity: "60 days", processing: "On arrival", fee: "Free",
      docs: "Passport (6mo validity), return ticket, hotel confirmation, USD 100/day proof of funds",
    },
    international: true,
  },
  maldives: {
    key: "maldives",
    name: "Maldives",
    title: "Maldives — Overwater Escape",
    tagline: "One island, one resort, zero worries",
    originAirport: "AMD", arrivalAirport: "MLE", arrivalCity: "Malé",
    cities: [{ name: "Resort Atoll", hotelCity: "Maldives", lat: 4.1755, lng: 73.5093, weight: 1 }],
    visa: {
      type: "Maldives — Free visa on arrival (30 days)",
      validity: "30 days", processing: "On arrival", fee: "Free",
      docs: "Passport (6mo validity), confirmed hotel booking, return ticket, USD 100/day proof",
    },
    international: true,
  },
  rajasthan: {
    key: "rajasthan",
    name: "Rajasthan",
    title: "Rajasthan — Land of Kings",
    tagline: "Forts, palaces, and desert colour",
    originAirport: "AMD", arrivalAirport: "JAI", arrivalCity: "Jaipur",
    cities: [
      { name: "Jaipur", hotelCity: "Jaipur, Rajasthan", lat: 26.9124, lng: 75.7873, weight: 0.4 },
      { name: "Udaipur", hotelCity: "Udaipur, Rajasthan", lat: 24.5854, lng: 73.7125, weight: 0.6 },
    ],
    visa: {
      type: "Domestic — No visa required",
      validity: "N/A", processing: "N/A", fee: "N/A",
      docs: "Govt photo ID for all travellers at hotel check-in",
    },
    international: false,
  },
  bali: {
    key: "bali",
    name: "Bali",
    title: "Bali — Island of the Gods",
    tagline: "Rice terraces, temples, and surf",
    originAirport: "AMD", arrivalAirport: "DPS", arrivalCity: "Denpasar",
    cities: [
      { name: "Ubud", hotelCity: "Ubud, Bali", lat: -8.5069, lng: 115.2625, weight: 0.45 },
      { name: "Seminyak/Nusa Dua", hotelCity: "Seminyak, Bali", lat: -8.6906, lng: 115.1686, weight: 0.55 },
    ],
    visa: {
      type: "Indonesia — Visa on arrival (e-VOA, 30 days)",
      validity: "30 days (extendable once)", processing: "On arrival / online",
      fee: "≈ ₹3,000 (IDR 500,000)",
      docs: "Passport (6mo validity), return ticket, hotel booking",
    },
    international: true,
  },
};

/** Split total nights across city legs by weight (≥1 night each, remainder to largest). */
export function splitNights(d: Destination, totalNights: number): number[] {
  const n = d.cities.length;
  if (n === 1) return [totalNights];
  const base = d.cities.map((c) => Math.max(1, Math.floor(totalNights * c.weight)));
  let used = base.reduce((a, b) => a + b, 0);
  let i = d.cities.reduce((mi, c, idx, arr) => (c.weight > arr[mi].weight ? idx : mi), 0);
  while (used < totalNights) { base[i]++; used++; }
  while (used > totalNights) { const j = base.indexOf(Math.max(...base)); if (base[j] > 1) { base[j]--; used--; } else break; }
  return base;
}
