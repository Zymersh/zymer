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

// --- Schritt 2: Personalisierte Botschaft (mehrere Varianten) ---------------
// type: "email" | "kurz" | "anruf" | "whatsapp" | "followup"

const TYPE_LABEL = {
  email: "E-Mail", kurz: "Kurz-Mail", anruf: "Anruf-Skript", whatsapp: "WhatsApp", followup: "Nachfass-Mail",
};

export async function generateMessage(lead, pain, type = "email") {
  if (!TYPE_LABEL[type]) type = "email";
  if (ANTHROPIC_KEY) {
    try {
      return await generateWithClaude(lead, pain, type);
    } catch (err) {
      return { ...heuristicMessage(lead, pain, type), warning: "Claude nicht erreichbar — Vorlage genutzt: " + err.message };
    }
  }
  return heuristicMessage(lead, pain, type);
}

function hookText(lead, pain) {
  return pain.hasNegative
    ? `Mir ist aufgefallen, dass in einigen Ihrer Google-Bewertungen immer wieder dasselbe ` +
      `durchklingt — zum Beispiel: „${pain.negativeReviews[0].text}". Solche Rückmeldungen ` +
      `liegen fast nie an der Arbeit selbst, sondern an Abläufen drumherum.`
    : `Gerade im Tagesgeschäft gehen oft genau die Abläufe unter, die Kunden am Ende sehen — ` +
      `Anrufe, Rückmeldungen, Angebote.`;
}

