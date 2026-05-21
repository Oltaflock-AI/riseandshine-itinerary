import { assemble, day, act, mkFlights, mkHotel, mkIntel, defaultPricingINR, IMG, mkPlace } from "./shared";

const INTL_VISA = {
  type: "Visa assistance available",
  validity: "As per destination",
  processing: "5–15 working days (varies)",
  fee: "Quoted on booking call",
  docs: "Passport (6+ months validity), photos, tickets, hotel vouchers, bank statements as required",
};

export const THAILAND = assemble(
  {
    key: "thailand",
    category: "international",
    name: "Thailand",
    title: "Thailand — Pattaya & Bangkok",
    tagline: "Beaches, temples, and vibrant city life",
    tourName: "Best of Thailand",
    durationNights: 5,
    durationDays: 6,
    routeSummary: "Pattaya · Bangkok",
    heroImageUrl: IMG.thailand,
    arrivalAirport: "BKK",
    flightRouteLabel: "AMD ↔ Bangkok",
    domestic: false,
  },
  [
    day(0, "Bangkok / Pattaya", "Arrival", "Pattaya", [
      act("Evening", "Arrive & transfer to Pattaya", "Arrive in Bangkok; transfer to Pattaya (approximately 2.5 hours, seat-in-coach). Optional Alcazar Cabaret Show (at your own expense). Dinner and overnight.", mkPlace("Pattaya Beach", "Beach", 12.9236, 100.8825, IMG.thailand, 4.5, 15000)),
    ]),
    day(1, "Pattaya", "Coral Island", "Pattaya", [
      act("Full day", "Coral Island tour with lunch", "Speedboat to Koh Larn — snorkelling, parasailing (optional), and lunch on the island. Optional Pattaya Tower (at your own expense).", mkPlace("Coral Island", "Island", 12.9167, 100.7833, IMG.thailand, 4.6, 11000)),
    ]),
    day(2, "Pattaya", "Day at leisure", "Pattaya", [
      act("Full day", "Leisure or optional tours", "Optional Nong Nooch Village or Ripley's Believe It or Not (at your own expense). Beach time and local cuisine.", mkPlace("Nong Nooch Garden", "Garden", 12.7667, 100.9333, IMG.thailand, 4.5, 8000)),
    ]),
    day(3, "Pattaya → Bangkok", "Temples & gems", "Bangkok", [
      act("Full day", "Return to Bangkok", "Drive back to Bangkok; Gems Gallery en route. Half-day Wat Pho (Reclining Buddha). Optional Madame Tussauds (at your own expense).", mkPlace("Wat Pho", "Temple", 13.7465, 100.493, IMG.thailand, 4.7, 42000)),
    ]),
    day(4, "Bangkok", "Day at leisure", "Bangkok", [
      act("Full day", "Safari World or floating markets", "Optional Safari World & Marine Park or Damnoen Saduak floating market (at your own expense).", mkPlace("Grand Palace area", "Temple", 13.75, 100.4913, IMG.thailand, 4.6, 55000)),
    ]),
    day(5, "Bangkok", "Departure", "Departure", [
      act("Morning", "Airport transfer", "Breakfast and seat-in-coach transfer to Bangkok International Airport for your flight home.", null),
    ]),
  ],
  mkFlights(
    "AMD ↔ Bangkok",
    "IndiGo / Thai Airways",
    28000,
    { label: "Outbound", route: "AMD → BKK", flights: "1 stop", dep: "21:30", arr: "06:15", dur: "7h 15m", stops: "1 stop" },
    { label: "Return", route: "BKK → AMD", flights: "1 stop", dep: "08:00", arr: "14:30", dur: "7h 30m", stops: "1 stop" },
  ),
  [
    mkHotel("Centara Pattaya", "Pattaya", 3, 5500, 12.9236, 100.8825, IMG.hotel),
    mkHotel("Novotel Bangkok", "Bangkok", 2, 6200, 13.7563, 100.5018, IMG.hotel),
  ],
  mkIntel(
    ["Thailand visa on arrival / e-visa rules vary by nationality — confirm before travel.", "Respect temple dress codes (covered shoulders and knees)."],
    ["Scams around Grand Palace — use official entrances only."],
    ["Coral Island morning visit; Wat Pho Thai massage."],
  ),
  defaultPricingINR(28000, [
    { nightly: 5500, nights: 3 },
    { nightly: 6200, nights: 2 },
  ], { transfersPerPax: 4000, activitiesPerPax: 4500 }),
  INTL_VISA,
);

