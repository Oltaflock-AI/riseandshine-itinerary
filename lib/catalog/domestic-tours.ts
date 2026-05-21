import { assemble, day, act, mkFlights, mkHotel, mkIntel, defaultPricingINR, IMG, mkPlace } from "./shared";

const AMD_JAI = mkFlights(
  "AMD ↔ Jaipur",
  "IndiGo (6E)",
  9500,
  { label: "Outbound", route: "AMD → JAI", flights: "6E · 1 stop", dep: "07:30", arr: "10:45", dur: "3h 15m", stops: "1 stop" },
  { label: "Return", route: "JAI → AMD", flights: "6E · 1 stop", dep: "18:20", arr: "21:35", dur: "3h 15m", stops: "1 stop" },
);

export const RAJASTHAN = assemble(
  {
    key: "rajasthan",
    category: "domestic",
    name: "Rajasthan",
    title: "Rajasthan — Jaipur, Bikaner, Jaisalmer, Jodhpur & Udaipur",
    tagline: "Forts, palaces, desert dunes, and the Land of Kings",
    tourName: "Best of Rajasthan",
    durationNights: 8,
    durationDays: 9,
    routeSummary: "Jaipur · Bikaner · Jaisalmer · Jodhpur · Udaipur",
    heroImageUrl: IMG.rajasthan,
    arrivalAirport: "JAI",
    flightRouteLabel: "AMD ↔ Jaipur",
    domestic: true,
  },
  [
    day(0, "Jaipur", "Arrive Jaipur", "Jaipur", [
      act("Afternoon", "Welcome to Best of Rajasthan", "Arrive at Jaipur airport or railway station; meet our representative and transfer to your hotel. Rest of the day at leisure.", mkPlace("Jaipur", "City", 26.9124, 75.7873, IMG.rajasthan, 4.6, 12000, "Pink City")),
    ]),
    day(1, "Jaipur", "Jaipur sightseeing", "Jaipur", [
      act("Morning", "Amer Fort & forts", "Visit Amer Fort (elephant or jeep ride on direct payment), Nahargarh and Jaigarh forts.", mkPlace("Amer Fort", "Fort", 26.9855, 75.8513, IMG.rajasthan, 4.7, 28000)),
      act("Afternoon", "City Palace & Hawa Mahal", "Photo stop at Hawa Mahal, City Palace museums, and Jantar Mantar observatory. Evening at leisure.", mkPlace("Hawa Mahal", "Palace", 26.9239, 75.8267, IMG.rajasthan, 4.6, 22000)),
    ]),
    day(2, "Jaipur → Bikaner", "Drive to Bikaner", "Bikaner", [
      act("Morning", "Jaipur to Bikaner (approximately 6 hours)", "After breakfast, drive to Bikaner (approximately 6 hours). On arrival, check in to your hotel.", null),
      act("Afternoon", "Junagarh Fort", "Visit magnificent Junagarh Fort — among the few major Rajasthan forts not built on a hilltop.", mkPlace("Junagarh Fort", "Fort", 28.0229, 73.3119, IMG.rajasthan, 4.5, 8500)),
    ]),
    day(3, "Bikaner → Jaisalmer", "Karni Mata & Jaisalmer", "Jaisalmer", [
      act("Morning", "Karni Mata Temple", "Visit the famous Karni Mata Temple at Deshnoke before continuing to Jaisalmer.", null),
      act("Evening", "Golden city at leisure", "Arrive in Jaisalmer; evening free to explore the market.", mkPlace("Jaisalmer Fort", "Fort", 26.9157, 70.9083, IMG.rajasthan, 4.7, 15000)),
    ]),
    day(4, "Jaisalmer", "Jaisalmer & Sam dunes", "Jaisalmer", [
      act("Morning", "Living fort & havelis", "Sightseeing of Jaisalmer Fort, Nathmalji ki Haveli, Patwon ki Haveli, Salim Singh ki Haveli, and Gadisar Lake.", mkPlace("Patwon ki Haveli", "Heritage", 26.9157, 70.9122, IMG.rajasthan, 4.6, 9000)),
      act("Afternoon", "Sam sand dunes", "Visit Sam dunes — optional camel ride or jeep safari (direct payment) and sunset views.", mkPlace("Sam Sand Dunes", "Desert", 26.8333, 70.5167, IMG.rajasthan, 4.5, 6000)),
    ]),
    day(5, "Jaisalmer → Jodhpur", "Blue City", "Jodhpur", [
      act("Afternoon", "Mehrangarh & the Blue City", "Drive to Jodhpur; visit Mehrangarh Fort, Jaswant Thada, and the clock tower. Evening at leisure.", mkPlace("Mehrangarh Fort", "Fort", 26.2979, 73.0189, IMG.rajasthan, 4.8, 32000)),
    ]),
    day(6, "Jodhpur → Udaipur", "Ranakpur en route", "Udaipur", [
      act("Morning", "Umaid Bhawan & drive to Udaipur", "Visit Umaid Bhawan Palace, then proceed to Udaipur via Ranakpur Jain Temples.", mkPlace("Ranakpur Temple", "Temple", 25.1167, 73.4667, IMG.rajasthan, 4.7, 11000)),
    ]),
    day(7, "Udaipur", "Udaipur city tour", "Udaipur", [
      act("Full day", "City Palace & lakes", "City Palace, Saheliyon ki Bari, Maharana Pratap Memorial, Jagdish temple, vintage car museum, and lake views.", mkPlace("City Palace Udaipur", "Palace", 24.576, 73.6835, IMG.rajasthan, 4.7, 24000)),
    ]),
    day(8, "Udaipur", "Departure", "Departure", [
      act("Morning", "Airport / station drop", "After breakfast, transfer to Udaipur airport or railway station for your onward journey. Tour ends with happy memories.", null),
    ]),
  ],
  AMD_JAI,
  [
    mkHotel("Clarks Amer", "Jaipur", 2, 5200, 26.9124, 75.7873, IMG.hotel),
    mkHotel("Hotel Lalgarh Palace", "Bikaner", 1, 4800, 28.0229, 73.3119, IMG.hotel),
    mkHotel("Hotel Marina Mahal", "Jaisalmer", 2, 5500, 26.9157, 70.9083, IMG.hotel),
    mkHotel("Indana Palace", "Jodhpur", 1, 5000, 26.2979, 73.0189, IMG.hotel),
    mkHotel("Lake Pichola Hotel", "Udaipur", 2, 6200, 24.576, 73.6835, IMG.hotel),
  ],
  mkIntel(
    ["Book camel safari at Sam in advance in peak season.", "Carry sun protection and comfortable walking shoes for forts."],
    ["Avoid tight connections on long drives between cities."],
    ["Sunset at Sam dunes; Mehrangarh Fort at golden hour."],
  ),
  defaultPricingINR(9500, [
    { nightly: 5200, nights: 2 },
    { nightly: 4800, nights: 1 },
    { nightly: 5500, nights: 2 },
    { nightly: 5000, nights: 1 },
    { nightly: 6200, nights: 2 },
  ], { transfersPerPax: 5500, activitiesPerPax: 4000 }),
);

