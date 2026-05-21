import { assemble, day, act, mkFlights, mkHotel, mkIntel, defaultPricingINR, IMG, mkPlace } from "./shared";

const INTL_VISA = {
  type: "Visa assistance available",
  validity: "As per destination",
  processing: "5–15 working days (varies)",
  fee: "Quoted on booking call",
  docs: "Passport (6+ months validity), photos, tickets, hotel vouchers, bank statements as required",
};

export const SINGAPORE_CRUISE = assemble(
  {
    key: "singapore-cruise",
    category: "cruise",
    name: "Singapore with Cruise",
    title: "Singapore with Dream Cruise",
    tagline: "City sights, Sentosa, and high-seas adventure",
    tourName: "Singapore with Cruise",
    durationNights: 6,
    durationDays: 7,
    routeSummary: "Singapore · Dream Cruise (2N)",
    heroImageUrl: IMG.cruise,
    arrivalAirport: "SIN",
    flightRouteLabel: "AMD ↔ Singapore",
    domestic: false,
  },
  [
    day(0, "Singapore", "Arrival & Night Safari", "Singapore", [
      act("Evening", "Arrive Singapore", "Clear immigration and customs; meet our representative and transfer to your hotel. Evening Night Safari — tram ride and Creatures of the Night show.", mkPlace("Night Safari Singapore", "Wildlife", 1.402, 103.789, IMG.cruise, 4.6, 28000)),
    ]),
    day(1, "Singapore", "City & Sentosa", "Singapore", [
      act("Full day", "City tour & Sentosa", "Merlion, Chinatown, Chocolate Factory, Mt. Faber, Little India. Sentosa: S.E.A. Aquarium, Luge, Wings of Time show.", mkPlace("Sentosa Island", "Island", 1.2494, 103.8303, IMG.cruise, 4.7, 45000)),
    ]),
    day(2, "Dream Cruise", "Board cruise", "Dream Cruise", [
      act("Afternoon", "Cruise terminal", "After breakfast, check out and transfer to the cruise terminal. Board Dream Cruise.", mkPlace("Marina Bay Cruise Centre", "Cruise", 1.264, 103.863, IMG.cruise, 4.5, 5000)),
    ]),
    day(3, "Dream Cruise", "High seas", "Dream Cruise", [
      act("Full day", "Onboard activities", "Enjoy meals, shows, games, and activities on board — high-seas sailing.", mkPlace("Dream Cruise", "Cruise ship", 1.2, 104, IMG.cruise, 4.6, 3000)),
    ]),
    day(4, "Singapore", "Return to hotel", "Singapore", [
      act("Afternoon", "Disembark & hotel", "Disembark from the cruise and transfer to your hotel. Day at leisure for shopping or optional tours.", mkPlace("Orchard Road", "Shopping", 1.3048, 103.8318, IMG.cruise, 4.5, 20000)),
    ]),
    day(5, "Singapore", "Universal Studios", "Singapore", [
      act("Full day", "Universal Studios", "Full day at Universal Studios Singapore — movie-themed rides and shows.", mkPlace("Universal Studios Singapore", "Theme park", 1.254, 103.8238, IMG.cruise, 4.7, 55000)),
    ]),
    day(6, "Singapore", "Departure", "Departure", [
      act("Morning", "Airport transfer", "After breakfast, check out and transfer to the airport (please report four hours before your flight).", null),
    ]),
  ],
  mkFlights(
    "AMD ↔ Singapore",
    "Singapore Airlines / IndiGo",
    32000,
    { label: "Outbound", route: "AMD → SIN", flights: "1 stop", dep: "22:00", arr: "07:30", dur: "8h", stops: "1 stop" },
    { label: "Return", route: "SIN → AMD", flights: "1 stop", dep: "09:00", arr: "16:30", dur: "8h", stops: "1 stop" },
  ),
  [
    mkHotel("Hotel Boss Singapore", "Singapore", 3, 9000, 1.3048, 103.8618, IMG.hotel),
    mkHotel("Dream Cruise — Oceanview", "At sea", 2, 11000, 1.2, 104, IMG.cruise),
    mkHotel("Hotel Boss Singapore", "Singapore return", 2, 9000, 1.3048, 103.8618, IMG.hotel),
  ],
  mkIntel(
    ["Singapore visa-free transit for Indian passport holders (conditions apply).", "Cruise sailing dates may shift itinerary order — confirm at booking."],
    ["Book Universal Studios express passes in peak season."],
    ["Wings of Time finale; Marina Bay evening skyline."],
  ),
  defaultPricingINR(32000, [
    { nightly: 9000, nights: 3 },
    { nightly: 11000, nights: 2 },
    { nightly: 9000, nights: 2 },
  ], { transfersPerPax: 3500, activitiesPerPax: 5000 }),
  INTL_VISA,
);

