// Schmerz-Score: Wie "heiß" ist ein Lead für die Akquise?
// Je mehr (schwere) schlechte Bewertungen, je schwächer die Online-Reputation und
// je mehr digitale Lücken (keine Website, keine Online-Terminbuchung …), desto höher.

const recentRe = /tag|stunde|woche/i; // jüngere Bewertungen
const olderRe = /monat|jahr/i; //  ältere Bewertungen

export function scoreLead(lead, pain) {
  const reviews = lead.reviews || [];
  const neg = pain?.negativeReviews || [];
  let score = 0;
  const factors = [];

  // Schlechte Bewertungen — der stärkste Hebel.
  if (neg.length) {
    const pts = Math.min(40, neg.length * 12);
    score += pts;
    factors.push(`${neg.length} schlechte Bewertung${neg.length > 1 ? "en" : ""}`);
  }
  // 1-Stern-Bewertungen wiegen extra schwer.
  const oneStar = neg.filter((r) => (r.rating || 5) <= 1).length;
  if (oneStar) {
    score += oneStar * 6;
    factors.push(`${oneStar}× 1-Stern`);
  }
  // Schwacher Gesamt-Schnitt.
  if (lead.rating != null) {
    const p = Math.max(0, Math.round((4.5 - lead.rating) * 10));
    if (p > 0) {
      score += p;
      factors.push(`Schnitt ${lead.rating}★`);
    }
  }

  // Digitale Lücken / Schwächen.
  const weaknesses = detectWeaknesses(lead);
  score += weaknesses.length * 6;

  // Bewertungs-Trend.
  const trend = detectTrend(reviews);
  if (trend.dir === "fallend") {
    score += 10;
    factors.push("Negativ-Trend");
  }

  score = Math.min(100, Math.round(score));
  const tier = score >= 60 ? "heiss" : score >= 32 ? "warm" : "kuehl";

  return { score, tier, factors, weaknesses, trend };
}

export function detectWeaknesses(lead) {
  const w = [];
  if (!lead.website) w.push("Keine Website");
  if (!lead.email) w.push("Keine E-Mail auffindbar");
  if (lead.rating != null && lead.rating <= 3.2) w.push("Schwache Reputation (≤ 3,2★)");
  if (!Object.keys(lead.socials || {}).length) w.push("Kein Social-Media-Profil");
  // Lücken, die die Website-Anreicherung gemeldet hat (z. B. keine Online-Terminbuchung).
  for (const g of lead.webGaps || []) w.push(g);
  return [...new Set(w)];
}

function detectTrend(reviews) {
  const withTime = reviews.filter((r) => r.rating != null && r.time);
  const recent = withTime.filter((r) => recentRe.test(r.time));
  const older = withTime.filter((r) => olderRe.test(r.time));
  if (!recent.length || !older.length) return { dir: "unklar" };
  const avg = (xs) => xs.reduce((s, r) => s + r.rating, 0) / xs.length;
  const r = avg(recent);
  const o = avg(older);
  if (r < o - 0.5) return { dir: "fallend", recent: +r.toFixed(1), older: +o.toFixed(1) };
  if (r > o + 0.5) return { dir: "steigend", recent: +r.toFixed(1), older: +o.toFixed(1) };
  return { dir: "stabil", recent: +r.toFixed(1), older: +o.toFixed(1) };
}