export const KERALA = assemble(
  {
    key: "kerala",
    category: "domestic",
    name: "Kerala",
    title: "Kerala — Kochi, Munnar, Thekkady, Alleppey & Kovalam",
    tagline: "God's Own Country — hills, wildlife, backwaters, and coast",
    tourName: "Exotic Kerala",
    durationNights: 7,
    durationDays: 8,
    routeSummary: "Kochi · Munnar · Thekkady · Alleppey · Kovalam",
    heroImageUrl: IMG.kerala,
    arrivalAirport: "COK",
    flightRouteLabel: "AMD ↔ Kochi",
    domestic: true,
  },
  [
    day(0, "Kochi", "Arrive Cochin", "Kochi", [
      act("Afternoon", "Welcome to Exotic Kerala", "Arrive at Cochin airport or Ernakulam railway station; transfer to your hotel. Visit St. Francis Church, Mattancherry Palace, Jewish Synagogue, and Chinese fishing nets in Fort Kochi.", mkPlace("Fort Kochi", "Heritage", 9.9658, 76.2422, IMG.kerala, 4.6, 14000)),
    ]),
    day(1, "Kochi → Munnar", "Scenic drive to Munnar", "Munnar", [
      act("Morning", "Cochin to Munnar", "Drive to Munnar (approximately 4 hours); en route, visit Cheeyappara waterfalls. Check in to your hotel; evening at leisure.", mkPlace("Cheeyappara Falls", "Waterfall", 10.0889, 77.0595, IMG.kerala, 4.5, 3200)),
    ]),
    day(2, "Munnar", "Munnar sightseeing", "Munnar", [
      act("Full day", "Tea country & viewpoints", "Old Munnar, Christ Church, Tata Tea Museum (closed Mondays), Mattupetty Lake, and Eco Point.", mkPlace("Mattupetty Dam", "Lake", 10.1052, 77.1234, IMG.kerala, 4.6, 8000)),
    ]),
    day(3, "Munnar → Thekkady", "Spice plantations", "Thekkady", [
      act("Morning", "Drive to Thekkady", "En route spice plantation visit. Afternoon optional Periyar boat ride (direct payment; carry photo ID).", mkPlace("Periyar Wildlife Sanctuary", "Wildlife", 9.6, 77.16, IMG.kerala, 4.5, 12000)),
    ]),
    day(4, "Thekkady → Alleppey", "Backwaters", "Alleppey", [
      act("Afternoon", "Alleppey & beaches", "Drive to Alleppey — Kerala's Venice of the East. Visit Ravi Karunakaran Museum, Mullakkal market and temple; evening at Alleppey beach.", mkPlace("Alleppey Backwaters", "Backwaters", 9.4981, 76.3388, IMG.kerala, 4.7, 16000)),
    ]),
    day(5, "Alleppey → Kovalam", "Coastal Kovalam", "Kovalam", [
      act("Morning", "Drive to Kovalam", "Proceed to Kovalam — Samudra, Kovalam, and Hawa beaches. Check in to your hotel; rest of the day at leisure.", mkPlace("Kovalam Beach", "Beach", 8.3667, 76.9833, IMG.kerala, 4.6, 11000)),
    ]),
    day(6, "Kovalam", "Kanyakumari excursion", "Kovalam", [
      act("Full day", "Day trip to Kanyakumari", "Excursion to Kanyakumari where three seas meet; Vivekananda Rock Memorial and Suchindram temple en route.", mkPlace("Vivekananda Rock", "Memorial", 8.078, 77.541, IMG.kerala, 4.7, 22000)),
    ]),
    day(7, "Kovalam → Trivandrum", "Departure", "Departure", [
      act("Morning", "Transfer to Trivandrum", "Bid farewell to Exotic Kerala; transfer to Trivandrum airport or railway station. Tour concludes with sweet memories.", null),
    ]),
  ],
  mkFlights(
    "AMD ↔ Kochi",
    "IndiGo (6E)",
    12500,
    { label: "Outbound", route: "AMD → COK", flights: "6E · 1 stop", dep: "06:00", arr: "11:40", dur: "5h 40m", stops: "1 stop" },
    { label: "Return", route: "COK → AMD", flights: "6E · 1 stop", dep: "15:00", arr: "20:25", dur: "5h 25m", stops: "1 stop" },
  ),
  [
    mkHotel("Fragrant Nature Kochi", "Kochi", 1, 4500, 9.9658, 76.2422, IMG.hotel),
    mkHotel("Tea County Munnar", "Munnar", 2, 5000, 10.0889, 77.0595, IMG.hotel),
    mkHotel("Cardamom County", "Thekkady", 1, 4800, 9.6, 77.16, IMG.hotel),
    mkHotel("Punnamada Resort", "Alleppey", 1, 5500, 9.4981, 76.3388, IMG.hotel),
    mkHotel("Uday Samudra", "Kovalam", 2, 5200, 8.3667, 76.9833, IMG.hotel),
  ],
  mkIntel(
    ["Carry photo ID for Periyar boat ride.", "Monsoon (Jun–Sep) brings lush scenery but occasional rain."],
    ["Tea Museum closed on Mondays — plan Munnar accordingly."],
    ["Houseboat-style dining in Alleppey; sunset at Kovalam."],
  ),
  defaultPricingINR(12500, [
    { nightly: 4500, nights: 1 },
    { nightly: 5000, nights: 2 },
    { nightly: 4800, nights: 1 },
    { nightly: 5500, nights: 1 },
    { nightly: 5200, nights: 2 },
  ]),
);