export const MAURITIUS = assemble(
  {
    key: "mauritius",
    category: "international",
    name: "Mauritius",
    title: "Mauritius — Indian Ocean escape",
    tagline: "Lagoons, botanical gardens, and island tours",
    tourName: "Magical Mauritius",
    durationNights: 6,
    durationDays: 7,
    routeSummary: "North · South · Île aux Cerfs",
    heroImageUrl: IMG.mauritius,
    arrivalAirport: "MRU",
    flightRouteLabel: "AMD ↔ Mauritius",
    domestic: false,
  },
  [
    day(0, "Mauritius", "Arrival", "Mauritius", [
      act("Evening", "Welcome to Mauritius", "Arrive at Mauritius airport; meet our representative and transfer to your hotel. Evening at leisure — explore nearby beaches.", mkPlace("Mauritius Coast", "Beach", -20.0136, 57.5806, IMG.mauritius, 4.7, 8000)),
    ]),
    day(1, "North Island", "North tour", "Mauritius", [
      act("Full day", "North Island tour", "Port Louis, Champ de Mars, Caudan Waterfront, Pamplemousses Botanical Gardens (entry own cost), duty-free stop.", mkPlace("Port Louis", "City", -20.1609, 57.5012, IMG.mauritius, 4.5, 5000)),
    ]),
    day(2, "Mauritius", "Leisure day", "Mauritius", [
      act("Full day", "Beach & water sports", "Day at leisure — relax at hotel or optional water sports at the beach.", mkPlace("Trou aux Biches", "Beach", -20.0333, 57.55, IMG.mauritius, 4.6, 3500)),
    ]),
    day(3, "Île aux Cerfs", "Island day", "Mauritius", [
      act("Full day", "Île aux Cerfs", "Speedboat to Île aux Cerfs — swimming and optional water sports (at your own expense). Carry swimwear, a towel, and sunscreen.", mkPlace("Île aux Cerfs", "Island", -20.2744, 57.8036, IMG.mauritius, 4.8, 12000)),
    ]),
    day(4, "Mauritius", "Optional catamaran", "Mauritius", [
      act("Full day", "Leisure or catamaran cruise", "Day at leisure, or optional full-day catamaran cruise (approximately ₹3,000 per person extra).", null),
    ]),
    day(5, "South Island", "South tour", "Mauritius", [
      act("Full day", "South Island tour", "Glass gallery, Floreal, Trou aux Cerfs crater, Grand Bassin, Chamarel seven-coloured earth, Gris-Gris coastline.", mkPlace("Chamarel Seven Coloured Earth", "Nature", -20.44, 57.39, IMG.mauritius, 4.7, 9000)),
    ]),
    day(6, "Mauritius", "Departure", "Departure", [
      act("Morning", "Airport transfer", "Breakfast, check out, and transfer to airport for your flight home.", null),
    ]),
  ],
  mkFlights(
    "AMD ↔ Mauritius",
    "Air Mauritius / IndiGo",
    45000,
    { label: "Outbound", route: "AMD → MRU", flights: "1 stop", dep: "23:30", arr: "08:10", dur: "11h 10m", stops: "1 stop" },
    { label: "Return", route: "MRU → AMD", flights: "1 stop", dep: "11:30", arr: "00:40", dur: "10h 40m", stops: "1 stop · next day" },
  ),
  [mkHotel("Outrigger Mauritius", "East Coast", 6, 8500, -20.3, 57.7, IMG.hotel)],
  mkIntel(
    ["Mauritius visa-free for Indian passport holders (conditions apply — verify before travel).", "Drive on the left; book tours through desk for best rates."],
    ["Peak sun at midday — plan beach time morning/evening."],
    ["Île aux Cerfs; Chamarel waterfalls and coloured earth."],
  ),
  defaultPricingINR(45000, [{ nightly: 8500, nights: 6 }]),
  INTL_VISA,
);