// Heuristische Vorlagen je Variante.
function heuristicMessage(lead, pain, type) {
  const sol = pain.bestSolution;
  const sig = `Zymer Shala\npluszehn · ${company.phone} · ${company.email}\n${company.website}`;

  if (type === "kurz") {
    return {
      type,
      subject: `Kostenloser KI-Check für ${lead.name}?`,
      body:
`Guten Tag,

Zymer Shala von pluszehn aus Bühl. ${pain.hasNegative ? "Ein paar Ihrer Google-Bewertungen deuten auf Abläufe hin, die im Alltag Zeit und Kunden kosten." : "Im Tagesgeschäft gehen oft die Abläufe unter, die Kunden am Ende sehen."} Genau da setze ich mit einfacher KI & Automatisierung an.

Ich biete Ihnen einen kostenlosen KI-Check an: 30 Minuten, vor Ort oder per Video, ehrliche Einschätzung, kein Verkaufsdruck. Interesse?

${sig}`,
      model: "vorlage", solutionId: sol.id,
    };
  }

  if (type === "anruf") {
    return {
      type,
      subject: `Anruf-Skript: ${lead.name}`,
      body:
`ZIEL: kostenlosen KI-Check anbieten (kein Verkauf am Telefon).

EINSTIEG
„Guten Tag, hier ist Zymer Shala von pluszehn aus Bühl. Haben Sie 30 Sekunden? — Ich helfe Betrieben hier in der Region, mit einfacher KI und Automatisierung Zeit zu sparen."

AUFHÄNGER
${pain.hasNegative
  ? `„Mir ist in Ihren Online-Bewertungen aufgefallen, dass das Thema ${sol.name.toLowerCase()} ein paar Mal auftaucht — das liegt fast nie an der Arbeit, sondern an Abläufen drumherum."`
  : `„Gerade in Ihrer Branche kosten ein, zwei Abläufe oft mehr Zeit als man denkt — Anrufe, Rückmeldungen, Angebote."`}

ANGEBOT
„Ich mache dazu einen kostenlosen KI-Check: 30–45 Minuten, bei Ihnen oder per Video. Ich sage Ihnen ehrlich, ob sich Automatisierung lohnt — auch wenn die Antwort Nein ist."

ABSCHLUSS
„Passt Ihnen diese oder nächste Woche besser?"

BEI EINWAND „keine Zeit": „Genau darum geht's ja — der Check kostet nichts und Sie entscheiden danach. Soll ich Ihnen kurz per Mail zwei Terminvorschläge schicken?"

Kontakt: ${company.phone} · ${company.email}`,
      model: "vorlage", solutionId: sol.id,
    };
  }

  if (type === "whatsapp") {
    return {
      type,
      subject: `WhatsApp: ${lead.name}`,
      body:
`Hallo, hier ist Zymer Shala von pluszehn aus Bühl 👋

Ich helfe Betrieben in der Region, mit einfacher KI & Automatisierung Zeit zu sparen (z. B. Anrufe, Termin-Nacharbeit, Rechnungen). ${pain.hasNegative ? "Ein paar Ihrer Online-Bewertungen deuten genau auf so einen Ablauf hin." : ""}

Ich biete Ihnen dazu einen kostenlosen KI-Check an – 30 Min., vor Ort oder per Video, ehrliche Einschätzung, kein Verkaufsdruck.

Wäre das interessant für Sie?
– Zymer, ${company.phone}`,
      model: "vorlage", solutionId: sol.id,
    };
  }

  if (type === "followup") {
    return {
      type,
      subject: `Nachfrage: kostenloser KI-Check für ${lead.name}`,
      body:
`Guten Tag,

ich hatte Ihnen vor Kurzem geschrieben — kein Stress, ich weiß, wie voll so ein Betriebsalltag ist. Daher nur ganz kurz die Erinnerung: Mein Angebot für einen kostenlosen KI-Check steht weiterhin.

30–45 Minuten, vor Ort oder per Video, ehrliche Einschätzung, ob sich Automatisierung für einen Ihrer Abläufe lohnt. Kein Verkaufsdruck.

Falls es gerade nicht passt, sagen Sie einfach kurz Bescheid — dann lasse ich Sie in Ruhe.

Herzliche Grüße
${sig}`,
      model: "vorlage", solutionId: sol.id,
    };
  }

  // Standard: ausführliche E-Mail
  return {
    type: "email",
    subject: pain.hasNegative ? `Kurz & ehrlich: ein kostenloser KI-Check für ${lead.name}?` : `Ein kostenloser KI-Check für ${lead.name}?`,
    body:
`Guten Tag,

ich bin Zymer Shala von pluszehn aus Bühl. Ich helfe Betrieben hier in der Region, mit einfacher KI und Automatisierung genau die Abläufe zu entlasten, die im Alltag Zeit und Kunden kosten.

${hookText(lead, pain)}

Genau dafür gibt es bei uns einen kostenlosen KI-Check: 30–45 Minuten, bei Ihnen vor Ort oder per Video. Wir schauen uns einen Ablauf aus Ihrem Betrieb an und ich sage Ihnen ehrlich, ob sich Automatisierung lohnt – auch wenn die Antwort Nein ist. Kein Verkaufsdruck.

Ein typisches Beispiel aus Ihrer Branche wäre „${sol.name}": ${sol.promise} Aber das klären wir erst, wenn wir Ihren echten Ablauf gesehen haben.

Wäre Ihnen das einen kurzen Termin wert?

Herzliche Grüße
${sig}`,
    model: "vorlage", solutionId: sol.id,
  };
}

const TYPE_BRIEF = {
  email: "eine ausführliche E-Mail (~160 Wörter)",
  kurz: "eine sehr kurze E-Mail (max. 70 Wörter, schnell zu lesen)",
  anruf: "ein Telefon-Gesprächs-SKRIPT mit Abschnitten (Einstieg, Aufhänger, Angebot, Abschluss, Einwand-Antwort)",
  whatsapp: "eine kurze, lockere WhatsApp-Nachricht (max. 60 Wörter, ein Emoji erlaubt, Du-frei in Sie-Form)",
  followup: "eine kurze, höfliche NACHFASS-E-Mail (Bezug auf eine frühere Nachricht, kein Druck)",
};

async function generateWithClaude(lead, pain, type) {
  const sol = pain.bestSolution;
  const negBlock = pain.negativeReviews.length
    ? pain.negativeReviews.map((r) => `- (${r.rating ?? "?"}★) ${r.text}`).join("\n")
    : "(keine negativen Bewertungstexte vorhanden)";
  const weaknesses = (lead.pain?.weaknesses || lead.weaknesses || []).join(", ") || "—";

  const system =
`Du schreibst Akquise-Botschaften für "pluszehn", eine KI- und Automatisierungs-Beratung
von Zymer Shala aus Bühl (Region Baden). Erzeuge: ${TYPE_BRIEF[type]}.

Ziel: dem Betrieb einen KOSTENLOSEN KI-Check anbieten. Aufhänger ist allgemein KI &
AUTOMATISIERUNG (kein Einzelprodukt). Nutze – wenn vorhanden – eine konkrete SCHLECHTE
Bewertung ODER eine digitale Lücke als ehrlichen, respektvollen Einstieg, ohne den Betrieb
bloßzustellen. Erwähne EINE passende Automatisierung höchstens als kurzes Beispiel ("z. B.").

Stil: Höflichkeitsform ("Sie"), ehrlich, kein Verkaufsdruck, keine Buzzwords. Bodenständig.
Motto: "${company.tagline}" / "${company.claim}". Keine erfundenen Fakten.

Antworte AUSSCHLIESSLICH mit JSON: {"subject": "...", "body": "..."}.
${type === "anruf" ? '"subject" ist eine kurze Überschrift; "body" das Skript.' :
  type === "whatsapp" ? '"subject" ist eine kurze Notiz; "body" die WhatsApp-Nachricht (keine Mail-Signatur, nur "– Zymer, ' + company.phone + '").' :
  'Der body endet mit der Signatur:\nZymer Shala\npluszehn · ' + company.phone + ' · ' + company.email + '\n' + company.website}`;

  const user =
`BETRIEB
Name: ${lead.name}
Branche: ${lead.branche || lead.type}
Ort: ${lead.city}
Google-Bewertung: ${lead.rating ?? "keine"}★ (${lead.reviewCount || 0} Bewertungen)
Digitale Lücken: ${weaknesses}

SCHLECHTE BEWERTUNGEN (Aufhänger – Originaltext):
${negBlock}

PASSENDES BEISPIEL (nur als "z. B." erwähnen): "${sol.name}" — ${sol.promise}

Erzeuge ${TYPE_BRIEF[type]} mit Angebot eines kostenlosen KI-Checks.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: 1400, system, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  const parsed = parseJsonLoose(text);
  if (!parsed || !parsed.subject || !parsed.body) throw new Error("Antwort ohne gültiges JSON");
  return { type, subject: parsed.subject, body: parsed.body, model: MODEL, solutionId: sol.id };
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