export const GOA = assemble(
  {
    key: "goa",
    category: "domestic",
    name: "Goa",
    title: "Goa — Fun in the Sun",
    tagline: "Beaches, resort life, and North Goa sightseeing",
    tourName: "Fun in Goa",
    durationNights: 3,
    durationDays: 4,
    routeSummary: "North Goa · Sukhmantra Resort",
    heroImageUrl: IMG.goa,
    arrivalAirport: "GOI",
    flightRouteLabel: "AMD ↔ Goa",
    domestic: true,
  },
  [
    day(0, "Goa", "Arrive Goa", "Goa", [
      act("Afternoon", "Welcome to Goa", "Arrive at Dabolim airport, Thivim railway station, or Panjim bus stand; transfer to Sukhmantra Resort by hotel AC coach (sharing basis). Rest of day at leisure.", mkPlace("North Goa", "Beach", 15.59, 73.74, IMG.goa, 4.6, 18000)),
    ]),
    day(1, "Goa", "North Goa sightseeing", "Goa", [
      act("Day", "Half-day North Goa tour", "After breakfast or lunch, half-day North Goa sightseeing by hotel courtesy AC coach (sharing basis).", mkPlace("Calangute Beach", "Beach", 15.5439, 73.7553, IMG.goa, 4.5, 14000)),
    ]),
    day(2, "Goa", "Day at leisure", "Goa", [
      act("Full day", "Resort & beaches", "Day at leisure — enjoy resort facilities or explore beaches and markets on your own.", mkPlace("Baga Beach", "Beach", 15.5551, 73.7517, IMG.goa, 4.5, 12000)),
    ]),
    day(3, "Goa", "Departure", "Departure", [
      act("Morning", "Airport drop", "After breakfast, transfer to Dabolim airport or Thivim station for your journey home. Tour ends with happy memories.", null),
    ]),
  ],
  mkFlights(
    "AMD ↔ Goa",
    "IndiGo (6E)",
    11000,
    { label: "Outbound", route: "AMD → GOI", flights: "6E · 1 stop", dep: "08:00", arr: "11:30", dur: "3h 30m", stops: "1 stop" },
    { label: "Return", route: "GOI → AMD", flights: "6E · 1 stop", dep: "16:00", arr: "19:30", dur: "3h 30m", stops: "1 stop" },
  ),
  [mkHotel("Sukhmantra Resort", "North Goa", 3, 4200, 15.59, 73.74, IMG.goa)],
  mkIntel(
    ["Resort coach transfers are on sharing basis — confirm timings at reception."],
    ["Carry light cotton wear; peak sun hours 11am–3pm."],
    ["North Goa beaches and flea markets in Anjuna/Calangute."],
  ),
  defaultPricingINR(11000, [{ nightly: 4200, nights: 3 }], { transfersPerPax: 2000, activitiesPerPax: 1500 }),
);

