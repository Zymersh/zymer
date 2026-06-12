// Das Herzstück: Google-Bewertungen lesen → echte Schmerzpunkte herausziehen →
// mit pluszehns Angebot abgleichen → eine personalisierte Akquise-Mail erzeugen.
//
// Funktioniert komplett offline (heuristisch). Liegt ein ANTHROPIC_API_KEY vor,
// schreibt Claude die Mail individuell pro Betrieb.

import { company, solutions, defaultSolutionOrder } from "../config/pluszehn.js";

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

function norm(s) {
  return (s || "").toLowerCase();
}

// --- Schritt 1: Schmerzpunkte aus den Bewertungen ziehen --------------------

export function analyzePain(lead) {
  const reviews = lead.reviews || [];
  const lowStars = reviews.filter((r) => (r.rating || 5) <= 3);
  const haystack = norm(reviews.map((r) => r.text).join("  ||  "));

  const matches = []; // { solutionId, signal, snippet, rating }
  for (const sol of solutions) {
    for (const signal of sol.painSignals) {
      if (haystack.includes(signal)) {
        // Den Satz finden, in dem das Signal vorkommt — als Beleg-Zitat.
        const review =
          reviews.find((r) => norm(r.text).includes(signal)) || null;
        matches.push({
          solutionId: sol.id,
          signal,
          snippet: review ? shortenAroundSignal(review.text, signal) : "",
          rating: review ? review.rating : null,
        });
      }
    }
  }

  // Welche Lösung passt am besten? Die mit den meisten Treffern.
  const scoreById = {};
  for (const m of matches) scoreById[m.solutionId] = (scoreById[m.solutionId] || 0) + 1;

  let bestSolutionId = null;
  let bestScore = 0;
  for (const [id, score] of Object.entries(scoreById)) {
    if (score > bestScore) {
      bestScore = score;
      bestSolutionId = id;
    }
  }
  // Kein konkreter Treffer: nach Branche/Standard die naheliegendste Lösung.
  if (!bestSolutionId) bestSolutionId = fallbackSolution(lead);

  // Bis zu 3 Beleg-Zitate, dedupliziert.
  const seen = new Set();
  const evidence = [];
  for (const m of matches) {
    if (!m.snippet) continue;
    const key = m.snippet.slice(0, 40);
    if (seen.has(key)) continue;
    seen.add(key);
    evidence.push({ text: m.snippet, rating: m.rating });
    if (evidence.length >= 3) break;
  }

  const bestSolution = solutions.find((s) => s.id === bestSolutionId);
  return {
    bestSolutionId,
    bestSolution,
    confidence: bestScore > 0 ? "konkret" : "branchenbasiert",
    signalCount: matches.length,
    lowStarCount: lowStars.length,
    evidence,
  };
}

function fallbackSolution(lead) {
  const b = norm(lead.branche + " " + lead.type);
  // Belegstapel-Branchen → Rechnungen; sonst Standardreihenfolge (Telefon zuerst).
  if (/steuer|kanzlei|immobilien|autohaus|kfz/.test(b)) return "rechnungen";
  return defaultSolutionOrder[0];
}

function shortenAroundSignal(text, signal) {
  const t = text.replace(/\s+/g, " ").trim();
  const i = norm(t).indexOf(signal);
  if (i < 0) return t.slice(0, 160);
  const start = Math.max(0, i - 60);
  const end = Math.min(t.length, i + signal.length + 80);
  return (start > 0 ? "… " : "") + t.slice(start, end).trim() + (end < t.length ? " …" : "");
}

// --- Schritt 2: Personalisierte Akquise-Mail --------------------------------

export async function generateEmail(lead, pain) {
  if (ANTHROPIC_KEY) {
    try {
      return await generateWithClaude(lead, pain);
    } catch (err) {
      // Bei API-Problemen still auf die Vorlage zurückfallen — nie blockieren.
      return { ...heuristicEmail(lead, pain), warning: "Claude nicht erreichbar — Vorlage genutzt: " + err.message };
    }
  }
  return heuristicEmail(lead, pain);
}

