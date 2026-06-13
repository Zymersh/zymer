// Kostenlose Betriebs-Quelle über OpenStreetMap (kein API-Key, keine Kreditkarte).
// Nutzt Nominatim (Stadt -> Koordinaten) + Overpass (Betriebe im Umkreis).
// Hinweis: OSM liefert KEINE Bewertungen — der Aufhänger sind dann die digitalen
// Lücken (keine Website, keine Online-Terminbuchung) statt schlechter Reviews.

const UA = "pluszehn-Lead-Engine/1.0 (Akquise-Tool; kontakt: info@plus-zehn.de)";

// Branche -> passende OSM-Tags (für gezieltere Treffer).
const TAG_MAP = [
  { kw: /sanitär|heizung|installateur/i, tags: ['"craft"="plumber"', '"shop"="hardware"'] },
  { kw: /elektr/i, tags: ['"craft"="electrician"'] },
  { kw: /maler|lackier/i, tags: ['"craft"="painter"'] },
  { kw: /dachdeck/i, tags: ['"craft"="roofer"'] },
  { kw: /schreiner|tischler/i, tags: ['"craft"="carpenter"', '"craft"="joiner"'] },
  { kw: /garten|landschaft|galabau/i, tags: ['"craft"="gardener"', '"shop"="garden_centre"'] },
  { kw: /zahnarzt|dentist/i, tags: ['"amenity"="dentist"', '"healthcare"="dentist"'] },
  { kw: /physio/i, tags: ['"healthcare"="physiotherapist"'] },
  { kw: /hausarzt|arzt|allgemein|medizin/i, tags: ['"amenity"="doctors"', '"healthcare"="doctor"'] },
  { kw: /fitness/i, tags: ['"leisure"="fitness_centre"'] },
  { kw: /kosmetik/i, tags: ['"shop"="beauty"'] },
  { kw: /friseur|frisör|hair/i, tags: ['"shop"="hairdresser"'] },
  { kw: /steuer|kanzlei/i, tags: ['"office"="tax_advisor"', '"office"="accountant"'] },
  { kw: /immobil|makler/i, tags: ['"office"="estate_agent"'] },
  { kw: /kfz|auto|werkstatt/i, tags: ['"shop"="car_repair"', '"shop"="car"'] },
  { kw: /restaurant|gastro/i, tags: ['"amenity"="restaurant"'] },
];

async function geocodeCity(city) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=de&q=${encodeURIComponent(city)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = await res.json();
  if (!data.length) throw new Error(`Stadt "${city}" nicht gefunden`);
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

function buildQuery(branche, lat, lng, radius = 7000) {
  const map = TAG_MAP.find((m) => m.kw.test(branche));
  const around = `(around:${radius},${lat},${lng})`;
  const parts = [];
  if (map) {
    for (const tag of map.tags) parts.push(`nwr[${tag}]${around};`);
  }
  // Zusätzlich Namens-Treffer (falls Tags fehlen / Branche frei eingegeben).
  const kw = branche.split(/\s+/)[0] || branche;
  if (kw) parts.push(`nwr["name"~"${kw}",i]${around};`);
  return `[out:json][timeout:25];(${parts.join("")});out center tags 60;`;
}

function id(el) {
  return "lead_osm_" + el.type[0] + el.id;
}

export async function searchOsm(branche, city) {
  const { lat, lng } = await geocodeCity(city);
  const q = buildQuery(branche || "Betrieb", lat, lng);
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
    body: "data=" + encodeURIComponent(q),
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const data = await res.json();
  const seen = new Set();
  const leads = [];
  for (const el of data.elements || []) {
    const t = el.tags || {};
    if (!t.name) continue;
    const key = t.name + (t["addr:street"] || "");
    if (seen.has(key)) continue;
    seen.add(key);
    const lat2 = el.lat ?? el.center?.lat ?? null;
    const lng2 = el.lon ?? el.center?.lon ?? null;
    const website = t.website || t["contact:website"] || "";
    const email = t.email || t["contact:email"] || "";
    const phone = t.phone || t["contact:phone"] || "";
    const address = [
      [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" "),
      [t["addr:postcode"], t["addr:city"] || city].filter(Boolean).join(" "),
    ].filter(Boolean).join(", ");
    leads.push({
      id: id(el),
      placeId: null,
      name: t.name,
      branche,
      type: t.craft || t.amenity || t.shop || t.office || t.healthcare || branche,
      city,
      address,
      phone,
      website,
      email,
      rating: null, // OSM hat keine Bewertungen
      reviewCount: 0,
      mapsUrl: lat2 != null ? `https://www.openstreetmap.org/${el.type}/${el.id}` : "",
      lat: lat2,
      lng: lng2,
      socials: {},
      reviews: [],
      source: "osm",
    });
  }
  return leads.slice(0, 60);
}