export const GOLDEN_TRIANGLE = assemble(
  {
    key: "golden-triangle",
    category: "domestic",
    name: "Golden Triangle",
    title: "Golden Triangle — Jaipur, Agra & Delhi",
    tagline: "India's classic circuit — forts, Taj Mahal, and capital sights",
    tourName: "Golden Triangle",
    durationNights: 4,
    durationDays: 5,
    routeSummary: "Jaipur · Agra · Delhi",
    heroImageUrl: IMG.golden,
    arrivalAirport: "JAI",
    flightRouteLabel: "AMD ↔ Jaipur",
    domestic: true,
  },
  [
    day(0, "Jaipur", "Arrive Jaipur", "Jaipur", [
      act("Afternoon", "Welcome — Pink City", "Arrive in Jaipur; meet our representative and transfer to your hotel. Rest of the day at leisure.", mkPlace("Jaipur", "City", 26.9124, 75.7873, IMG.golden, 4.6, 12000)),
    ]),
    day(1, "Jaipur", "Jaipur full day", "Jaipur", [
      act("Full day", "Amer & city icons", "Amer Fort (elephant or jeep ride on direct payment), Nahargarh, photo stop at Hawa Mahal, City Palace, and Jantar Mantar.", mkPlace("Amer Fort", "Fort", 26.9855, 75.8513, IMG.golden, 4.7, 28000)),
    ]),
    day(2, "Jaipur → Agra", "Fatehpur Sikri en route", "Agra", [
      act("Full day", "Drive to Agra", "Proceed to Agra via Fatehpur Sikri. Sightseeing of Agra Fort, Dayal Bagh / Swami Bagh. Evening at leisure.", mkPlace("Taj Mahal", "Monument", 27.1751, 78.0421, IMG.golden, 4.8, 95000)),
    ]),
    day(3, "Agra → Delhi", "Taj Mahal & capital", "Delhi", [
      act("Morning", "Taj Mahal visit", "Visit the Taj Mahal (closed Fridays), then drive to Delhi. Pass India Gate and Parliament (Red Fort closed Mondays). Check in to your hotel.", mkPlace("India Gate", "Landmark", 28.6129, 77.2295, IMG.golden, 4.6, 45000)),
    ]),
    day(4, "Delhi", "Departure", "Departure", [
      act("Morning", "Delhi sights & drop", "Visit Humayun's Tomb, Lotus Temple, and Qutub Minar; transfer to Delhi or Jaipur airport or railway station for your onward connection.", mkPlace("Qutub Minar", "Monument", 28.5244, 77.1855, IMG.golden, 4.6, 38000)),
    ]),
  ],
  AMD_JAI,
  [
    mkHotel("Clarks Amer", "Jaipur", 2, 5200, 26.9124, 75.7873, IMG.hotel),
    mkHotel("Crystal Sarovar", "Agra", 1, 4800, 27.1751, 78.0421, IMG.hotel),
    mkHotel("The Park New Delhi", "Delhi", 1, 5500, 28.6139, 77.209, IMG.hotel),
  ],
  mkIntel(
    ["Taj Mahal closed on Fridays — plan Agra morning accordingly.", "Red Fort and several Delhi sites closed Mondays."],
    ["Start early for Taj to avoid crowds and heat."],
    ["Sunrise view of Taj; Old Delhi street food (veg options)."],
  ),
  defaultPricingINR(9500, [
    { nightly: 5200, nights: 2 },
    { nightly: 4800, nights: 1 },
    { nightly: 5500, nights: 1 },
  ]),
);