// Heuristische Vorlage: solide, höflich, auf die erkannte Lösung zugeschnitten.
function heuristicEmail(lead, pain) {
  const sol = pain.bestSolution;
  const firstName = lead.name;
  const evidenceLine =
    pain.evidence.length && pain.confidence === "konkret"
      ? `Mir ist in ein paar Ihrer Google-Bewertungen aufgefallen, dass das Thema ` +
        `"${sol.name.toLowerCase()}" hin und wieder auftaucht — etwa: „${pain.evidence[0].text}".`
      : `Gerade in Ihrer Branche kostet das Thema „${sol.short.toLowerCase()}" oft mehr Zeit, ` +
        `als man denkt.`;

  const subject =
    pain.confidence === "konkret"
      ? `${firstName}: ${sol.name} (kurz, ehrlich)`
      : `Eine ehrliche Frage zu Ihrem Tagesablauf, ${firstName}`;

  const body =
`Guten Tag,

ich bin Zymer Shala von pluszehn aus Bühl. Ich baue für Betriebe hier in der Region einfache KI-Workflows – nichts Großes, sondern genau an der Stelle, die im Alltag Zeit frisst.

${evidenceLine}

Genau dafür gibt es bei uns die Lösung „${sol.name}": ${sol.promise} Im Beispiel sind das ${sol.value.replace("≈ ", "rund ").replace(" pro Jahr", " im Jahr")}.

Der Einstieg ist immer derselbe und kostet nichts: ein KI-Check. 30–45 Minuten, bei Ihnen vor Ort oder per Video. Wir schauen uns einen Ablauf an und ich sage Ihnen ehrlich, ob sich Automatisierung lohnt – auch wenn die Antwort Nein ist.

Wäre das einen kurzen Termin wert? Dann melde ich mich gern.

Herzliche Grüße
Zymer Shala
pluszehn · ${company.phone} · ${company.email}
${company.website}`;

  return { subject, body, model: "vorlage", solutionId: sol.id };
}

async function generateWithClaude(lead, pain) {
  const sol = pain.bestSolution;
  const reviewBlock = (lead.reviews || [])
    .slice(0, 8)
    .map((r) => `- (${r.rating ?? "?"}★) ${r.text}`)
    .join("\n");

  const system =
`Du schreibst kalte, aber persönliche Akquise-Mails für "pluszehn", eine KI- und
Automatisierungs-Beratung von Zymer Shala aus Bühl (Region Baden).

Stil: Du-freie Höflichkeitsform ("Sie"), kurz, ehrlich, kein Verkaufsdruck, keine
Buzzwords, kein "revolutionär/innovativ". Wie der Lösungskatalog: bodenständig,
prozessorientiert, nah am echten Ablauf. Motto: "${company.tagline}" / "${company.claim}".
Immer Einstieg über den KOSTENLOSEN KI-Check (kein direkter Verkauf).

Wichtig: Beziehe dich – wenn vorhanden – konkret und respektvoll auf einen echten
Schmerzpunkt aus den Bewertungen, ohne den Betrieb bloßzustellen oder Bewertungen
wörtlich anzuprangern. Keine erfundenen Fakten. Maximal ~160 Wörter im Mailtext.

Antworte AUSSCHLIESSLICH mit JSON: {"subject": "...", "body": "..."}.
Der body endet mit der Signatur:
Zymer Shala
pluszehn · ${company.phone} · ${company.email}
${company.website}`;

  const user =
`BETRIEB
Name: ${lead.name}
Branche: ${lead.branche || lead.type}
Ort: ${lead.city}
Google-Bewertung: ${lead.rating ?? "?"}★ (${lead.reviewCount || 0} Bewertungen)

PASSENDE pluszehn-LÖSUNG (aus dem Schmerzpunkt-Abgleich): "${sol.name}"
Versprechen: ${sol.promise}
Beispielnutzen: ${sol.value}
Einrichtung: ${sol.setup}
Erkennung: ${pain.confidence === "konkret" ? "konkreter Hinweis in Bewertungen" : "branchenbasiert (kein klarer Bewertungs-Hinweis)"}

BEWERTUNGEN (Originaltext):
${reviewBlock || "(keine Bewertungstexte vorhanden)"}

Schreibe die personalisierte Akquise-Mail.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  const parsed = parseJsonLoose(text);
  if (!parsed || !parsed.subject || !parsed.body) {
    throw new Error("Antwort ohne gültiges JSON");
  }
  return { subject: parsed.subject, body: parsed.body, model: MODEL, solutionId: sol.id };
}

function parseJsonLoose(text) {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}