export const HONG_KONG = assemble(
  {
    key: "hong-kong",
    category: "international",
    name: "Hong Kong",
    title: "Hong Kong, Macau & Shenzhen",
    tagline: "Skyscrapers, heritage, and cross-border discovery",
    tourName: "Majestic Hong Kong & Macau with Shenzhen",
    durationNights: 7,
    durationDays: 8,
    routeSummary: "Macau · Hong Kong · Shenzhen",
    heroImageUrl: IMG.hongkong,
    arrivalAirport: "HKG",
    flightRouteLabel: "AMD ↔ Hong Kong",
    domestic: false,
  },
  [
    day(0, "Macau", "Arrive via Hong Kong", "Macau", [
      act("Evening", "Ferry to Macau", "Arrive in Hong Kong; proceed to Sky Pier for the turbo jet to Macau. Shuttle to your hotel. Evening at leisure.", mkPlace("Macau Skyline", "City", 22.1987, 113.5439, IMG.hongkong, 4.6, 15000)),
    ]),
    day(1, "Macau", "Macau city tour", "Macau", [
      act("Full day", "Macau heritage tour with lunch", "Kun Iam statue, A-Ma Temple, Ruins of St. Paul's, Fisherman's Wharf. Indian lunch included.", mkPlace("Ruins of St. Paul's", "Heritage", 22.1978, 113.5409, IMG.hongkong, 4.7, 35000)),
    ]),
    day(2, "Macau → Hong Kong", "Ferry to Hong Kong", "Hong Kong", [
      act("Afternoon", "Transfer to Hong Kong", "After breakfast, check out, take the ferry to Hong Kong, and transfer to your hotel (seat-in-coach).", mkPlace("Victoria Harbour", "Harbour", 22.2864, 114.1589, IMG.hongkong, 4.8, 42000)),
    ]),
    day(3, "Hong Kong", "City tour", "Hong Kong", [
      act("Full day", "Panoramic city tour", "Victoria Peak, Sky 100, Peak Tram, Madame Tussauds, Aberdeen fishing village, jewellery factory.", mkPlace("Victoria Peak", "Viewpoint", 22.271, 114.1499, IMG.hongkong, 4.7, 28000)),
    ]),
    day(4, "Hong Kong", "Leisure / Ocean Park", "Hong Kong", [
      act("Full day", "Optional Ocean Park", "Day at leisure, or optional Ocean Park (at your own expense).", mkPlace("Ocean Park Hong Kong", "Theme park", 22.246, 114.174, IMG.hongkong, 4.5, 18000)),
    ]),
    day(5, "Hong Kong → Shenzhen", "Cross to Shenzhen", "Shenzhen", [
      act("Afternoon", "Train to Shenzhen", "Check out and transfer to the train station (around 10:00 AM). Meet your guide in Shenzhen, check in to your hotel, and receive dinner coupons.", mkPlace("Shenzhen", "City", 22.5431, 114.0579, IMG.hongkong, 4.4, 8000)),
    ]),
    day(6, "Shenzhen", "Shenzhen city tour", "Shenzhen", [
      act("Full day", "City tour with lunch", "Lotus Park, Mineral Museum, Window of the World (entrance included). Indian lunch.", mkPlace("Window of the World", "Theme park", 22.54, 113.97, IMG.hongkong, 4.5, 12000)),
    ]),
    day(7, "Departure", "Ferry to airport", "Departure", [
      act("Morning", "Homeward bound", "Breakfast, check out, ferry to Hong Kong International Airport for onward flight. Itinerary may adjust per flight timings.", null),
    ]),
  ],
  mkFlights(
    "AMD ↔ Hong Kong",
    "Cathay Pacific / IndiGo",
    42000,
    { label: "Outbound", route: "AMD → HKG", flights: "1 stop", dep: "01:00", arr: "09:30", dur: "7h 30m", stops: "1 stop" },
    { label: "Return", route: "HKG → AMD", flights: "1 stop", dep: "14:00", arr: "22:00", dur: "7h", stops: "1 stop" },
  ),
  [
    mkHotel("Sheraton Macau", "Macau", 2, 7500, 22.1987, 113.5439, IMG.hotel),
    mkHotel("Harbour Plaza HK", "Hong Kong", 3, 8200, 22.2864, 114.1589, IMG.hotel),
    mkHotel("Hyatt Regency Shenzhen", "Shenzhen", 2, 6500, 22.5431, 114.0579, IMG.hotel),
  ],
  mkIntel(
    ["Hong Kong/Macau visa rules for Indian travellers — confirm before booking.", "Octopus card useful for MTR in Hong Kong."],
    ["Heavy walking at Window of the World — wear comfortable shoes."],
    ["Victoria Peak at dusk; Macau Portuguese egg tarts."],
  ),
  defaultPricingINR(42000, [
    { nightly: 7500, nights: 2 },
    { nightly: 8200, nights: 3 },
    { nightly: 6500, nights: 2 },
  ]),
  INTL_VISA,
);