export const SINGAPORE_BALI_CRUISE = assemble(
  {
    key: "singapore-bali-cruise",
    category: "cruise",
    name: "Singapore & Bali with Cruise",
    title: "Singapore, Dream Cruise & Bali",
    tagline: "City, cruise, and Balinese culture in one journey",
    tourName: "Singapore & Bali with Cruise",
    durationNights: 8,
    durationDays: 9,
    routeSummary: "Singapore · Dream Cruise · Bali",
    heroImageUrl: IMG.singaporeBali,
    arrivalAirport: "SIN",
    flightRouteLabel: "AMD ↔ Singapore & Bali",
    domestic: false,
  },
  [
    day(0, "Singapore", "Arrival", "Singapore", [
      act("Evening", "Welcome to Singapore", "Arrive and transfer to your hotel. Evening at leisure to explore nearby malls or local cuisine.", mkPlace("Marina Bay", "City", 1.283, 103.86, IMG.cruise, 4.8, 50000)),
    ]),
    day(1, "Singapore", "City & Night Safari", "Singapore", [
      act("Day", "Half-day city tour", "Merlion, Chinatown, Chocolate Factory, Mt. Faber, Little India.", mkPlace("Merlion Park", "Landmark", 1.2868, 103.8545, IMG.cruise, 4.7, 40000)),
      act("Evening", "Night Safari", "Night Safari with tram adventure and Creatures of the Night show.", mkPlace("Night Safari Singapore", "Wildlife", 1.402, 103.789, IMG.cruise, 4.6, 28000)),
    ]),
    day(2, "Dream Cruise", "Board cruise", "Dream Cruise", [
      act("Afternoon", "Dream Cruise embarkation", "Check out, transfer to the cruise terminal, and board Dream Cruise.", mkPlace("Dream Cruise", "Cruise ship", 1.2, 104, IMG.cruise, 4.6, 3000)),
    ]),
    day(3, "Dream Cruise", "High seas", "Dream Cruise", [
      act("Full day", "At sea", "Breakfast on board; activities, shows, and meals on Dream Cruise.", mkPlace("Dream Cruise", "Cruise ship", 1.2, 104, IMG.cruise, 4.6, 3000)),
    ]),
    day(4, "Singapore", "Sentosa", "Singapore", [
      act("Full day", "Sentosa Island", "Disembark, transfer to your hotel, and check in. Sentosa: S.E.A. Aquarium, Luge, Skyride, and Wings of Time.", mkPlace("S.E.A. Aquarium", "Aquarium", 1.258, 103.82, IMG.cruise, 4.7, 35000)),
    ]),
    day(5, "Singapore → Bali", "Fly to Bali", "Bali", [
      act("Afternoon", "Flight to Bali", "Transfer to the airport and fly to Denpasar. Meet your guide and check in to your hotel. Evening at leisure.", mkPlace("Ubud Rice Terraces", "Nature", -8.5069, 115.2625, IMG.bali, 4.8, 45000)),
    ]),
    day(6, "Bali", "Kintamani & Ubud", "Bali", [
      act("Full day", "Ubud Kintamani tour", "Celuk silver village, Batuan village, Tirta Empul temple, Kintamani volcano and lake views.", mkPlace("Mount Batur", "Volcano", -8.242, 115.375, IMG.bali, 4.7, 22000)),
    ]),
    day(7, "Bali", "Water sports", "Bali", [
      act("Full day", "Beach water sports", "Banana boat, parasailing, and jet ski at the beach. Dinner coupon at a nearby Indian restaurant.", mkPlace("Tanjung Benoa", "Beach", -8.78, 115.22, IMG.bali, 4.6, 8000)),
    ]),
    day(8, "Bali", "Departure", "Departure", [
      act("Morning", "Airport transfer", "After breakfast, check out and transfer to Denpasar airport. The itinerary may change according to cruise sailing dates.", null),
    ]),
  ],
  mkFlights(
    "AMD ↔ Singapore & Bali",
    "Singapore Airlines / Garuda",
    48000,
    { label: "Outbound", route: "AMD → SIN", flights: "1 stop", dep: "22:00", arr: "07:30", dur: "8h", stops: "1 stop" },
    { label: "Return", route: "DPS → AMD", flights: "1–2 stops", dep: "12:00", arr: "22:00", dur: "12h", stops: "via SIN" },
  ),
  [
    mkHotel("Hotel Boss Singapore", "Singapore", 2, 9000, 1.3048, 103.8618, IMG.hotel),
    mkHotel("Dream Cruise", "At sea", 2, 11000, 1.2, 104, IMG.cruise),
    mkHotel("Swiss-Belhotel Tuban", "Kuta/Bali", 1, 7500, -8.7467, 115.168, IMG.hotel),
    mkHotel("Jannata Resort Ubud", "Ubud area", 3, 6800, -8.5069, 115.2625, IMG.bali),
  ],
  mkIntel(
    ["Indonesia visa on arrival for Indian passport holders (fee applies).", "Cruise + flight timings may reorder days — confirm final schedule on booking."],
    ["Respect temple dress code in Bali (sarong often provided)."],
    ["Kintamani volcano view; Bali water sports morning."],
  ),
  defaultPricingINR(48000, [
    { nightly: 9000, nights: 2 },
    { nightly: 11000, nights: 2 },
    { nightly: 7500, nights: 1 },
    { nightly: 6800, nights: 3 },
  ], { transfersPerPax: 4500, activitiesPerPax: 5500 }),
  INTL_VISA,
);