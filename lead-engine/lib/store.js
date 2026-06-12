// Einfacher, abhängigkeitsfreier CRM-Speicher auf Basis einer JSON-Datei.
// Hält die Leads (Betriebe), ihren Pipeline-Status, Notizen und generierte Mails.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const CRM_FILE = join(DATA_DIR, "crm.json");

// Pipeline-Stufen — bewusst nah am Akquise-Alltag gehalten.
export const STAGES = ["neu", "kontaktiert", "antwort", "ki-check", "kunde", "kein-interesse"];

let cache = null;

async function load() {
  if (cache) return cache;
  try {
    const raw = await readFile(CRM_FILE, "utf8");
    cache = JSON.parse(raw);
  } catch {
    cache = { leads: {} }; // leadId -> lead
  }
  return cache;
}

async function persist() {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(CRM_FILE, JSON.stringify(cache, null, 2), "utf8");
}

export async function allLeads() {
  const db = await load();
  return Object.values(db.leads).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
}

export async function getLead(id) {
  const db = await load();
  return db.leads[id] || null;
}

// Speichert / aktualisiert einen Lead. Bestehende CRM-Felder (Status, Notiz, Mail)
// bleiben erhalten, frische Such-Daten werden gemerged.
export async function upsertLead(lead) {
  const db = await load();
  const existing = db.leads[lead.id];
  if (existing) {
    db.leads[lead.id] = {
      ...existing,
      ...lead,
      stage: existing.stage,
      note: existing.note,
      email: existing.email || lead.email,
      generatedMail: existing.generatedMail || lead.generatedMail,
      savedAt: existing.savedAt,
    };
  } else {
    db.leads[lead.id] = {
      stage: "neu",
      note: "",
      generatedMail: null,
      savedAt: Date.now(),
      ...lead,
    };
  }
  await persist();
  return db.leads[lead.id];
}

export async function patchLead(id, patch) {
  const db = await load();
  if (!db.leads[id]) return null;
  db.leads[id] = { ...db.leads[id], ...patch };
  await persist();
  return db.leads[id];
}

export async function removeLead(id) {
  const db = await load();
  delete db.leads[id];
  await persist();
}
