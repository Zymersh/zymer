// pluszehn Lead-Engine — abhängigkeitsfreier Node-Server (nur `node server.js`).
// Branche + Stadt -> Betriebe von Google Maps -> Website-Anreicherung ->
// Bewertungen lesen + Schmerzpunkte -> personalisierte Akquise-Mail -> CRM.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import { searchBusinesses, hasGoogleKey } from "./lib/places.js";
import { enrichLead } from "./lib/enrich.js";
import { analyzePain, generateMessage } from "./lib/analyze.js";
import { scoreLead } from "./lib/score.js";
import * as store from "./lib/store.js";
import { company, solutions, targetBranchen, regionCities } from "./config/pluszehn.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "public");
const PORT = process.env.PORT || 4010;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function json(res, code, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
  res.end(body);
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

async function serveStatic(req, res) {
  let path = req.url.split("?")[0];
  if (path === "/") path = "/index.html";
  const safe = normalize(path).replace(/^(\.\.[/\\])+/, "");
  const file = join(PUBLIC_DIR, safe);
  if (!file.startsWith(PUBLIC_DIR)) return json(res, 403, { error: "forbidden" });
  try {
    const data = await readFile(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch {
    json(res, 404, { error: "not found" });
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    // --- API ----------------------------------------------------------------
    if (path === "/api/config" && req.method === "GET") {
      return json(res, 200, {
        company,
        solutions,
        branchen: targetBranchen,
        cities: regionCities,
        modes: { google: hasGoogleKey(), claude: Boolean(process.env.ANTHROPIC_API_KEY) },
      });
    }

    // Suche: (mehrere) Städte, Quelle wählbar, schwache filtern, scoren, sortieren.
    if (path === "/api/search" && req.method === "POST") {
      const { branche, city, filter, source } = await readBody(req);

      // Mehrere Städte: durch Komma getrennt (z. B. "Bühl, Achern, Rastatt").
      const cities = String(city || "")
        .split(",").map((s) => s.trim()).filter(Boolean);
      const cityList = cities.length ? cities : [""];

      // Aus allen Städten zusammentragen, Dubletten per ID entfernen.
      const byId = new Map();
      for (const c of cityList) {
        const part = await searchBusinesses(branche || "", c, source || "auto");
        for (const l of part) if (!byId.has(l.id)) byId.set(l.id, l);
      }
      const raw = [...byId.values()];

      // Top-Bewertungen rausfiltern (Betriebe ohne Bewertung – z. B. OSM – bleiben).
      const maxRating = filter === "sehrschwach" ? 3.5 : 99;
      const kept =
        filter === "alle"
          ? raw
          : raw.filter((l) => l.rating == null || l.rating <= (filter === "sehrschwach" ? 3.5 : 4.2));

      // Anreichern, analysieren, Schmerz-Score berechnen.
      const savedById = new Map((await store.allLeads()).map((l) => [l.id, l]));
      const results = [];
      for (const lead of kept) {
        const contact = await enrichLead(lead);
        if (contact.emails?.length) lead.email = contact.emails[0];
        lead.emails = contact.emails || [];
        if (contact.phones?.length && !lead.phone) lead.phone = contact.phones[0];
        lead.socials = { ...(lead.socials || {}), ...(contact.socials || {}) };
        lead.webGaps = contact.webGaps || [];
        lead.pain = analyzePain(lead);
        Object.assign(lead.pain, scoreLead(lead, lead.pain)); // score, tier, weaknesses, trend
        const saved = savedById.get(lead.id);
        lead.inCrm = Boolean(saved);
        lead.crmStage = saved?.stage || null;
        results.push(lead);
      }

      // Heißeste Leads zuerst.
      results.sort((a, b) => (b.pain.score || 0) - (a.pain.score || 0));
      return json(res, 200, { count: results.length, total: raw.length, leads: results });
    }

    // CSV-Export der CRM-Leads.
    if (path === "/api/export.csv" && req.method === "GET") {
      const leads = await store.allLeads();
      const head = ["Name", "Branche", "Stadt", "Adresse", "Telefon", "E-Mail", "Bewertung", "Score", "Status", "Notiz", "Website"];
      const rows = leads.map((l) => [
        l.name, l.branche || l.type, l.city, l.address, l.phone, l.email,
        l.rating ?? "", l.pain?.score ?? "", l.stage, (l.note || "").replace(/\n/g, " "), l.website,
      ]);
      const csv = [head, ...rows]
        .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";"))
        .join("\r\n");
      res.writeHead(200, {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="pluszehn-leads.csv"',
      });
      return res.end("﻿" + csv); // BOM, damit Excel Umlaute korrekt zeigt
    }

    // Botschaft (Mail/Kurz/Anruf/WhatsApp/Nachfass) für einen Betrieb erzeugen.
    if (path === "/api/generate" && req.method === "POST") {
      const { lead, type } = await readBody(req);
      if (!lead) return json(res, 400, { error: "lead fehlt" });
      const pain = lead.pain || analyzePain(lead);
      const email = await generateMessage(lead, pain, type || "email");
      return json(res, 200, { pain, email });
    }

    // CRM: alle Leads.
    if (path === "/api/crm" && req.method === "GET") {
      return json(res, 200, { leads: await store.allLeads(), stages: store.STAGES });
    }

    // CRM: Lead speichern / aktualisieren.
    if (path === "/api/lead" && req.method === "POST") {
      const { lead } = await readBody(req);
      if (!lead?.id) return json(res, 400, { error: "lead.id fehlt" });
      const saved = await store.upsertLead(lead);
      return json(res, 200, { lead: saved });
    }

    // CRM: Lead patchen (Status, Notiz, Mail) — /api/lead/<id>
    const leadMatch = path.match(/^\/api\/lead\/([^/]+)$/);
    if (leadMatch && req.method === "PATCH") {
      const patch = await readBody(req);
      // Beim Wechsel auf "kontaktiert" den Zeitpunkt merken (für Nachfass-Erinnerung).
      if (patch.stage === "kontaktiert") {
        const cur = await store.getLead(leadMatch[1]);
        if (cur && !cur.contactedAt) patch.contactedAt = Date.now();
      }
      const updated = await store.patchLead(leadMatch[1], patch);
      if (!updated) return json(res, 404, { error: "lead nicht gefunden" });
      return json(res, 200, { lead: updated });
    }
    if (leadMatch && req.method === "DELETE") {
      await store.removeLead(leadMatch[1]);
      return json(res, 200, { ok: true });
    }

    // CRM: Botschaft für einen gespeicherten Lead erzeugen + ablegen.
    const genMatch = path.match(/^\/api\/lead\/([^/]+)\/email$/);
    if (genMatch && req.method === "POST") {
      const { type } = await readBody(req);
      const lead = await store.getLead(genMatch[1]);
      if (!lead) return json(res, 404, { error: "lead nicht gefunden" });
      const pain = lead.pain || analyzePain(lead);
      const email = await generateMessage(lead, pain, type || "email");
      // Nur die Standard-Mail dauerhaft als Entwurf merken.
      const patch = (type && type !== "email") ? {} : { generatedMail: email };
      const saved = await store.patchLead(lead.id, patch);
      return json(res, 200, { lead: saved, email });
    }

    if (path.startsWith("/api/")) return json(res, 404, { error: "unbekannte Route" });

    // --- Static -------------------------------------------------------------
    return await serveStatic(req, res);
  } catch (err) {
    console.error("Fehler:", err);
    return json(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  const g = hasGoogleKey() ? "Google Maps (live)" : "Demo-Daten (kein GOOGLE_MAPS_API_KEY)";
  const c = process.env.ANTHROPIC_API_KEY ? "Claude (live)" : "Vorlagen-Mails (kein ANTHROPIC_API_KEY)";
  console.log(`\n  +z  pluszehn Lead-Engine`);
  console.log(`  ──────────────────────────────`);
  console.log(`  Läuft auf:   http://localhost:${PORT}`);
  console.log(`  Betriebe:    ${g}`);
  console.log(`  Mails:       ${c}\n`);
});
