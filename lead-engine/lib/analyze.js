// Das Herzstück: Google-Bewertungen lesen → die SCHLECHTEN Bewertungen als
// Aufhänger nehmen → allgemein auf KI & Automatisierung eingehen → einen
// kostenlosen KI-Check anbieten. Die passende pluszehn-Lösung kommt nur als
// konkretes Beispiel dazu.
//
// Funktioniert komplett offline (heuristisch). Liegt ein ANTHROPIC_API_KEY vor,
// schreibt Claude die Mail individuell pro Betrieb.

import { company, solutions, defaultSolutionOrder } from "../config/pluszehn.js";

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

// Ab wann gilt eine Bewertung als "schlecht"? (Sterne)
const BAD_STAR = 3;

function norm(s) {
  return (s || "").toLowerCase();
}

// --- Schritt 1: Schlechte Bewertungen + Schmerzpunkte herausziehen ----------

export function analyzePain(lead) {
  const reviews = lead.reviews || [];

  // Die schlechten Bewertungen sind der eigentliche Aufhänger.
  const negativeReviews = reviews
    .filter((r) => (r.rating ?? 5) <= BAD_STAR && r.text)
    .map((r) => ({ rating: r.rating ?? null, text: clip(r.text, 220) }))
    .slice(0, 4);

  // Nur in den schlechten Bewertungen nach konkreten Themen suchen.
  const badText = norm(
    reviews.filter((r) => (r.rating ?? 5) <= BAD_STAR).map((r) => r.text).join("  ||  ")
  );

  const matches = []; // { solutionId, signal }
  for (const sol of solutions) {
    for (const signal of sol.painSignals) {
      if (badText.includes(signal)) matches.push({ solutionId: sol.id, signal });
    }
  }

  // Welches Thema passt am besten? (nur als konkretes Beispiel für die Mail)
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
  if (!bestSolutionId) bestSolutionId = fallbackSolution(lead);

  return {
    bestSolutionId,
    bestSolution: solutions.find((s) => s.id === bestSolutionId),
    confidence: bestScore > 0 ? "konkret" : "branchenbasiert",
    negativeReviews,
    hasNegative: negativeReviews.length > 0,
    lowStarCount: negativeReviews.length,
    signalCount: matches.length,
  };
}

function fallbackSolution(lead) {
  const b = norm(lead.branche + " " + lead.type);
  if (/steuer|kanzlei|immobilien|autohaus|kfz/.test(b)) return "rechnungen";
  return defaultSolutionOrder[0];
}

function clip(text, n) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n).trim() + " …" : t;
}

// --- Schritt 2: Personalisierte Akquise-Mail (allgemeiner KI-Check-Ansatz) --

export async function generateEmail(lead, pain) {
  if (ANTHROPIC_KEY) {
    try {
      return await generateWithClaude(lead, pain);
    } catch (err) {
      return { ...heuristicEmail(lead, pain), warning: "Claude nicht erreichbar — Vorlage genutzt: " + err.message };
    }
  }
  return heuristicEmail(lead, pain);
}

// Heuristische Vorlage: allgemein auf KI/Automatisierung + kostenlosen KI-Check,
// mit einer schlechten Bewertung als ehrlichem Aufhänger.
function heuristicEmail(lead, pain) {
  const sol = pain.bestSolution;
  const hasNeg = pain.hasNegative;

  const hook = hasNeg
    ? `Mir ist aufgefallen, dass in einigen Ihrer Google-Bewertungen immer wieder ` +
      `dasselbe durchklingt — zum Beispiel: „${pain.negativeReviews[0].text}". Solche ` +
      `Rückmeldungen liegen fast nie an der Arbeit selbst, sondern an Abläufen drumherum, ` +
      `die im Tagesgeschäft untergehen.`
    : `Gerade im Tagesgeschäft gehen oft genau die Abläufe unter, die Kunden am Ende sehen ` +
      `— Anrufe, Rückmeldungen, Angebote.`;

  const subject = hasNeg
    ? `Kurz & ehrlich: ein kostenloser KI-Check für ${lead.name}?`
    : `Ein kostenloser KI-Check für ${lead.name}?`;

  const body =
`Guten Tag,

ich bin Zymer Shala von pluszehn aus Bühl. Ich helfe Betrieben hier in der Region, mit einfacher KI und Automatisierung genau die Abläufe zu entlasten, die im Alltag Zeit und Kunden kosten.

${hook}

Genau dafür gibt es bei uns einen kostenlosen KI-Check: 30–45 Minuten, bei Ihnen vor Ort oder per Video. Wir schauen uns einen Ablauf aus Ihrem Betrieb an und ich sage Ihnen ehrlich, ob sich Automatisierung lohnt – auch wenn die Antwort Nein ist. Kein Verkaufsdruck.

Ein typisches Beispiel aus Ihrer Branche wäre „${sol.name}": ${sol.promise} Aber das klären wir erst, wenn wir Ihren echten Ablauf gesehen haben.

Wäre Ihnen das einen kurzen Termin wert?

Herzliche Grüße
Zymer Shala
pluszehn · ${company.phone} · ${company.email}
${company.website}`;

  return { subject, body, model: "vorlage", solutionId: sol.id };
}

async function generateWithClaude(lead, pain) {
  const sol = pain.bestSolution;
  const negBlock = pain.negativeReviews.length
    ? pain.negativeReviews.map((r) => `- (${r.rating ?? "?"}★) ${r.text}`).join("\n")
    : "(keine negativen Bewertungstexte vorhanden)";

  const system =
`Du schreibst kalte, aber persönliche Akquise-Mails für "pluszehn", eine KI- und
Automatisierungs-Beratung von Zymer Shala aus Bühl (Region Baden).

Ziel der Mail: dem Betrieb einen KOSTENLOSEN KI-Check anbieten. Der Aufhänger ist
allgemein KI & AUTOMATISIERUNG (nicht ein einzelnes Produkt). Nutze – wenn vorhanden –
eine konkrete SCHLECHTE Google-Bewertung als ehrlichen, respektvollen Einstieg, ohne den
Betrieb bloßzustellen. Erwähne EINE passende Automatisierung nur als kurzes Beispiel ("z. B."),
nicht als Hauptangebot.

Stil: Höflichkeitsform ("Sie"), kurz, ehrlich, kein Verkaufsdruck, keine Buzzwords, kein
"revolutionär/innovativ". Bodenständig, prozessorientiert. Motto: "${company.tagline}" /
"${company.claim}". Keine erfundenen Fakten. Maximal ~160 Wörter im Mailtext.

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

SCHLECHTE BEWERTUNGEN (Aufhänger – Originaltext):
${negBlock}

PASSENDES BEISPIEL (nur als "z. B." erwähnen): "${sol.name}" — ${sol.promise}

Schreibe die personalisierte Akquise-Mail mit Angebot eines kostenlosen KI-Checks.`;

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
  if (!parsed || !parsed.subject || !parsed.body) throw new Error("Antwort ohne gültiges JSON");
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
