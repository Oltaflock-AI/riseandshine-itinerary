import type { Place } from "@/lib/itinerary/schema";

const KEY = () => process.env.GOOGLE_PLACES_API_KEY || "";
const ENDPOINT = "https://places.googleapis.com/v1/places:searchText";
const FIELDS = [
  "places.displayName", "places.location", "places.rating",
  "places.userRatingCount", "places.priceLevel", "places.types",
  "places.googleMapsUri", "places.photos", "places.editorialSummary",
].join(",");

function photoUrl(name: string): string {
  return `https://places.googleapis.com/v1/${name}/media?maxHeightPx=480&maxWidthPx=720&key=${KEY()}`;
}

async function textSearch(query: string, lat: number, lng: number, n: number): Promise<Place[] | null> {
  if (!KEY()) return null;
  try {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": KEY(),
        "X-Goog-FieldMask": FIELDS,
      },
      body: JSON.stringify({
        textQuery: query,
        locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 20000 } },
        pageSize: Math.min(20, n),
      }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const places: Place[] = (j.places ?? []).map((p: any): Place => {
      const types: string[] = p.types ?? [];
      const cat = types.includes("restaurant")
        ? "Restaurant"
        : (types[0] ?? "Place").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      return {
        name: p.displayName?.text ?? "Unknown",
        category: cat,
        lat: p.location?.latitude ?? lat,
        lng: p.location?.longitude ?? lng,
        rating: p.rating ?? null,
        reviews: p.userRatingCount ?? null,
        priceLevel:
          typeof p.priceLevel === "string"
            ? ["PRICE_LEVEL_FREE", "PRICE_LEVEL_INEXPENSIVE", "PRICE_LEVEL_MODERATE",
               "PRICE_LEVEL_EXPENSIVE", "PRICE_LEVEL_VERY_EXPENSIVE"].indexOf(p.priceLevel)
            : null,
        photoUrl: p.photos?.[0]?.name ? photoUrl(p.photos[0].name) : null,
        mapsUrl: p.googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query=${p.location?.latitude},${p.location?.longitude}`,
        vegFriendly: /veg|jain|indian/i.test(query),
        tag: p.editorialSummary?.text ? String(p.editorialSummary.text).slice(0, 60) : null,
      };
    });
    return places;
  } catch {
    return null;
  }
}

export interface CityPOIs {
  attractions: Place[];
  restaurants: Place[];
  source: "live" | "sample";
}

/** Attractions + diet-aware restaurants around a city centre. */
export async function cityPOIs(
  cityName: string, lat: number, lng: number, diet: string,
): Promise<CityPOIs> {
  const dietWord =
    diet === "jain" ? "Jain vegetarian" :
    diet === "veg" ? "pure vegetarian Indian" :
    diet === "non-veg" ? "popular" : "vegetarian and";

  const [att, rest] = await Promise.all([
    textSearch(`top tourist attractions and monuments in ${cityName}`, lat, lng, 14),
    textSearch(`best ${dietWord} restaurants in ${cityName}`, lat, lng, 12),
  ]);

  if (att && rest) return { attractions: att, restaurants: rest, source: "live" };
  return { ...sampleCity(cityName, lat, lng), source: "sample" };
}

// ── labelled sample fallback (so the app renders before keys are added) ──
function P(name: string, category: string, lat: number, lng: number, rating: number, veg = false, tag: string | null = null): Place {
  return {
    name, category, lat, lng, rating, reviews: null, priceLevel: null,
    photoUrl: null,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    vegFriendly: veg, tag,
  };
}

function sampleCity(cityName: string, lat: number, lng: number): Omit<CityPOIs, "source"> {
  const c = cityName.toLowerCase();
  if (c.includes("bangkok"))
    return {
      attractions: [
        P("Grand Palace & Wat Phra Kaew", "Temple", 13.75, 100.4913, 4.7, false, "modest dress required"),
        P("Wat Arun", "Temple", 13.7437, 100.4889, 4.6, false, "Temple of Dawn"),
        P("Wat Pho (Reclining Buddha)", "Temple", 13.7466, 100.4929, 4.7),
        P("Chatuchak Weekend Market", "Market", 13.7999, 100.5503, 4.5, false, "weekends only"),
        P("Asiatique The Riverfront", "Market", 13.7045, 100.5095, 4.4, false, "evening Ferris wheel"),
        P("Safari World Bangkok", "Theme Park", 13.8615, 100.7045, 4.4, false, "great with kids"),
      ],
      restaurants: [
        P("Saras Indian Vegetarian", "Restaurant", 13.7376, 100.5602, 4.4, true, "Gujarati/South Indian"),
        P("Rajdhani Thali", "Restaurant", 13.7308, 100.5697, 4.3, true, "Jain on request"),
        P("Govinda Italian-Veg", "Restaurant", 13.7197, 100.5662, 4.4, true),
      ],
    };
  if (c.includes("phuket"))
    return {
      attractions: [
        P("Big Buddha Phuket", "Landmark", 7.8276, 98.3119, 4.7, false, "panoramic views"),
        P("Wat Chalong", "Temple", 7.8462, 98.3376, 4.6),
        P("Old Phuket Town", "Heritage", 7.8841, 98.3878, 4.6, false, "Sino-Portuguese lanes"),
        P("Promthep Cape", "Viewpoint", 7.7625, 98.3046, 4.7, false, "best sunset"),
        P("Phi Phi Islands", "Island", 7.7407, 98.7784, 4.6, false, "early speedboat"),
        P("Phang Nga / James Bond Island", "Island", 8.2747, 98.4983, 4.6),
      ],
      restaurants: [
        P("Navrang Mahal Indian Veg", "Restaurant", 7.8918, 98.2967, 4.4, true, "Patong"),
        P("Pure Vegetarian by Tanvee", "Restaurant", 7.8244, 98.3387, 4.3, true, "Jain options"),
        P("Mr. Coffee Veg Kitchen", "Restaurant", 7.8186, 98.3, 4.2, true),
      ],
    };
  // generic
  return {
    attractions: [
      P(`${cityName} City Highlights Tour`, "Sightseeing", lat, lng, 4.5),
      P(`${cityName} Heritage Walk`, "Heritage", lat, lng, 4.4),
      P(`${cityName} Local Market`, "Market", lat, lng, 4.3),
      P(`${cityName} Signature Viewpoint`, "Viewpoint", lat, lng, 4.5),
    ],
    restaurants: [
      P(`${cityName} Pure Veg Restaurant`, "Restaurant", lat, lng, 4.3, true),
      P(`${cityName} Indian Thali House`, "Restaurant", lat, lng, 4.3, true, "Jain on request"),
      P(`${cityName} Family Diner`, "Restaurant", lat, lng, 4.2, true),
    ],
  };
}