export const MAURITIUS_DUBAI = assemble(
  {
    key: "mauritius-dubai",
    category: "international",
    name: "Mauritius & Dubai",
    title: "Mauritius & Dubai — twin paradise",
    tagline: "Island calm meets desert glamour",
    tourName: "Peaceful Mauritius with Dubai",
    durationNights: 7,
    durationDays: 8,
    routeSummary: "Mauritius · Dubai",
    heroImageUrl: IMG.mauritiusDubai,
    arrivalAirport: "MRU",
    flightRouteLabel: "AMD ↔ Mauritius & Dubai",
    domestic: false,
  },
  [
    day(0, "Mauritius", "Arrive Mauritius", "Mauritius", [
      act("Evening", "Island welcome", "Arrive in Mauritius and transfer to your hotel. Evening at leisure on the beach.", mkPlace("Mauritius", "Beach", -20.0136, 57.5806, IMG.mauritius, 4.7, 8000)),
    ]),
    day(1, "Mauritius", "North tour", "Mauritius", [
      act("Full day", "North Island tour", "Port Louis, colonial avenues, Caudan Waterfront, and botanical gardens (entry at your own expense).", mkPlace("Port Louis", "City", -20.1609, 57.5012, IMG.mauritius, 4.5, 5000)),
    ]),
    day(2, "Mauritius", "South tour", "Mauritius", [
      act("Full day", "South Island tour", "Glass gallery, Trou aux Cerfs, Grand Bassin, Chamarel coloured earth.", mkPlace("Grand Bassin", "Temple", -20.425, 57.491, IMG.mauritius, 4.6, 6000)),
    ]),
    day(3, "Mauritius", "Île aux Cerfs", "Mauritius", [
      act("Full day", "Île aux Cerfs excursion", "East coast lagoon day with speedboat; optional water sports. Carry swimwear and sunscreen.", mkPlace("Île aux Cerfs", "Island", -20.2744, 57.8036, IMG.mauritius, 4.8, 12000)),
    ]),
    day(4, "Mauritius → Dubai", "Fly to Dubai", "Dubai", [
      act("Evening", "Mauritius to Dubai", "Morning at leisure; flight to Dubai. Meet our representative and check in to your hotel (standard check-in from 2:00 PM).", mkPlace("Dubai Marina", "City", 25.08, 55.14, IMG.mauritiusDubai, 4.7, 25000)),
    ]),
    day(5, "Dubai", "City & desert safari", "Dubai", [
      act("Full day", "City tour & desert safari", "Half-day city tour: Palm Jumeirah photo stop, Jumeirah Mosque, Sheikh Zayed Road, Dubai Museum, and gold and spice souks. Evening desert safari with barbecue dinner and belly dance.", mkPlace("Burj Khalifa views", "Landmark", 25.1972, 55.2744, IMG.mauritiusDubai, 4.8, 90000)),
    ]),
    day(6, "Dubai", "Dhow cruise", "Dubai", [
      act("Evening", "Dhow cruise dinner", "Morning at leisure for shopping (Dubai Mall or souks). Evening dhow cruise on Dubai Marina with buffet dinner.", mkPlace("Dubai Creek", "Harbour", 25.2631, 55.2972, IMG.mauritiusDubai, 4.6, 35000)),
    ]),
    day(7, "Dubai", "Departure", "Departure", [
      act("Morning", "Airport transfer", "After breakfast, check out and transfer to the airport. Your vacation ends with wonderful memories.", null),
    ]),
  ],
  mkFlights(
    "AMD ↔ Mauritius & Dubai",
    "Emirates / Air Mauritius",
    52000,
    { label: "Outbound", route: "AMD → MRU", flights: "Multi-city", dep: "23:00", arr: "08:00", dur: "11h", stops: "1 stop" },
    { label: "Return", route: "DXB → AMD", flights: "Multi-city", dep: "10:00", arr: "18:30", dur: "7h", stops: "Direct / 1 stop" },
  ),
  [
    mkHotel("Outrigger Mauritius", "Mauritius", 4, 8500, -20.3, 57.7, IMG.hotel),
    mkHotel("Rove Downtown Dubai", "Dubai", 3, 9500, 25.1972, 55.2744, IMG.hotel),
  ],
  mkIntel(
    ["UAE visa for Indian passport holders — often visa on arrival or pre-arranged; confirm with desk.", "Friday is weekend in UAE — check attraction hours."],
    ["Desert safari includes dune bashing — not ideal for very young children or motion sensitivity."],
    ["Dubai Mall fountain show; Mauritius east coast sunrise."],
  ),
  defaultPricingINR(52000, [
    { nightly: 8500, nights: 4 },
    { nightly: 9500, nights: 3 },
  ], { transfersPerPax: 5000, activitiesPerPax: 5500 }),
  INTL_VISA,
);
