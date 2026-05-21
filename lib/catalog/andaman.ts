import type { Place } from "@/lib/itinerary/schema";
import type { CatalogPackage } from "./types";

const maps = (q: string, lat: number, lng: number) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}&query_place_id=&center=${lat},${lng}`;

const place = (
  name: string,
  category: string,
  lat: number,
  lng: number,
  photoUrl: string,
  rating: number,
  reviews: number,
  tag?: string,
): Place => ({
  name,
  category,
  lat,
  lng,
  rating,
  reviews,
  priceLevel: null,
  photoUrl,
  mapsUrl: maps(name, lat, lng),
  vegFriendly: true,
  tag: tag ?? null,
});

import { IMG as SHARED_IMG } from "./shared";

/** Andaman day imagery — uses verified URLs from shared catalog. */
const IMG = {
  hero: SHARED_IMG.andaman,
  cellularJail: SHARED_IMG.andamanCoast,
  soundLight: SHARED_IMG.andamanCoast,
  radhanagar: SHARED_IMG.andamanBeach,
  elephantBeach: SHARED_IMG.andamanBeach,
  neil: SHARED_IMG.andaman,
  wandoor: SHARED_IMG.andamanBeach,
  hotelPB: SHARED_IMG.hotel,
  hotelHavelock: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
  hotelNeil: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
};

export const ANDAMAN_PACKAGE: CatalogPackage = {
  key: "andaman",
  category: "domestic",
  name: "Andaman",
  title: "Andaman — Port Blair, Havelock & Neil",
  tagline: "Turquoise waters, Cellular Jail history, and Asia's finest beaches",
  tourName: "Andaman Delight",
  durationNights: 5,
  durationDays: 6,
  routeSummary: "Port Blair (2N) · Havelock (2N) · Neil Island (1N)",
  heroImageUrl: IMG.hero,
  originAirport: "AMD",
  arrivalAirport: "IXZ",
  flightRouteLabel: "AMD ↔ Port Blair",
  domestic: true,

  flights: {
    carrier: "IndiGo (6E) · via Mumbai",
    perAdultUSD: 257,
    fareNote:
      "Indicative round-trip economy from Ahmedabad (AMD), 1 stop. Average market fare ≈ ₹22,000 per adult — confirmed on booking.",
    source: "sample",
    alternatives: [],
    outbound: {
      label: "Outbound",
      route: "AMD → BOM → IXZ (Port Blair)",
      flights: "6E · 1 stop",
      dep: "06:00",
      arr: "14:30",
      dur: "8h 30m",
      stops: "1 stop · Mumbai",
    },
    inbound: {
      label: "Return",
      route: "IXZ → BOM → AMD",
      flights: "6E · 1 stop",
      dep: "09:15",
      arr: "20:45",
      dur: "11h 30m",
      stops: "1 stop · Mumbai",
    },
  },

  hotels: [
    {
      name: "SeaShell Hotel & Spa",
      area: "Port Blair",
      stars: 4,
      rating: 8.4,
      reviews: 2840,
      nights: 2,
      totalUSD: 136,
      strikeUSD: 168,
      lat: 11.6234,
      lng: 92.7265,
      bookUrl: "https://www.seashellhotels.net/port-blair",
      photoUrl: IMG.hotelPB,
      source: "sample",
      alternatives: [],
    },
    {
      name: "Symphony Palms Beach Resort",
      area: "Havelock Island (Govind Nagar)",
      stars: 4,
      rating: 8.6,
      reviews: 1920,
      nights: 2,
      totalUSD: 168,
      strikeUSD: 210,
      lat: 12.0102,
      lng: 92.9908,
      bookUrl: "https://www.symphonyresorts.com/",
      photoUrl: IMG.hotelHavelock,
      source: "sample",
      alternatives: [],
    },
    {
      name: "SeaShell Neil",
      area: "Neil Island (Bharatpur)",
      stars: 4,
      rating: 8.5,
      reviews: 980,
      nights: 1,
      totalUSD: 64,
      strikeUSD: 78,
      lat: 11.8186,
      lng: 93.0419,
      bookUrl: "https://www.seashellhotels.net/neil-island",
      photoUrl: IMG.hotelNeil,
      source: "sample",
      alternatives: [],
    },
  ],

  visa: {
    type: "Domestic — No visa required",
    validity: "N/A",
    processing: "N/A",
    fee: "N/A",
    docs: "Government photo ID for all travellers (Aadhaar, PAN, or passport) at hotel check-in",
  },

  intel: {
    do: [
      "Book Havelock & Neil ferry tickets in advance in peak season (Dec–Feb).",
      "Carry original photo ID for inter-island ferries and checkpoints.",
      "Pack reef-safe sunscreen and light rain gear for monsoon months.",
    ],
    skip: [
      "Do not plan tight connections on ferry days — weather delays are common.",
      "Avoid unlicensed snorkelling operators at Elephant Beach.",
    ],
    miss: [
      "Sunset at Radhanagar Beach (Beach No. 7).",
      "Sound & Light Show at Cellular Jail (evening).",
      "Half-day at Wandoor before departure flight.",
    ],
    diet: "Plenty of vegetarian and Jain-friendly resort dining on Havelock and Neil.",
    sources: "Rise & Shine Travel · curated Andaman desk notes",
    source: "sample",
  },

  pricingINR: {
    flightPerAdult: 22000,
    hotels: [
      { nightly: 5800, nights: 2 },
      { nightly: 7200, nights: 2 },
      { nightly: 5500, nights: 1 },
    ],
    transfersPerPax: 4500,
    activitiesPerPax: 3500,
    insurancePerPax: 650,
    servicePct: 0.12,
  },

  narrativeDays: [
    {
      dayIndex: 0,
      cityLabel: "Port Blair",
      headline: "Arrive Port Blair",
      overnight: "Port Blair",
      activities: [
        {
          period: "Morning",
          title: "Welcome to Andaman Delight",
          detail:
            "On arrival at Port Blair airport, meet our representative and transfer to your hotel. Rest and freshen up.",
          place: place(
            "Veer Savarkar International Airport",
            "Airport",
            11.6412,
            92.7297,
            IMG.hero,
            4.2,
            3200,
            "IXZ arrivals",
          ),
        },
        {
          period: "Afternoon",
          title: "Cellular Jail National Memorial",
          detail:
            "Visit the National Memorial — Cellular Jail, built for solitary confinement and known as Kala Pani in India's freedom struggle.",
          place: place(
            "Cellular Jail National Memorial",
            "Historic site",
            11.6689,
            92.7453,
            IMG.cellularJail,
            4.5,
            18500,
            "Must-see history",
          ),
        },
        {
          period: "Evening",
          title: "Sound & Light Show",
          detail:
            "Witness the Sound and Light Show at Cellular Jail — the saga of the freedom movement brought alive.",
          place: place(
            "Cellular Jail — Light Show",
            "Experience",
            11.6689,
            92.7453,
            IMG.soundLight,
            4.6,
            9200,
          ),
        },
      ],
    },
    {
      dayIndex: 1,
      cityLabel: "Port Blair → Havelock",
      headline: "Ferry to Havelock",
      overnight: "Havelock Island",
      activities: [
        {
          period: "Morning",
          title: "Ferry to Havelock Island",
          detail:
            "After breakfast, transfer to the jetty for the ferry to Havelock. On arrival, check in to your resort.",
          place: null,
        },
        {
          period: "Afternoon",
          title: "Radhanagar Beach (Beach No. 7)",
          detail:
            "Visit Radhanagar Beach — among Asia's finest beaches (TIME magazine). Turquoise water and white sand; ideal for families.",
          place: place(
            "Radhanagar Beach",
            "Beach",
            11.9892,
            93.0031,
            IMG.radhanagar,
            4.8,
            12400,
            "Asia's top beach",
          ),
        },
      ],
    },
    {
      dayIndex: 2,
      cityLabel: "Havelock Island",
      headline: "Elephant Beach",
      overnight: "Havelock Island",
      activities: [
        {
          period: "Morning",
          title: "Elephant Beach (shared boat)",
          detail:
            "Proceed to Elephant Beach by shared fibre-glass speed boat. Optional snorkelling at extra cost — calm, shallow water, ideal for beginners.",
          place: place(
            "Elephant Beach",
            "Beach · Snorkelling",
            12.0364,
            93.0178,
            IMG.elephantBeach,
            4.7,
            8600,
            "Snorkel-friendly",
          ),
        },
        {
          period: "Afternoon",
          title: "Beach leisure",
          detail:
            "Relax on the sand among fallen trees and white sand — unhurried island time.",
          place: place(
            "Elephant Beach",
            "Leisure",
            12.0364,
            93.0178,
            IMG.elephantBeach,
            4.7,
            8600,
          ),
        },
      ],
    },
    {
      dayIndex: 3,
      cityLabel: "Havelock → Neil Island",
      headline: "Neil Island discovery",
      overnight: "Neil Island",
      activities: [
        {
          period: "Morning",
          title: "Ferry to Neil Island",
          detail:
            "Early breakfast, then ferry from Havelock to Neil Island. Check in to your hotel and head out for sightseeing.",
          place: null,
        },
        {
          period: "Afternoon",
          title: "Sitapur, Bharatpur & Laxmanpur beaches",
          detail:
            "Explore plantations and tropical forest. Pristine beaches at Sitapur, Bharatpur, and Laxmanpur — sea views and lush greenery.",
          place: place(
            "Bharatpur Beach, Neil Island",
            "Beach",
            11.818,
            93.05,
            IMG.neil,
            4.6,
            4100,
            "Crystal-clear shallows",
          ),
        },
      ],
    },
    {
      dayIndex: 4,
      cityLabel: "Neil → Port Blair",
      headline: "Return to Port Blair",
      overnight: "Port Blair",
      activities: [
        {
          period: "Morning",
          title: "Leisure morning",
          detail: "Morning at leisure on Neil Island — personal time on the beach or at the resort.",
          place: place(
            "Neil Island",
            "Island",
            11.8186,
            93.0419,
            IMG.neil,
            4.5,
            2800,
          ),
        },
        {
          period: "Afternoon",
          title: "Ferry back to Port Blair",
          detail:
            "Transfer to the jetty for the return ferry to Port Blair. On arrival, transfer to your hotel.",
          place: null,
        },
      ],
    },
    {
      dayIndex: 5,
      cityLabel: "Port Blair · Departure",
      headline: "Wandoor & farewell",
      overnight: "Departure",
      activities: [
        {
          period: "Morning",
          title: "Wandoor Beach",
          detail:
            "After breakfast, drive to Wandoor Beach (~30 km) through the tsunami-affected wetlands — birding and coastal scenery.",
          place: place(
            "Wandoor Beach",
            "Beach · Nature",
            11.595,
            92.718,
            IMG.wandoor,
            4.4,
            3600,
            "Mahatma Gandhi Marine Park nearby",
          ),
        },
        {
          period: "Afternoon",
          title: "Airport drop",
          detail:
            "Transfer to Port Blair airport for your onward flight. Return home with memories of a wonderful holiday.",
          place: place(
            "Veer Savarkar International Airport",
            "Airport",
            11.6412,
            92.7297,
            IMG.hero,
            4.2,
            3200,
          ),
        },
      ],
    },
  ],
};
