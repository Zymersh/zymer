// Betriebe von Google Maps ziehen — inkl. Adresse, Telefon, Website, Bewertungen.
// Nutzt die Google Places API (New). Ohne API-Key fällt alles automatisch auf
// realistische Demo-Daten aus der Region Bühl zurück, damit das Tool sofort läuft.

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY = process.env.GOOGLE_MAPS_API_KEY || "";

// Stabile, deterministische ID aus dem Place-Namen + Adresse, damit ein Betrieb
// im CRM wiedererkannt wird, auch wenn Google mal keine place_id liefert.
function makeId(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return "lead_" + (h >>> 0).toString(36);
}

export function hasGoogleKey() {
  return Boolean(KEY);
}

// --- Live-Modus: Google Places API (New) -----------------------------------

async function searchGoogle(branche, city) {
  const body = {
    textQuery: `${branche} in ${city}`,
    languageCode: "de",
    regionCode: "DE",
    maxResultCount: 20,
  };
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY,
      // 30+ Felder möglich — wir holen genau das, was die Akquise braucht.
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.internationalPhoneNumber",
        "places.nationalPhoneNumber",
        "places.websiteUri",
        "places.rating",
        "places.userRatingCount",
        "places.googleMapsUri",
        "places.primaryTypeDisplayName",
        "places.location",
        "places.reviews",
      ].join(","),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Google Places ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  const places = data.places || [];
  return places.map((p) => {
    const name = p.displayName?.text || "Unbekannt";
    const address = p.formattedAddress || "";
    return {
      id: p.id ? "lead_" + p.id : makeId(name + address),
      placeId: p.id || null,
      name,
      branche,
      city,
      address,
      phone: p.internationalPhoneNumber || p.nationalPhoneNumber || "",
      website: p.websiteUri || "",
      rating: p.rating || null,
      reviewCount: p.userRatingCount || 0,
      mapsUrl: p.googleMapsUri || "",
      type: p.primaryTypeDisplayName?.text || branche,
      lat: p.location?.latitude ?? null,
      lng: p.location?.longitude ?? null,
      // Bis zu 5 Bewertungen liefert die API direkt mit; Text in Originalsprache.
      reviews: (p.reviews || [])
        .map((r) => ({
          rating: r.rating || null,
          text: r.originalText?.text || r.text?.text || "",
          time: r.relativePublishTimeDescription || "",
        }))
        .filter((r) => r.text),
      source: "google",
    };
  });
}

// --- Demo-Modus: gebündelte Region-Bühl-Daten ------------------------------

let demoCache = null;
async function loadDemo() {
  if (demoCache) return demoCache;
  const raw = await readFile(join(__dirname, "..", "data", "demo-leads.json"), "utf8");
  demoCache = JSON.parse(raw);
  return demoCache;
}

function norm(s) {
  return (s || "").toLowerCase();
}

async function searchDemo(branche, city) {
  const all = await loadDemo();
  const b = norm(branche);
  const c = norm(city);
  // Lockeres Matching: Branche ODER Stadt muss passen, sonst zeigen wir eine
  // gemischte Auswahl, damit die Demo nie leer ist.
  let hits = all.filter((l) => {
    const matchBranche = b && (norm(l.branche).includes(b) || b.includes(norm(l.branche)) || norm(l.type).includes(b));
    const matchCity = c && norm(l.city).includes(c);
    if (b && c) return matchBranche && matchCity;
    if (b) return matchBranche;
    if (c) return matchCity;
    return true;
  });
  if (hits.length === 0) hits = all.slice(0, 8);
  // Frische IDs/Branche/Stadt setzen, damit das CRM konsistent bleibt.
  return hits.map((l) => ({ ...l, branche: branche || l.branche, city: city || l.city, source: "demo" }));
}

// --- Öffentliche Schnittstelle ---------------------------------------------

export async function searchBusinesses(branche, city) {
  if (KEY) {
    return await searchGoogle(branche, city);
  }
  return await searchDemo(branche, city);
}
